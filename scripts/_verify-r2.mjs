import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { loadEnvFiles, loadR2EnvFallback } from './_load-env.mjs';

loadEnvFiles();
loadR2EnvFallback();

const account = process.env.R2_ACCOUNT_ID?.trim();
const key = process.env.R2_ACCESS_KEY_ID?.trim();
const secret = process.env.R2_SECRET_ACCESS_KEY?.trim();
const bucket = process.env.R2_BUCKET_NAME?.trim();

if (!account || !key || !secret || !bucket) {
  console.log('R2 credentials: incomplete in .env.local');
  process.exit(1);
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${account}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: key, secretAccessKey: secret },
});

try {
  await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: 'uploads/2026/06/daily-1.jpg' }));
  console.log('R2 credentials OK (nutrifarmer-v5000 token)');
  console.log('Access Key ID prefix:', key.slice(0, 8) + '…');
} catch (e) {
  console.log('R2 test failed:', e.message);
  process.exit(1);
}
