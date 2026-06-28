const WP = 'https://www.nutrifarmer.kr';
const email = process.argv[2] || 'waterstar21@naver.com';

const page = await fetch(`${WP}/login/?panel=find`);
const html = await page.text();
const m = html.match(/name="nf_auth_nonce"\s+value="([^"]+)"/);
if (!m) { console.log('no nonce'); process.exit(1); }

const form = new URLSearchParams();
form.set('nf_auth_nonce', m[1]);
form.set('nf_auth_action', 'findaccount');
form.set('nf_email', email);

const res = await fetch(`${WP}/login/`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: form.toString(),
  redirect: 'manual',
});

console.log('status', res.status);
console.log('location', res.headers.get('location'));
