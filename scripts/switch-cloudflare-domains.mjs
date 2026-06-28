#!/usr/bin/env node
/**
 * Preserve current www.nutrifarmer.kr as old.nutrifarmer.kr,
 * then point www.nutrifarmer.kr to Vercel.
 *
 * Required env:
 *   CLOUDFLARE_API_TOKEN
 *
 * Usage:
 *   node scripts/switch-cloudflare-domains.mjs --dry-run
 *   node scripts/switch-cloudflare-domains.mjs --apply
 */

const ZONE_NAME = 'nutrifarmer.kr';
const OLD_NAME = 'old.nutrifarmer.kr';
const WWW_NAME = 'www.nutrifarmer.kr';
const VERCEL_A = '76.76.21.21';

const args = new Set(process.argv.slice(2));
const apply = args.has('--apply');
const dryRun = args.has('--dry-run') || !apply;
const token = process.env.CLOUDFLARE_API_TOKEN?.trim();

if (!token) {
  console.error('CLOUDFLARE_API_TOKEN is required.');
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
  console.log(`Mode: ${dryRun ? 'DRY-RUN' : 'APPLY'}`);

  const zones = await cf(`/zones?name=${encodeURIComponent(ZONE_NAME)}`);
  const zone = zones[0];
  if (!zone) throw new Error(`Zone not found: ${ZONE_NAME}`);
  console.log(`Zone: ${zone.name}`);

  const wwwRecords = await cf(`/zones/${zone.id}/dns_records?name=${encodeURIComponent(WWW_NAME)}`);
  if (wwwRecords.length === 0) throw new Error(`${WWW_NAME} DNS record not found.`);

  const oldRecords = await cf(`/zones/${zone.id}/dns_records?name=${encodeURIComponent(OLD_NAME)}`);
  console.log(`Current ${WWW_NAME} records: ${wwwRecords.map(r => `${r.type} ${r.content} proxied=${r.proxied}`).join(' | ')}`);
  console.log(`Existing ${OLD_NAME} records: ${oldRecords.length}`);

  if (dryRun) {
    console.log(`Would create ${OLD_NAME} from current ${WWW_NAME} records if missing.`);
    console.log(`Would replace ${WWW_NAME} with A ${VERCEL_A} proxied=false.`);
    return;
  }

  for (const record of oldRecords) {
    await cf(`/zones/${zone.id}/dns_records/${record.id}`, { method: 'DELETE' });
    console.log(`Deleted old existing: ${record.type} ${OLD_NAME}`);
  }

  for (const record of wwwRecords) {
    const body = {
      type: record.type,
      name: OLD_NAME,
      content: record.content,
      ttl: record.ttl,
      proxied: record.proxiable ? record.proxied : undefined,
      comment: 'Preserved previous www.nutrifarmer.kr before V5000 switch',
    };
    await cf(`/zones/${zone.id}/dns_records`, { method: 'POST', body: JSON.stringify(body) });
    console.log(`Created ${OLD_NAME}: ${record.type} ${record.content}`);
  }

  for (const record of wwwRecords) {
    await cf(`/zones/${zone.id}/dns_records/${record.id}`, { method: 'DELETE' });
    console.log(`Deleted previous ${WWW_NAME}: ${record.type} ${record.content}`);
  }

  await cf(`/zones/${zone.id}/dns_records`, {
    method: 'POST',
    body: JSON.stringify({
      type: 'A',
      name: WWW_NAME,
      content: VERCEL_A,
      ttl: 1,
      proxied: false,
      comment: 'V5000 on Vercel',
    }),
  });
  console.log(`Created ${WWW_NAME}: A ${VERCEL_A} proxied=false`);
  console.log('Done. DNS propagation may take a few minutes.');
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
