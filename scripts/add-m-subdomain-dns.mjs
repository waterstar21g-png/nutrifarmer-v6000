#!/usr/bin/env node
/** Add m.nutrifarmer.kr → Vercel (V6000) A record — needs CLOUDFLARE_API_TOKEN with Zone.DNS */
import { loadEnvFiles } from './_load-env.mjs';

loadEnvFiles();

const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID?.trim() || '92b4764e155f6335070276aad9975756';
const HOST = 'm.nutrifarmer.kr';
const VERCEL_A = '76.76.21.21';
const apply = process.argv.includes('--apply');

if (!token) {
  console.error('CLOUDFLARE_API_TOKEN required');
  process.exit(1);
}

async function cf(path, init = {}) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    const msg = json?.errors?.map(e => e.message).join('; ') || `HTTP ${res.status}`;
    throw new Error(`${init.method ?? 'GET'} ${path}: ${msg}`);
  }
  return json.result;
}

async function main() {
  console.log(`Mode: ${apply ? 'APPLY' : 'DRY-RUN'}`);
  console.log(`Zone ID: ${ZONE_ID}`);

  const existing = await cf(`/zones/${ZONE_ID}/dns_records?name=${encodeURIComponent(HOST)}`);
  console.log(`Existing ${HOST}:`, existing.map(r => `${r.type} ${r.content} proxied=${r.proxied}`).join(' | ') || '(none)');

  if (existing.find(r => r.type === 'A' && r.content === VERCEL_A)) {
    console.log('Already configured correctly.');
    return;
  }

  if (!apply) {
    console.log(`Would set ${HOST} A ${VERCEL_A} proxied=false`);
    return;
  }

  for (const r of existing) {
    await cf(`/zones/${ZONE_ID}/dns_records/${r.id}`, { method: 'DELETE' });
    console.log(`Deleted: ${r.type} ${r.content}`);
  }

  const created = await cf(`/zones/${ZONE_ID}/dns_records`, {
    method: 'POST',
    body: JSON.stringify({
      type: 'A',
      name: 'm',
      content: VERCEL_A,
      ttl: 1,
      proxied: false,
      comment: 'V6000 mobile — Vercel nutrifarmer-v6000',
    }),
  });
  console.log(`Created: A ${HOST} → ${created.content}`);
}

main().catch(e => {
  console.error(e.message);
  process.exit(1);
});
