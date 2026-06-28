#!/usr/bin/env node
/**
 * Usage: node scripts/promote-user-role.mjs waterstar21 admin
 */
import { neon } from '@neondatabase/serverless';
import { loadEnvFiles, getPostgresUrl } from './_load-env.mjs';

const loginId = process.argv[2]?.trim();
const role = process.argv[3]?.trim() || 'admin';

if (!loginId) {
  console.error('Usage: node scripts/promote-user-role.mjs <login_id> [role]');
  process.exit(1);
}

loadEnvFiles();
const url = getPostgresUrl();
if (!url) {
  console.error('POSTGRES_URL required');
  process.exit(1);
}

const sql = neon(url);
const rows = await sql`
  update v5000_users
  set role = ${role}, updated_at = now()
  where login_id = ${loginId}
  returning id, login_id, display_name, role
`;

if (!rows.length) {
  console.error(`User not found: ${loginId}`);
  process.exit(1);
}

console.log('Updated:', rows[0]);
