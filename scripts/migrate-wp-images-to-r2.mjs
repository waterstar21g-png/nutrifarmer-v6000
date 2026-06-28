#!/usr/bin/env node
/**
 * WordPress 미디어 → Cloudflare R2 + v5000_media_mirror
 * Usage: npm run media:migrate-wp
 * Requires: .env.local (POSTGRES_URL, R2_*, NEXT_PUBLIC_CDN_URL)
 */
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PutObjectCommand, HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { neon } from '@neondatabase/serverless';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadR2FromLocalKeysFile() {
  if (process.env.R2_ACCOUNT_ID?.trim() && process.env.R2_ACCESS_KEY_ID?.trim()) return;
  const keysPath = join(root, '..', 'NotePad_자료', 'Access_Key_Secret_Access_Key_API_KEY_Cloudflare_R2_Storage.txt');
  if (!existsSync(keysPath)) return;
  const text = readFileSync(keysPath, 'utf8');
  const access = text.match(/Access Key ID\s*:?\s*([a-f0-9]+)/i)?.[1];
  const secret = text.match(/Secret Access Key\s*:?\s*([a-f0-9]+)/i)?.[1];
  const account = text.match(/https:\/\/([a-f0-9]+)\.r2\.cloudflarestorage\.com/i)?.[1];
  if (access) process.env.R2_ACCESS_KEY_ID = access;
  if (secret) process.env.R2_SECRET_ACCESS_KEY = secret;
  if (account) process.env.R2_ACCOUNT_ID = account;
  if (!process.env.R2_BUCKET_NAME?.trim()) process.env.R2_BUCKET_NAME = 'nutrifarmer-media';
  if (!process.env.NEXT_PUBLIC_CDN_URL?.trim()) process.env.NEXT_PUBLIC_CDN_URL = 'https://media.nutrifarmer.kr';
}

function loadEnvFiles() {
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

loadEnvFiles();
loadR2FromLocalKeysFile();

const WP_API = process.env.WP_API_URL?.trim() || 'https://old.nutrifarmer.kr/wp-json';
const dbUrl =
  process.env.POSTGRES_URL_NON_POOLING?.trim() ||
  process.env.DATABASE_URL_UNPOOLED?.trim() ||
  process.env.POSTGRES_URL?.trim() ||
  process.env.DATABASE_URL?.trim();

const R2_ACCOUNT = process.env.R2_ACCOUNT_ID?.trim();
const R2_KEY = process.env.R2_ACCESS_KEY_ID?.trim();
const R2_SECRET = process.env.R2_SECRET_ACCESS_KEY?.trim();
const R2_BUCKET = process.env.R2_BUCKET_NAME?.trim();
const CDN = process.env.NEXT_PUBLIC_CDN_URL?.trim().replace(/\/$/, '');

if (!dbUrl) { console.error('POSTGRES_URL required'); process.exit(1); }
if (!R2_ACCOUNT || !R2_KEY || !R2_SECRET || !R2_BUCKET) {
  console.error('R2_* env required');
  process.exit(1);
}

const sql = neon(dbUrl);
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_KEY, secretAccessKey: R2_SECRET },
});

const WP_UPLOADS_RE = /\/wp-content\/uploads\/(.+)$/i;

function normalizeUrl(url) {
  try {
    const u = new URL(url.trim());
    u.hash = '';
    u.search = '';
    return u.href;
  } catch {
    return url.trim();
  }
}

function wpToR2Key(wpUrl) {
  const m = wpUrl.match(WP_UPLOADS_RE);
  if (!m) return null;
  return `uploads/${decodeURIComponent(m[1])}`;
}

function publicUrl(key) {
  if (CDN) return `${CDN}/${key}`;
  return `https://${R2_ACCOUNT}.r2.cloudflarestorage.com/${R2_BUCKET}/${key}`;
}

function mimeFromExt(path) {
  const ext = path.split('.').pop()?.toLowerCase();
  const map = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
    mp4: 'video/mp4', pdf: 'application/pdf',
  };
  return map[ext] || 'application/octet-stream';
}

