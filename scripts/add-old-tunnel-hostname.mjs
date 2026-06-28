#!/usr/bin/env node
/**
 * Add old.nutrifarmer.kr to the existing Cloudflare Tunnel using
 * the same service as www.nutrifarmer.kr.
 */

const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim() || '95dd5f33425f492df96ded705730b9c8';
const tunnelId = process.env.CLOUDFLARE_TUNNEL_ID?.trim() || '38c66ee7-343f-4b26-8605-9dbe44f9680c';
const OLD_HOST = 'old.nutrifarmer.kr';
const WWW_HOST = 'www.nutrifarmer.kr';

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

function cloneRule(rule, hostname) {
  const out = JSON.parse(JSON.stringify(rule));
  out.hostname = hostname;
  delete out.originRequest;
  if (rule.originRequest) out.originRequest = rule.originRequest;
  return out;
}

async function main() {
  const path = `/accounts/${accountId}/cfd_tunnel/${tunnelId}/configurations`;
  const config = await cf(path);
  const ingress = config?.config?.ingress;
  if (!Array.isArray(ingress)) throw new Error('Tunnel ingress config not found.');

  console.log('current-ingress');
  for (const r of ingress) {
    console.log('-', r.hostname || '(fallback)', '=>', r.service);
  }

  if (ingress.some(r => r.hostname === OLD_HOST)) {
    console.log(`${OLD_HOST} already exists.`);
    return;
  }

  const source =
    ingress.find(r => r.hostname === WWW_HOST) ||
    ingress.find(r => r.hostname?.endsWith('.nutrifarmer.kr')) ||
    ingress.find(r => r.service && !r.hostname?.includes('vercel'));

  if (!source) throw new Error(`No source ingress found for ${OLD_HOST}.`);

  const fallbackIndex = ingress.findIndex(r => !r.hostname);
  const insertIndex = fallbackIndex >= 0 ? fallbackIndex : ingress.length;
  const nextIngress = [
    ...ingress.slice(0, insertIndex),
    cloneRule(source, OLD_HOST),
    ...ingress.slice(insertIndex),
  ];

  const nextConfig = {
    config: {
      ...config.config,
      ingress: nextIngress,
    },
  };

  await cf(path, { method: 'PUT', body: JSON.stringify(nextConfig) });
  console.log(`Added ${OLD_HOST} => ${source.service}`);
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
