import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export function loadEnvFiles() {
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

export function getPostgresUrl() {
  return (
    process.env.POSTGRES_URL_NON_POOLING?.trim() ||
    process.env.DATABASE_URL_UNPOOLED?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    ''
  );
}

export function envKeyStatus(keys) {
  return Object.fromEntries(keys.map(k => [k, !!(process.env[k]?.trim())]));
}

/** R2_* — .env.local 없을 때 로컬 키 파일(선택) */
export function loadR2EnvFallback() {
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
