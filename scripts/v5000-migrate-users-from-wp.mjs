#!/usr/bin/env node
/**
 * WordPress users -> V5000 Postgres (must_reset_password=true)
 *
 * Dry-run:  node scripts/v5000-migrate-users-from-wp.mjs
 * Write:    node scripts/v5000-migrate-users-from-wp.mjs --write
 * Mail:     node scripts/v5000-migrate-users-from-wp.mjs --write --mail
 *
 * WP_APP_USER + WP_APP_PASSWORD — context=edit 이메일 조회 (권장)
 */
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { neon } from '@neondatabase/serverless';
import { loadEnvFiles, getPostgresUrl } from './_load-env.mjs';
import { fetchAllWpPages, resolveWpApiBase } from './_wp-api.mjs';

const scriptsDir = dirname(fileURLToPath(import.meta.url));

function loadEmailMap() {
  const path = join(scriptsDir, 'wp-user-emails.json');
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    console.warn('wp-user-emails.json parse failed — ignored');
    return {};
  }
}

function resolveEmail(wp, emailMap) {
  const direct = (wp.email || '').trim().toLowerCase();
  if (direct.includes('@')) return direct;
  const mapped = emailMap[wp.slug] ?? emailMap[String(wp.id)];
  return typeof mapped === 'string' ? mapped.trim().toLowerCase() : '';
}

const args = new Set(process.argv.slice(2));
const write = args.has('--write');
const sendMail = args.has('--mail');
const markExisting = args.has('--mark-existing');

function sanitizeLoginId(slug, fallbackId) {
  const base = String(slug || `user${fallbackId}`)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '');
  if (base.length >= 6) return base.slice(0, 64);
  if (base.length >= 4) return base.slice(0, 64);
  return `wpuser${fallbackId}`.slice(0, 64);
}

function roleFromWp(roles = []) {
  if (roles.includes('administrator')) return 'admin';
  if (roles.includes('editor')) return 'editor';
  return 'author';
}

async function sendMigrationMail(user, loginUrl) {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return false;

  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://www.nutrifarmer.kr';
  const lostUrl = `${site.replace(/\/$/, '')}/login?panel=lost`;

  const text = [
    `안녕하세요, ${user.displayName}님.`,
    '',
    '탁월한 찬사(V5000)로 서비스가 전환되었습니다.',
    '보안을 위해 WordPress 비밀번호는 이전되지 않습니다.',
    '아래에서 비밀번호를 새로 설정해 주세요.',
    '',
    `· 로그인 ID: ${user.loginId}`,
    `· 로그인: ${loginUrl}`,
    `· 비밀번호 재설정: ${lostUrl}`,
    '',
    '— 탁월한 찬사',
  ].join('\r\n');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.MAIL_FROM?.trim() || 'Nutrifarmer <onboarding@resend.dev>',
      to: user.email,
      subject: '[탁월한 찬사] V5000 전환 — 비밀번호 재설정 안내',
      text,
    }),
  });
  return res.ok;
}

async function main() {
  loadEnvFiles();
  const dbUrl = getPostgresUrl();
  if (!dbUrl) throw new Error('POSTGRES_URL required');

  const sql = neon(dbUrl);
  const loginUrl = `${(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.nutrifarmer.kr').replace(/\/$/, '')}/login`;

  console.log(`WP API: ${resolveWpApiBase()}`);
  console.log(`Mode: ${write ? 'WRITE' : 'DRY-RUN'}${sendMail ? ' + MAIL' : ''}${markExisting ? ' + MARK-EXISTING' : ''}`);

  const emailMap = loadEmailMap();
  let wpUsers;

  try {
    ({ items: wpUsers } = await fetchAllWpPages(
      page => `/wp/v2/users?context=edit&per_page=100&page=${page}`,
    ));
  } catch {
    console.log('context=edit 불가 — public users API 사용 (WP_APP_USER/PASSWORD 또는 wp-user-emails.json)');
    ({ items: wpUsers } = await fetchAllWpPages(
      page => `/wp/v2/users?per_page=100&page=${page}`,
    ));
  }

  const existing = await sql`select login_id, email from v5000_users`;
  const byLogin = new Set(existing.map(r => r.login_id.toLowerCase()));
  const byEmail = new Set(existing.map(r => r.email.toLowerCase()));

  const stats = { wp: wpUsers.length, skipped: 0, imported: 0, mailed: 0, dryRun: 0, noEmail: 0, marked: 0 };

  for (const wp of wpUsers) {
    const loginId = sanitizeLoginId(wp.slug, wp.id);
    const displayName = (wp.name || loginId).trim().slice(0, 255);
    const email = resolveEmail(wp, emailMap);

    const existingLogin = [...byLogin].find(l => l === loginId.toLowerCase());
    if (existingLogin || (email && byEmail.has(email))) {
      if (markExisting && write && existingLogin) {
        await sql`
          update v5000_users
          set migration_source = coalesce(migration_source, 'wp'), updated_at = now()
          where lower(login_id) = lower(${loginId})
        `;
        stats.marked++;
      } else {
        stats.skipped++;
      }
      continue;
    }

    if (!email || !email.includes('@')) {
      stats.noEmail++;
      console.warn(`  skip wp:${wp.id} ${loginId} — no email (wp-user-emails.json 또는 WP_APP 인증)`);
      continue;
    }

    if (!write) {
      stats.dryRun++;
      console.log(`  would import: ${loginId} <${email}> (${roleFromWp(wp.roles)})`);
      continue;
    }

    const rows = await sql`
      insert into v5000_users
        (login_id, display_name, email, password_hash, role, must_reset_password, migration_source, updated_at)
      values
        (${loginId}, ${displayName}, ${email}, null, ${roleFromWp(wp.roles)}, true, 'wp', now())
      returning id, login_id, display_name, email
    `;
    const user = rows[0];
    byLogin.add(loginId.toLowerCase());
    byEmail.add(email);
    stats.imported++;
    console.log(`  imported: ${user.login_id} (id=${user.id})`);

    if (sendMail) {
      const ok = await sendMigrationMail(
        { loginId: user.login_id, displayName: user.display_name, email: user.email },
        loginUrl,
      );
      if (ok) stats.mailed++;
      else console.warn(`  mail failed: ${user.email}`);
    }
  }

  console.log('\nResult:', JSON.stringify(stats, null, 2));
  if (stats.noEmail && !process.env.WP_APP_USER?.trim()) {
    console.log('\nTip: .env.local 에 WP_APP_USER / WP_APP_PASSWORD 설정 후 재실행하면 이메일 포함 import 가능');
  }
  if (!write) console.log('\nDry-run. Re-run with --write (and optional --mail).');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
