import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as authSchema from './schema';
import * as contentSchema from '../v5000-content/schema';

const schema = { ...authSchema, ...contentSchema };

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

const URL_ENV_KEYS = [
  'POSTGRES_PRISMA_URL',
  'POSTGRES_URL',
  'DATABASE_URL',
  'POSTGRES_URL_NON_POOLING',
  'NEON_DATABASE_URL',
] as const;

function normalizePostgresUrl(raw: string): string {
  try {
    const u = new URL(raw);
    if (!u.searchParams.has('connect_timeout')) {
      u.searchParams.set('connect_timeout', '15');
    }
    if (process.env.NODE_ENV !== 'production' && u.searchParams.get('channel_binding') === 'require') {
      u.searchParams.delete('channel_binding');
    }
    if (!u.searchParams.has('sslmode')) {
      u.searchParams.set('sslmode', 'require');
    }
    return u.toString();
  } catch {
    return raw;
  }
}

export function postgresUrl(): string | undefined {
  for (const key of URL_ENV_KEYS) {
    const v = process.env[key]?.trim();
    if (v) return normalizePostgresUrl(v);
  }
  return undefined;
}

export function isDatabaseConfigured(): boolean {
  return !!postgresUrl();
}

export function resetDb(): void {
  dbInstance = null;
}

export function getDb() {
  if (dbInstance) return dbInstance;
  const url = postgresUrl();
  if (!url) {
    throw new Error('POSTGRES_URL is not configured');
  }
  const sql = neon(url);
  dbInstance = drizzle(sql, { schema });
  return dbInstance;
}

export { schema };
