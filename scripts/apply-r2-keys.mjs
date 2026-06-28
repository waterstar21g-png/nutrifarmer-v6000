#!/usr/bin/env node
/**
 * Cloudflare 대시보드에서 수동 발급한 R2 S3 키 → Vercel env 적용 + R2 연결 테스트
 * Usage: node scripts/apply-r2-keys.mjs
 * Input: ../NotePad_자료/R2_ROTATION_KEYS.txt
 *   Access Key ID: ...
 *   Secret Access Key: ...
 */
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ACCOUNT_ID = '95dd5f33425f492df96ded705730b9c8';
const BUCKET = 'nutrifarmer-media';
const keysPath = join(root, '..', 'NotePad_자료', 'R2_ROTATION_KEYS.txt');

function readKeys() {
  if (!existsSync(keysPath)) {
    throw new Error(`Create ${keysPath} with Access Key ID and Secret Access Key from Cloudflare R2 API Tokens`);
  }
  const text = readFileSync(keysPath, 'utf8');
  const access = text.match(/Access Key ID\s*:?\s*"?([a-f0-9]+)"?/i)?.[1];
  const secret = text.match(/Secret Access Key\s*:?\s*"?([a-f0-9]+)"?/i)?.[1];
  if (!access || !secret) throw new Error('R2_ROTATION_KEYS.txt must contain Access Key ID and Secret Access Key');
  return { access, secret };
}

function updateVercel(name, value) {
  execSync(`vercel env rm ${name} production --yes`, { cwd: root, stdio: 'pipe' });
  execSync(`echo ${value} | vercel env add ${name} production`, { cwd: root, stdio: 'pipe' });
}

async function main() {
  const { access, secret } = readKeys();
  console.log('Testing R2 credentials…');
  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: access, secretAccessKey: secret },
  });
  await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: 'uploads/2026/06/daily-1.jpg' }));
  console.log('R2 OK');

  console.log('Updating Vercel production env…');
  updateVercel('R2_ACCESS_KEY_ID', access);
  updateVercel('R2_SECRET_ACCESS_KEY', secret);
  updateVercel('R2_ACCOUNT_ID', ACCOUNT_ID);
  updateVercel('R2_BUCKET_NAME', BUCKET);

  console.log('Done. Revoke old key in Cloudflare R2 → API Tokens, then redeploy.');
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
