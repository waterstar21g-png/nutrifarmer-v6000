#!/usr/bin/env node
/**
 * Cloudflare R2 구 API 토큰 폐기 (기본: nutrifarmer-r2-wordpress)
 *
 * 필요 env (하나):
 *   CLOUDFLARE_API_TOKEN  또는  CF_ADMIN_API_TOKEN
 *   (권한: Account → Account API Tokens Read + Write)
 *
 * Usage:
 *   node scripts/revoke-old-r2-token.mjs
 *   node scripts/revoke-old-r2-token.mjs --name=nutrifarmer-r2-wordpress
 *   node scripts/revoke-old-r2-token.mjs --dry-run
 */
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { loadEnvFiles } from './_load-env.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ACCOUNT_ID = process.env.R2_ACCOUNT_ID?.trim() || '95dd5f33425f492df96ded705730b9c8';
const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const nameArg = process.argv.find(a => a.startsWith('--name='));
const TARGET_NAME = (nameArg?.split('=')[1] || 'nutrifarmer-r2-wordpress').trim();

function readCfTokensFromNotePad() {
  const paths = [
    join(root, '..', 'NotePad_자료', 'API_KEY_Cloudflare_Admin.txt'),
    join(root, '..', 'NotePad_자료', 'API_KEY_Cloudflare_R2_Storage.txt'),
    join(root, '..', 'NotePad_자료', 'API_KEY_Cloudflare_R2_Storage_2.txt'),
    join(root, '..', 'NotePad_자료', 'API_KEY_Cloudflare_R2_Storage_3.txt'),
  ];
  const tokens = new Set();
  for (const p of paths) {
    if (!existsSync(p)) continue;
    for (const m of readFileSync(p, 'utf8').matchAll(/cfut_[A-Za-z0-9_-]+/g)) tokens.add(m[0]);
  }
  return [...tokens];
}

function pickCfToken() {
  const fromEnv = [
    process.env.CLOUDFLARE_API_TOKEN?.trim(),
    process.env.CF_ADMIN_API_TOKEN?.trim(),
  ].filter(Boolean);
  return [...new Set([...fromEnv, ...readCfTokensFromNotePad()])];
}

async function cfApi(token, method, path, body) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(`${method} ${path}: ${JSON.stringify(data.errors || data)}`);
  }
  return data.result;
}

async function verifyToken(token) {
  const res = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return data.success === true;
}

async function listAllTokens(cfToken) {
  const all = [];
  let page = 1;
  while (true) {
    const batch = await cfApi(
      cfToken,
      'GET',
      `/accounts/${ACCOUNT_ID}/tokens?page=${page}&per_page=50`,
    );
    const items = Array.isArray(batch) ? batch : batch?.result ?? [];
    if (!items.length) break;
    all.push(...items);
    if (items.length < 50) break;
    page++;
  }
  return all;
}

async function main() {
  loadEnvFiles();
  const candidates = pickCfToken();
  if (!candidates.length) {
    console.error(`
Cloudflare Admin API 토큰이 없습니다.

.env.local 에 추가 후 재실행:
  CLOUDFLARE_API_TOKEN=cfut_...

권한: Account → Account API Tokens → Read + Write
대상 토큰 이름: ${TARGET_NAME}
`);
    process.exit(1);
  }

  let cfToken = null;
  for (const t of candidates) {
    if (await verifyToken(t)) {
      cfToken = t;
      break;
    }
  }
  if (!cfToken) {
    console.error('유효한 Cloudflare API 토큰을 찾지 못했습니다.');
    process.exit(1);
  }
  console.log('Cloudflare API token OK');

  const tokens = await listAllTokens(cfToken);
  console.log(`Account tokens (${tokens.length}):`);
  for (const t of tokens) {
    console.log(`  - ${t.name} (${t.id}) status=${t.status ?? 'active'}`);
  }

  const target = tokens.find(t => t.name === TARGET_NAME);
  if (!target) {
    console.log(`\n"${TARGET_NAME}" 토큰이 없습니다 — 이미 삭제되었거나 이름이 다릅니다.`);
    return;
  }

  if (target.name === 'nutrifarmer-v5000' || target.name?.startsWith('nutrifarmer-v5000-')) {
    console.error('현재 운영 토큰(nutrifarmer-v5000)은 삭제할 수 없습니다.');
    process.exit(1);
  }

  if (dryRun) {
    console.log(`\n[dry-run] Would DELETE token: ${target.name} (${target.id})`);
    return;
  }

  await cfApi(cfToken, 'DELETE', `/accounts/${ACCOUNT_ID}/tokens/${target.id}`);
  console.log(`\nDeleted: ${target.name} (${target.id})`);
  console.log('old.nutrifarmer.kr / V5000 CDN·R2 운영에는 영향 없습니다 (S3 API 키만 폐기).');
}

main().catch(e => {
  console.error(e.message || e);
  process.exit(1);
});
