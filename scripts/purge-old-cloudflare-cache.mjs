#!/usr/bin/env node

const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
const zoneId = process.env.CLOUDFLARE_ZONE_ID?.trim() || '92b4764e155f6335070276aad9975756';

if (!token) {
  console.error('CLOUDFLARE_API_TOKEN is required.');
  process.exit(1);
}

const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    files: ['https://old.nutrifarmer.kr/', 'http://old.nutrifarmer.kr/'],
  }),
});

const json = await res.json();
if (!res.ok || !json.success) {
  console.error(json.errors?.map(e => e.message).join('; ') || `HTTP ${res.status}`);
  process.exit(1);
}

console.log('Purged old.nutrifarmer.kr cache.');
