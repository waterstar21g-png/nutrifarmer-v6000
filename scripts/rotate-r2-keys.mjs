#!/usr/bin/env node
/**
 * Cloudflare R2 S3 키 재발급 + Vercel env 교체 + 구 키 폐기
 * Usage: node scripts/rotate-r2-keys.mjs
 */
import { createHash } from 'crypto';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

import { loadEnvFiles } from './_load-env.mjs';

loadEnvFiles();

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ACCOUNT_ID = '95dd5f33425f492df96ded705730b9c8';
const BUCKET = 'nutrifarmer-media';
const OLD_ACCESS_KEY_ID = '61e1cd164a70ab785251e1f33384710e';

function readCfApiTokens() {
  const paths = [
    join(root, '..', 'NotePad_자료', 'API_KEY_Cloudflare_Admin.txt'),
    join(root, '..', 'NotePad_자료', 'Access_Key_Secret_Access_Key_API_KEY_Cloudflare_R2_Storage.txt'),
    join(root, '..', 'NotePad_자료', 'API_KEY_Cloudflare_R2_Storage_2.txt'),
    join(root, '..', 'NotePad_자료', 'API_KEY_Cloudflare_R2_Storage.txt'),
    join(root, '..', 'NotePad_자료', 'API_KEY_Cloudflare_R2_Storage_3.txt'),
  ];
  const tokens = new Set();
  for (const p of paths) {
    if (!existsSync(p)) continue;
    for (const m of readFileSync(p, 'utf8').matchAll(/cfut_[A-Za-z0-9_-]+/g)) tokens.add(m[0]);
  }
  if (!tokens.size && process.env.CLOUDFLARE_API_TOKEN?.trim()) {
    tokens.add(process.env.CLOUDFLARE_API_TOKEN.trim());
  }
  if (!tokens.size && process.env.CF_ADMIN_API_TOKEN?.trim()) {
    tokens.add(process.env.CF_ADMIN_API_TOKEN.trim());
  }
  if (!tokens.size) {
    throw new Error(
      'Cloudflare admin API token required. Save cfut_… to NotePad_자료/API_KEY_Cloudflare_Admin.txt ' +
        '(permissions: Account API Tokens Write + Workers R2 Storage Write)',
    );
  }
  return [...tokens];
}

async function pickWorkingCfToken(tokens) {
  for (const token of tokens) {
    try {
      await cfApi(token, 'GET', '/user/tokens/verify');
      return token;
    } catch {
      /* try next */
    }
  }
  throw new Error('No valid Cloudflare API token found — create one in Cloudflare Dashboard');
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
    throw new Error(`CF API ${method} ${path}: ${JSON.stringify(data.errors || data)}`);
  }
  return data.result;
}

function findR2WriteGroup(groups) {
  const names = [
    'Workers R2 Storage Bucket Item Write',
    'Workers R2 Storage Write',
  ];
  for (const name of names) {
    const g = groups.find((x) => x.name === name);
    if (g) return g;
  }
  throw new Error('R2 write permission group not found');
}

async function main() {
  const cfToken = await pickWorkingCfToken(readCfApiTokens());
  console.log('Cloudflare API token verified');

  console.log('Fetching permission groups…');
  let writeGroup;
  const groupNames = [
    'Workers R2 Storage Bucket Item Write',
    'Workers R2 Storage Write',
  ];
  for (const groupName of groupNames) {
    try {
      const groups = await cfApi(
        cfToken,
        'GET',
        `/accounts/${ACCOUNT_ID}/tokens/permission_groups?name=${encodeURIComponent(groupName)}`,
      );
      const list = Array.isArray(groups) ? groups : [groups];
      writeGroup = list.find((g) => g?.name === groupName) || list[0];
      if (writeGroup?.id) break;
    } catch {
      /* try next name */
    }
  }
  if (!writeGroup?.id) {
    writeGroup = { name: 'Workers R2 Storage Bucket Item Write' };
  }

  const bucketResource = `com.cloudflare.edge.r2.bucket.${ACCOUNT_ID}_default_${BUCKET}`;
  const policy = {
    effect: 'allow',
    resources: { [bucketResource]: '*' },
    permission_groups: [{ id: writeGroup.id, name: writeGroup.name }],
  };

  console.log('Creating new R2 account API token…');
  const created = await cfApi(cfToken, 'POST', `/accounts/${ACCOUNT_ID}/tokens`, {
    name: `nutrifarmer-v5000-${new Date().toISOString().slice(0, 10)}`,
    policies: [policy],
  });

  const accessKeyId = created.id;
  const secretAccessKey = createHash('sha256').update(created.value).digest('hex');
  console.log('New Access Key ID:', accessKeyId);

  console.log('Testing new credentials against R2…');
  const { HeadObjectCommand, S3Client } = await import('@aws-sdk/client-s3');
  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });
  await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: 'uploads/2026/06/daily-1.jpg' }));
  console.log('R2 bucket access OK');

  console.log('Updating Vercel production env…');
  const vercelCwd = root;
  const update = (name, value) => {
    execSync(`vercel env rm ${name} production --yes`, { cwd: vercelCwd, stdio: 'pipe' });
    execSync(`echo ${value} | vercel env add ${name} production`, { cwd: vercelCwd, stdio: 'pipe' });
  };
  update('R2_ACCESS_KEY_ID', accessKeyId);
  update('R2_SECRET_ACCESS_KEY', secretAccessKey);
  update('R2_ACCOUNT_ID', ACCOUNT_ID);
  update('R2_BUCKET_NAME', BUCKET);

  if (OLD_ACCESS_KEY_ID && OLD_ACCESS_KEY_ID !== accessKeyId) {
    console.log('Revoking old R2 token…');
    try {
      await cfApi(cfToken, 'DELETE', `/accounts/${ACCOUNT_ID}/tokens/${OLD_ACCESS_KEY_ID}`);
      console.log('Old token revoked:', OLD_ACCESS_KEY_ID);
    } catch (e) {
      console.warn('Could not revoke old token (may already be gone):', e.message);
    }
  }

  const keysPath = join(root, '..', 'NotePad_자료', 'Access_Key_Secret_Access_Key_API_KEY_Cloudflare_R2_Storage.txt');
  if (existsSync(keysPath)) {
    writeFileSync(
      keysPath,
      `Rotated: ${new Date().toISOString()}\n\nAccess Key ID: ${accessKeyId}\n\nSecret Access Key: ${secretAccessKey}\n\nhttps://${ACCOUNT_ID}.r2.cloudflarestorage.com\n`,
      'utf8',
    );
    console.log('Updated local keys file (NotePad_자료)');
  }

  console.log('\nDone. Redeploy production so runtime picks up new env.');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
