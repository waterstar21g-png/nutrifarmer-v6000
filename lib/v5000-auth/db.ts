import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as authSchema from './schema';
import * as contentSchema from '../v5000-content/schema';

const schema = { ...authSchema, ...contentSchema };

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function postgresUrl(): string | undefined {
  const keys = [
    'POSTGRES_URL',
    'DATABASE_URL',
    'POSTGRES_PRISMA_URL',
    'NEON_DATABASE_URL',
  ];
  for (const key of keys) {
    const v = process.env[key]?.trim();
    if (v) return v;
  }
  return undefined;
}

export function isDatabaseConfigured(): boolean {
  return !!postgresUrl();
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
