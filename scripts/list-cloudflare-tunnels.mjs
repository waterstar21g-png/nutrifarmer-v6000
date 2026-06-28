#!/usr/bin/env node
const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
if (!token) {
  console.error('CLOUDFLARE_API_TOKEN is required.');
  process.exit(1);
}

async function cf(path) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(`${path}: ${json.errors?.map(e => e.message).join('; ') || `HTTP ${res.status}`}`);
  }
  return json.result;
}

try {
  const verify = await cf('/user/tokens/verify');
  console.log('token', verify.status || 'verified');
} catch (e) {
  console.log('token-error', e.message);
}

const zones = await cf('/zones?name=nutrifarmer.kr');
const zone = zones[0];
console.log('zone', zone?.id || 'not-found');
console.log('zone-account', zone?.account?.id || 'not-visible', zone?.account?.name || '');

let accounts = [];
try {
  accounts = await cf('/accounts');
  console.log('accounts-count', accounts.length);
} catch (e) {
  console.log('accounts-error', e.message);
}
for (const a of accounts) {
  console.log('account', a.id, a.name);
  try {
    const tunnels = await cf(`/accounts/${a.id}/cfd_tunnel`);
    console.log('tunnels-count', tunnels.length);
    for (const t of tunnels) {
      console.log('tunnel', t.id, t.name, t.status);
    }
  } catch (e) {
    console.log('tunnel-list-error', e.message);
  }
}

if (zone?.account?.id && !accounts.some(a => a.id === zone.account.id)) {
  const accountId = zone.account.id;
  console.log('trying-zone-account', accountId);
  try {
    const tunnels = await cf(`/accounts/${accountId}/cfd_tunnel`);
    console.log('tunnels-count', tunnels.length);
    for (const t of tunnels) {
      console.log('tunnel', t.id, t.name, t.status);
    }
  } catch (e) {
    console.log('zone-account-tunnel-error', e.message);
  }
}
