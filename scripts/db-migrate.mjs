#!/usr/bin/env node
/**
 * V5000 — apply drizzle/*.sql migrations in order
 * Usage: npm run db:migrate  (reads .env.local)
 */
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { neon } from '@neondatabase/serverless';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnvLocal() {
  const envPath = join(root, '.env.local');
  if (!existsSync(envPath)) return;
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

loadEnvLocal();

const url =
  process.env.POSTGRES_URL_NON_POOLING?.trim() ||
  process.env.DATABASE_URL_UNPOOLED?.trim() ||
  process.env.POSTGRES_URL?.trim() ||
  process.env.DATABASE_URL?.trim();

if (!url) {
  console.error('POSTGRES_URL or DATABASE_URL is required');
  process.exit(1);
}

const drizzleDir = join(__dirname, '..', 'drizzle');
const sqlFiles = readdirSync(drizzleDir)
  .filter(f => f.endsWith('.sql'))
  .sort();

const sql = neon(url);

for (const file of sqlFiles) {
  console.log(`\n=== ${file} ===`);
  const statements = readFileSync(join(drizzleDir, file), 'utf8')
    .split(';')
    .map(s => s.trim())
    .filter(Boolean);

  for (const statement of statements) {
    console.log('Running:', statement.slice(0, 60) + '...');
    await sql.query(statement);
  }
}

console.log('\nV5000 migrations complete.');
