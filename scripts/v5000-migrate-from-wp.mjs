#!/usr/bin/env node
/**
 * WordPress published posts -> V5000 Postgres
 *
 * Default is dry-run:
 *   node scripts/v5000-migrate-from-wp.mjs
 *
 * Write mode:
 *   node scripts/v5000-migrate-from-wp.mjs --write
 */
import { neon } from '@neondatabase/serverless';
import { loadEnvFiles, getPostgresUrl } from './_load-env.mjs';
import { fetchAllWpPages, resolveWpApiBase } from './_wp-api.mjs';

const args = new Set(process.argv.slice(2));
const write = args.has('--write');
const limitArg = process.argv.find(a => a.startsWith('--limit='));
const limit = limitArg ? Math.max(1, Number(limitArg.split('=')[1])) : 0;

const VALID_CATEGORY_SLUGS = new Set([
  'daily-life',
  'family-growth',
  'personal-archive',
  'archive-dev',
  'life-photos',
  'revenue',
  'pro-writing',
  'fresh-news',
  'about-memoir',
  'about-program',
  'family-grandson',
  'family-children',
  'family-photos',
  'family-special',
]);

const LEGACY_CATEGORY_MAP = new Map([
  ['daily-life-%ec%9d%bc%ec%83%81%ea%b8%b0%eb%a1%9d0', 'daily-life'],
  ['family-growth-%ea%b0%80%ec%a1%b1%c2%b7%ec%84%b1%ec%9e%a50', 'family-growth'],
  ['personal-archive-%ea%b0%9c%ec%9d%b8-%ec%9e%90%eb%a3%8c0', 'personal-archive'],
  ['life-photos-%ec%82%b6%c2%b7%ec%82%ac%ec%a7%840', 'life-photos'],
  ['revenue-%ec%88%98%ec%9d%b5%ea%b4%80%eb%a6%ac0', 'revenue'],
  ['pro-writing-%ec%a0%84%eb%ac%b8%ea%b8%80%ec%93%b0%ea%b8%b00', 'pro-writing'],
  ['fresh-news-%ec%a3%bc%eb%b3%80%eb%89%b4%ec%8a%a40', 'fresh-news'],
  ['uncategorized', 'personal-archive'],
]);

function loadEnvLocal() {
  loadEnvFiles();
}

function stripHtml(html = '') {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeEntities(text = '') {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function sqlLikeDate(value) {
  const d = value ? new Date(value) : new Date();
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function resolveCategorySlug(post, categoryById) {
  const embedded = post._embedded?.['wp:term']?.[0]?.find(t => t.taxonomy === 'category');
  const raw = embedded?.slug ?? categoryById.get(post.categories?.[0])?.slug ?? 'personal-archive';
  const mapped = LEGACY_CATEGORY_MAP.get(raw) ?? raw;
  return VALID_CATEGORY_SLUGS.has(mapped) ? mapped : 'personal-archive';
}

function replaceAllLiteral(input, from, to) {
  return input.split(from).join(to);
}

function rewriteMediaUrls(html, mirrorRows) {
  let out = html || '';
  for (const row of mirrorRows) {
    if (!row.wp_url || !row.public_url) continue;
    out = replaceAllLiteral(out, row.wp_url, row.public_url);
    out = replaceAllLiteral(out, row.wp_url.replace(/^http:\/\//, 'https://'), row.public_url);
  }
  return out;
}

async function fetchAllWpCategories() {
  const { items } = await fetchAllWpPages(
    page => `/wp/v2/categories?per_page=100&hide_empty=0&page=${page}`,
  );
  return new Map(items.map(c => [c.id, c]));
}

async function fetchAllWpPosts() {
  const { items } = await fetchAllWpPages(
    page => `/wp/v2/posts?per_page=100&page=${page}&status=publish&orderby=date&order=asc&_embed=1`,
  );
  if (limit) return items.slice(0, limit);
  return items;
}

async function main() {
  loadEnvLocal();

  const dbUrl = getPostgresUrl();
  if (!dbUrl) throw new Error('POSTGRES_URL or DATABASE_URL is required');

  const sql = neon(dbUrl);
  console.log(`WP API: ${resolveWpApiBase()}`);
  const authorIdEnv = process.env.V5000_IMPORT_AUTHOR_ID?.trim();
  const authorRows = authorIdEnv
    ? [{ id: Number(authorIdEnv) }]
    : await sql`select id from v5000_users order by case when role = 'admin' then 0 else 1 end, id limit 1`;
  const authorId = authorRows[0]?.id;
  if (!authorId) throw new Error('No v5000_users author found. Create/login a V5000 user first.');

  const [categoryById, mirrorRows, existingRows, wpPosts] = await Promise.all([
    fetchAllWpCategories(),
    sql`select wp_url, public_url from v5000_media_mirror`,
    sql`select slug from v5000_posts`,
    fetchAllWpPosts(),
  ]);

  console.log(`Fetched ${wpPosts.length} WP posts`);

  const existingSlugs = new Set(existingRows.map(r => r.slug));
  const stats = {
    wp: wpPosts.length,
    existing: 0,
    imported: 0,
    dryRunWouldImport: 0,
    failed: 0,
  };
  const byCategory = new Map();

  console.log(`\nMode: ${write ? 'WRITE' : 'DRY-RUN'}`);
  console.log(`Author ID: ${authorId}`);
  console.log(`Media mirror rows: ${mirrorRows.length}`);
  console.log(`Existing V5000 post slugs: ${existingSlugs.size}`);

  for (const post of wpPosts) {
    const title = decodeEntities(stripHtml(post.title?.rendered || '(제목 없음)')).slice(0, 500) || '(제목 없음)';
    const slug = String(post.slug || `wp-${post.id}`).slice(0, 200);
    const categorySlug = resolveCategorySlug(post, categoryById);
    byCategory.set(categorySlug, (byCategory.get(categorySlug) ?? 0) + 1);

    if (existingSlugs.has(slug)) {
      stats.existing++;
      continue;
    }

    const body = rewriteMediaUrls(post.content?.rendered || '', mirrorRows);
    const excerpt = decodeEntities(stripHtml(post.excerpt?.rendered || '')).slice(0, 2000);
    const publishedAt = sqlLikeDate(post.date_gmt ? `${post.date_gmt}Z` : post.date);
    const updatedAt = sqlLikeDate(post.modified_gmt ? `${post.modified_gmt}Z` : post.modified || post.date);

    if (!write) {
      stats.dryRunWouldImport++;
      continue;
    }

    try {
      await sql`
        insert into v5000_posts
          (slug, title, body, excerpt, status, author_id, category_slug, published_at, created_at, updated_at)
        values
          (${slug}, ${title}, ${body}, ${excerpt}, 'publish', ${authorId}, ${categorySlug}, ${publishedAt}, ${publishedAt}, ${updatedAt})
      `;
      existingSlugs.add(slug);
      stats.imported++;
    } catch (e) {
      stats.failed++;
      console.error(`Failed wp:${post.id} ${slug}:`, e.message);
    }
  }

  console.log('\nCategory counts from WP source:');
  for (const [slug, count] of [...byCategory.entries()].sort()) {
    console.log(`- ${slug}: ${count}`);
  }

  console.log('\nResult:');
  console.log(JSON.stringify(stats, null, 2));
  if (!write) {
    console.log('\nDry-run only. Re-run with --write to import.');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
