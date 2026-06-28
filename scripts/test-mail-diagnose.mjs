import { readFileSync } from 'fs';

function loadEnv(path) {
  const out = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i < 1) continue;
    let v = line.slice(i + 1);
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[line.slice(0, i)] = v;
  }
  return out;
}

const env = loadEnv(process.env.ENV_FILE ?? '.env.vercel.test2');
const email = process.argv[2] || 'waterstar21@naver.com';
const key = env.NF_V5000_SERVER_KEY ?? '';

const wpRes = await fetch('https://www.nutrifarmer.kr/wp-json/nutrifarmer/v1/auth/find-account', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...(key ? { 'X-NF-V5000-Key': key } : {}),
  },
  body: JSON.stringify({ email }),
});
console.log('WP find-account', wpRes.status, (await wpRes.text()).slice(0, 600));

const resendRes = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${env.RESEND_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: env.MAIL_FROM,
    to: email,
    subject: '[test] nutrifarmer mail diagnose',
    text: 'diagnose',
  }),
});
console.log('Resend direct', resendRes.status, (await resendRes.text()).slice(0, 600));
console.log('config', {
  hasResendKey: !!env.RESEND_API_KEY,
  hasServerKey: !!key,
  mailFromPreview: env.MAIL_FROM?.slice(0, 40),
});
