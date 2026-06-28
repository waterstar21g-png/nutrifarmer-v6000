#!/usr/bin/env node
/**
 * v5000_media_mirror — www ↔ old 호스트 wp_url 별칭 일괄 추가
 * Usage: npm run r2:backfill-hosts
 */
import { neon } from '@neondatabase/serverless';
import { loadEnvFiles, getPostgresUrl } from './_load-env.mjs';

loadEnvFiles();
const sql = neon(getPostgresUrl());

async function main() {
  const wwwToOld = await sql`
    insert into v5000_media_mirror (wp_url, wp_media_id, r2_key, public_url, mime, alt, size_bytes)
    select
      replace(wp_url, 'https://www.nutrifarmer.kr', 'https://old.nutrifarmer.kr'),
      wp_media_id, r2_key, public_url, mime, alt, size_bytes
    from v5000_media_mirror
    where wp_url like 'https://www.nutrifarmer.kr%'
    on conflict (wp_url) do nothing
    returning id
  `;

  const oldToWww = await sql`
    insert into v5000_media_mirror (wp_url, wp_media_id, r2_key, public_url, mime, alt, size_bytes)
    select
      replace(wp_url, 'https://old.nutrifarmer.kr', 'https://www.nutrifarmer.kr'),
      wp_media_id, r2_key, public_url, mime, alt, size_bytes
    from v5000_media_mirror
    where wp_url like 'https://old.nutrifarmer.kr%'
    on conflict (wp_url) do nothing
    returning id
  `;

  const total = await sql`select count(*)::int as c from v5000_media_mirror`;
  console.log(`Added www→old: ${wwwToOld.length}, old→www: ${oldToWww.length}, mirror total: ${total[0].c}`);
}

main().catch(e => { console.error(e); process.exit(1); });
