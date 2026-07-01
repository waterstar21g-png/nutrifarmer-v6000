import { NextResponse } from 'next/server';
import { isDatabaseConfigured, resetDb } from './db';
import { loginErrorMessage } from './config';

export function dbUnavailableResponse() {
  return NextResponse.json(
    { ok: false, code: 'database_unconfigured', message: loginErrorMessage('database_unconfigured') },
    { status: 503 },
  );
}

function isTransientDbError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  return (
    lower.includes('fetch failed') ||
    lower.includes('timeout') ||
    lower.includes('timed out') ||
    lower.includes('connection') ||
    lower.includes('econnreset') ||
    lower.includes('etimedout') ||
    lower.includes('terminated') ||
    lower.includes('503') ||
    lower.includes('429') ||
    lower.includes('too many connections') ||
    lower.includes('57p01') ||
    lower.includes('neon') ||
    lower.includes('prepared statement') ||
    lower.includes('pgbouncer')
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function withDatabase<T>(fn: () => Promise<T>): Promise<T | NextResponse> {
  if (!isDatabaseConfigured()) {
    return dbUnavailableResponse();
  }

  const maxAttempts = 2;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const retry = isTransientDbError(err) && attempt < maxAttempts - 1;
      if (retry) {
        console.warn('[v5000-auth] transient DB error, retrying…', err);
        resetDb();
        await sleep(700);
        continue;
      }
      console.error('[v5000-auth]', err);
      return NextResponse.json(
        { ok: false, code: 'database_error', message: loginErrorMessage('database_error') },
        { status: 500 },
      );
    }
  }

  return NextResponse.json(
    { ok: false, code: 'database_error', message: loginErrorMessage('database_error') },
    { status: 500 },
  );
}
