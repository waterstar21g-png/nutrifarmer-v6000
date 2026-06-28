#!/usr/bin/env node
/**
 * v5000_posts 본문·미러 DB 기준 — R2 미반영 wp-content URL 재시도
 * Usage: npm run r2:retry-missing
 */
import { PutObjectCommand, HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { neon } from '@neondatabase/serverless';
import { loadEnvFiles, getPostgresUrl, loadR2EnvFallback } from './_load-env.mjs';

loadEnvFiles();
loadR2EnvFallback();

const dbUrl = getPostgresUrl();
const R2_ACCOUNT = process.env.R2_ACCOUNT_ID?.trim();
const R2_KEY = process.env.R2_ACCESS_KEY_ID?.trim();
const R2_SECRET = process.env.R2_SECRET_ACCESS_KEY?.trim();
const R2_BUCKET = process.env.R2_BUCKET_NAME?.trim();
const CDN = process.env.NEXT_PUBLIC_CDN_URL?.trim().replace(/\/$/, '');

if (!dbUrl || !R2_ACCOUNT || !R2_KEY || !R2_SECRET || !R2_BUCKET) {
  console.error('POSTGRES_URL + R2_* required');
  process.exit(1);
}

const sql = neon(dbUrl);
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_KEY, secretAccessKey: R2_SECRET },
});

const WP_UPLOADS_RE = /https?:\/\/[^"'\s>]+\/wp-content\/uploads\/[^"'\s>)]+/gi;

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
  const m = wpUrl.match(/\/wp-content\/uploads\/(.+)$/i);
  if (!m) return null;
  return `uploads/${decodeURIComponent(m[1])}`;
}

function publicUrl(key) {
  return CDN ? `${CDN}/${key}` : `https://${R2_ACCOUNT}.r2.cloudflarestorage.com/${R2_BUCKET}/${key}`;
}

async function r2Exists(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function downloadCandidates(url) {
  const norm = normalizeUrl(url);
  const hosts = [
    norm,
    norm.replace('https://www.nutrifarmer.kr', 'https://old.nutrifarmer.kr'),
    norm.replace('https://old.nutrifarmer.kr', 'https://www.nutrifarmer.kr'),
  ];
  for (const u of [...new Set(hosts)]) {
    try {
      const res = await fetch(u, { signal: AbortSignal.timeout(60000) });
      if (res.ok) return { body: Buffer.from(await res.arrayBuffer()), mime: res.headers.get('content-type')?.split(';')[0]?.trim(), url: u };
    } catch { /* next */ }
  }
  return null;
}

async function main() {
  const [posts, mirrored] = await Promise.all([
    sql`select body from v5000_posts where status = 'publish'`,
    sql`select wp_url from v5000_media_mirror`,
  ]);
  const mirroredSet = new Set(mirrored.map(r => normalizeUrl(r.wp_url)));

  const missing = new Set();
  for (const row of posts) {
    const html = row.body || '';
    let m;
    WP_UPLOADS_RE.lastIndex = 0;
    while ((m = WP_UPLOADS_RE.exec(html)) !== null) {
      const norm = normalizeUrl(m[0]);
      if (!mirroredSet.has(norm)) missing.add(norm);
    }
  }

  console.log(`Missing mirror URLs in posts: ${missing.size}`);
  if (missing.size === 0) {
    console.log('Nothing to retry.');
    return;
  }

  let ok = 0, fail = 0;
  for (const url of missing) {
    const key = wpToR2Key(url);
    if (!key) { fail++; continue; }

    const existing = await sql`select id from v5000_media_mirror where wp_url = ${url} limit 1`;
    if (existing.length > 0) continue;

    const dl = await downloadCandidates(url);
    if (!dl) {
      console.warn('FAIL download:', url.slice(-60));
      fail++;
      continue;
    }

    if (!(await r2Exists(key))) {
      await s3.send(new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: dl.body,
        ContentType: dl.mime || 'application/octet-stream',
      }));
    }

    const pub = publicUrl(key);
    await sql`
      insert into v5000_media_mirror (wp_url, r2_key, public_url, mime, size_bytes)
      values (${url}, ${key}, ${pub}, ${dl.mime || null}, ${dl.body.length})
      on conflict (wp_url) do nothing
    `;
    ok++;
    console.log('OK', key);
  }

  const total = await sql`select count(*)::int as c from v5000_media_mirror`;
  console.log(`\nRetry done: ok=${ok} fail=${fail} mirror_total=${total[0].c}`);
}

main().catch(e => { console.error(e); process.exit(1); });
