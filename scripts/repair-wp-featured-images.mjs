#!/usr/bin/env node
/**
 * Imported WP posts often keep their visual image as featured_media, not body <img>.
 * This repair prepends the featured image to V5000 body only when the body has no image.
 */
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { neon } from '@neondatabase/serverless';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const write = process.argv.includes('--write');

function loadEnvLocal() {
  for (const name of ['.env.local', '.env.migrate']) {
    const envPath = join(root, name);
    if (!existsSync(envPath)) continue;
    for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq < 1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return {
    data: await res.json(),
    totalPages: Number(res.headers.get('x-wp-totalpages') ?? 1),
  };
}

async function fetchAllWpPosts(wpApi) {
  const posts = [];
  let page = 1;
  let totalPages = 1;
  do {
    const result = await fetchJson(`${wpApi}/wp/v2/posts?per_page=100&page=${page}&status=publish&_embed=1`);
    totalPages = result.totalPages;
    posts.push(...result.data);
    page++;
  } while (page <= totalPages);
  return posts;
}

function featuredUrl(post) {
  return post._embedded?.['wp:featuredmedia']?.[0]?.source_url || '';
}

function mediaAlt(post) {
  return post._embedded?.['wp:featuredmedia']?.[0]?.alt_text || post.title?.rendered?.replace(/<[^>]+>/g, '') || '이미지';
}

function rewriteUrl(url, mirror) {
  return mirror.get(url) ?? mirror.get(url.replace(/^http:\/\//, 'https://')) ?? url;
}

function figure(url, alt) {
  const safeUrl = String(url).replace(/"/g, '&quot;');
  const safeAlt = String(alt).replace(/"/g, '&quot;').slice(0, 100);
  return `<figure class="nfw-body-img" data-width="640" style="width:640px"><img src="${safeUrl}" alt="${safeAlt}" /></figure>\n\n`;
}

async function main() {
  loadEnvLocal();
  const dbUrl =
    process.env.POSTGRES_URL_NON_POOLING?.trim() ||
    process.env.DATABASE_URL_UNPOOLED?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    process.env.DATABASE_URL?.trim();
  if (!dbUrl) throw new Error('POSTGRES_URL or DATABASE_URL is required');

  const wpApi = (process.env.WP_API_URL?.trim() || 'https://old.nutrifarmer.kr/wp-json').replace(/\/$/, '');
  const sql = neon(dbUrl);

  const [wpPosts, mirrorRows, vRows] = await Promise.all([
    fetchAllWpPosts(wpApi),
    sql`select wp_url, public_url from v5000_media_mirror`,
    sql`select id, slug, body from v5000_posts`,
  ]);

  const mirror = new Map(mirrorRows.map(r => [r.wp_url, r.public_url]));
  const bySlug = new Map(vRows.map(r => [r.slug, r]));
  let candidates = 0;
  let updated = 0;
  let skippedWithBodyImage = 0;
  let missingFeatured = 0;

  for (const post of wpPosts) {
    const row = bySlug.get(post.slug);
    if (!row) continue;
    if (/<img\b/i.test(row.body || '')) {
      skippedWithBodyImage++;
      continue;
    }
    const raw = featuredUrl(post);
    if (!raw) {
      missingFeatured++;
      continue;
    }
    candidates++;
    const html = figure(rewriteUrl(raw, mirror), mediaAlt(post)) + (row.body || '');
    if (write) {
      await sql`update v5000_posts set body = ${html}, updated_at = updated_at where id = ${row.id}`;
      updated++;
    }
  }

  console.log(JSON.stringify({
    mode: write ? 'WRITE' : 'DRY-RUN',
    wpPosts: wpPosts.length,
    candidates,
    updated,
    skippedWithBodyImage,
    missingFeatured,
  }, null, 2));
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
