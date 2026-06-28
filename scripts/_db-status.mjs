import { loadEnvFiles, getPostgresUrl } from './_load-env.mjs';
import { neon } from '@neondatabase/serverless';

loadEnvFiles();
const url = getPostgresUrl();
if (!url) {
  console.log('POSTGRES_URL: missing');
  process.exit(0);
}

const sql = neon(url);
const [users, posts, mirror, mustReset] = await Promise.all([
  sql`select count(*)::int as c from v5000_users`,
  sql`select count(*)::int as c from v5000_posts where status = 'publish'`,
  sql`select count(*)::int as c from v5000_media_mirror`,
  sql`select count(*)::int as c from v5000_users where must_reset_password = true`,
]);
console.log('v5000_users:', users[0].c);
console.log('v5000_users (must_reset):', mustReset[0].c);
console.log('v5000_posts (published):', posts[0].c);
console.log('v5000_media_mirror:', mirror[0].c);

const userRows = await sql`select id, login_id, display_name, role, must_reset_password, migration_source from v5000_users order by id`;
console.log('users:', userRows);
