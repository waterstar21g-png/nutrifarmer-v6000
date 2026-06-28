import { neon } from '@neondatabase/serverless';
import { loadEnvFiles, getPostgresUrl } from './_load-env.mjs';

loadEnvFiles();
const sql = neon(getPostgresUrl());
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

const [posts, mirrored] = await Promise.all([
  sql`select body from v5000_posts where status = 'publish'`,
  sql`select wp_url from v5000_media_mirror`,
]);
const mirroredSet = new Set(mirrored.map(r => normalizeUrl(r.wp_url)));
const missing = new Set();
for (const row of posts) {
  let m;
  WP_UPLOADS_RE.lastIndex = 0;
  while ((m = WP_UPLOADS_RE.exec(row.body || '')) !== null) {
    const norm = normalizeUrl(m[0]);
    if (!mirroredSet.has(norm)) missing.add(norm);
  }
}
console.log('mirror rows:', mirrored.length);
console.log('missing in posts:', missing.size);
if (missing.size) [...missing].slice(0, 5).forEach(u => console.log(' -', u.slice(-80)));
