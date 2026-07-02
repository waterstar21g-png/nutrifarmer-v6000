#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';
import { spawnSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envFile = join(root, '.env.v5000');
const token = process.env.VERCEL_TOKEN;
const scope = 'nutrifarmer-front';

if (!token) {
  console.error('VERCEL_TOKEN required');
  process.exit(1);
}
if (!existsSync(envFile)) {
  console.error('Missing .env.v5000 — run vercel env pull first');
  process.exit(1);
}

const SKIP = /^(VERCEL_|TURBO_|NX_)/;
const OVERRIDES = {
  NEXT_PUBLIC_SITE_URL: 'https://m.nutrifarmer.kr',
  NEXT_PUBLIC_V5000_WRITE_URL: 'https://www.nutrifarmer.kr/write',
  NEXT_PUBLIC_CDN_URL: 'https://media.nutrifarmer.kr',
  R2_PUBLIC_ACCESS: 'true',
};

function parseEnv(text) {
  const out = new Map();
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i <= 0) continue;
    const key = line.slice(0, i);
    let val = line.slice(i + 1);
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (SKIP.test(key)) continue;
    out.set(key, val);
  }
  for (const [k, v] of Object.entries(OVERRIDES)) out.set(k, v);
  return out;
}

function run(cmd, input) {
  const r = spawnSync(cmd, {
    shell: true,
    cwd: root,
    input,
    encoding: 'utf8',
    env: { ...process.env, VERCEL_TOKEN: token },
  });
  return r;
}

function addEnv(key, value, envName) {
  const r = run(
    `npx vercel@latest env add "${key}" ${envName} --force --yes --scope ${scope}`,
    value,
  );
  if (r.status !== 0) {
    console.error(`FAIL ${key} (${envName}):`, (r.stderr || r.stdout || '').trim());
    return false;
  }
  console.log(`OK   ${key} (${envName})`);
  return true;
}

const vars = parseEnv(readFileSync(envFile, 'utf8'));
console.log(`Syncing ${vars.size} vars → nutrifarmer-v6000 production`);

let ok = 0;
let fail = 0;
for (const [key, value] of vars) {
  if (addEnv(key, value, 'production')) ok++;
  else fail++;
}

console.log(`\nDone: ${ok} ok, ${fail} fail`);
