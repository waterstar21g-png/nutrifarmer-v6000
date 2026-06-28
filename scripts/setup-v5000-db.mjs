#!/usr/bin/env node
/**
 * V5000 DB + Auth env setup helper
 * Usage: node scripts/setup-v5000-db.mjs
 */
import { spawnSync } from 'child_process';
import { randomBytes } from 'crypto';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envLocal = join(root, '.env.local');

function run(cmd, opts = {}) {
  console.log(`\n> ${cmd}`);
  const r = spawnSync(cmd, { cwd: root, stdio: 'inherit', shell: true, ...opts });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function upsertEnv(key, value) {
  let lines = existsSync(envLocal) ? readFileSync(envLocal, 'utf8').split(/\r?\n/) : [];
  const prefix = `${key}=`;
  const idx = lines.findIndex(l => l.startsWith(prefix));
  const row = `${key}=${value}`;
  if (idx >= 0) lines[idx] = row;
  else lines.push(row);
  writeFileSync(envLocal, lines.filter(Boolean).join('\n') + '\n', 'utf8');
  console.log(`Updated .env.local → ${key}`);
}

console.log('=== V5000 Database Setup ===\n');
console.log('1) Neon 약관 동의 (최초 1회)');
console.log('   https://vercel.com/nutrifarmer-front/~/integrations/accept-terms/neon?source=cli\n');
console.log('2) Neon Postgres 생성 + 프로젝트 연결\n');

run(
  'vercel integration add neon --name nutrifarmer-v5000-db --plan free_v3 -m region=iad1 -e production -e preview',
);

console.log('\n3) env pull → .env.local');
run('vercel env pull .env.local --yes');

const secret = randomBytes(32).toString('base64');
upsertEnv('AUTH_SESSION_SECRET', secret);

console.log('\n4) AUTH_SESSION_SECRET → Vercel Production');
run(`echo ${secret} | vercel env add AUTH_SESSION_SECRET production`);

console.log('\n5) DB migration');
run('npm run db:migrate');

console.log('\n✅ Setup complete. Redeploy: vercel --prod --yes');