function extractUrlsFromHtml(html) {
  const urls = new Set();
  const re = /https?:\/\/[^"'\s>]+\/wp-content\/uploads\/[^"'\s>)]+/gi;
  let m;
  while ((m = re.exec(html)) !== null) urls.add(normalizeUrl(m[0]));
  return urls;
}

async function wpFetch(path) {
  const res = await fetch(`${WP_API}${path}`);
  if (!res.ok) throw new Error(`WP ${res.status}: ${path}`);
  return res;
}

async function collectWpImageUrls() {
  const urls = new Map(); // normUrl -> { wpMediaId, alt }

  // 1) 미디어 라이브러리
  let page = 1;
  while (true) {
    const res = await wpFetch(`/wp/v2/media?per_page=100&page=${page}&mime_type=image`);
    const items = await res.json();
    if (!Array.isArray(items) || items.length === 0) break;
    for (const item of items) {
      const src = item.source_url;
      if (!src) continue;
      urls.set(normalizeUrl(src), {
        wpMediaId: item.id,
        alt: item.alt_text || item.title?.rendered || '',
        mime: item.mime_type || mimeFromExt(src),
      });
    }
    const totalPages = parseInt(res.headers.get('X-WP-TotalPages') || '1', 10);
    if (page >= totalPages) break;
    page++;
  }

  // 2) 글 featured + 본문 이미지
  page = 1;
  while (true) {
    const res = await wpFetch(`/wp/v2/posts?per_page=100&page=${page}&status=publish&_embed=1`);
    const posts = await res.json();
    if (!Array.isArray(posts) || posts.length === 0) break;
    for (const post of posts) {
      const feat = post._embedded?.['wp:featuredmedia']?.[0];
      if (feat?.source_url) {
        const norm = normalizeUrl(feat.source_url);
        if (!urls.has(norm)) {
          urls.set(norm, { wpMediaId: feat.id, alt: feat.alt_text || '', mime: mimeFromExt(feat.source_url) });
        }
      }
      for (const u of extractUrlsFromHtml(post.content?.rendered || '')) {
        if (!urls.has(u)) urls.set(u, { wpMediaId: null, alt: '', mime: mimeFromExt(u) });
      }
    }
    const totalPages = parseInt(res.headers.get('X-WP-TotalPages') || '1', 10);
    if (page >= totalPages) break;
    page++;
  }

  return urls;
}

async function r2Exists(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function migrateOne(wpUrl, meta) {
  const norm = normalizeUrl(wpUrl);
  const key = wpToR2Key(norm);
  if (!key) {
    console.warn('  skip (not uploads):', norm.slice(0, 80));
    return 'skip';
  }

  const existing = await sql`SELECT id FROM v5000_media_mirror WHERE wp_url = ${norm} LIMIT 1`;
  if (existing.length > 0) return 'exists';

  let body;
  let mime = meta.mime || mimeFromExt(key);
  try {
    const res = await fetch(norm, { signal: AbortSignal.timeout(60000) });
    if (!res.ok) {
      console.warn('  download fail', res.status, norm.slice(0, 70));
      return 'fail';
    }
    mime = res.headers.get('content-type')?.split(';')[0]?.trim() || mime;
    body = Buffer.from(await res.arrayBuffer());
  } catch (e) {
    console.warn('  download error', norm.slice(0, 70), e.message);
    return 'fail';
  }

  if (!(await r2Exists(key))) {
    await s3.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: mime,
    }));
  }

  const pub = publicUrl(key);
  await sql`
    INSERT INTO v5000_media_mirror (wp_url, wp_media_id, r2_key, public_url, mime, alt, size_bytes)
    VALUES (${norm}, ${meta.wpMediaId}, ${key}, ${pub}, ${mime}, ${meta.alt || null}, ${body.length})
    ON CONFLICT (wp_url) DO NOTHING
  `;
  return 'ok';
}

async function main() {
  console.log('Collecting WordPress image URLs…');
  const urls = await collectWpImageUrls();
  console.log(`Found ${urls.size} unique image URLs\n`);

  let ok = 0, exists = 0, fail = 0, skip = 0;
  let i = 0;
  for (const [url, meta] of urls) {
    i++;
    process.stdout.write(`[${i}/${urls.size}] `);
    const r = await migrateOne(url, meta);
    if (r === 'ok') { ok++; console.log('uploaded', url.slice(-50)); }
    else if (r === 'exists') { exists++; console.log('exists', url.slice(-50)); }
    else if (r === 'skip') skip++;
    else { fail++; }
  }

  console.log(`\nDone: uploaded=${ok} exists=${exists} fail=${fail} skip=${skip}`);
  console.log(`CDN base: ${CDN || '(R2 direct)'}`);
}

main().catch(e => { console.error(e); process.exit(1); });
