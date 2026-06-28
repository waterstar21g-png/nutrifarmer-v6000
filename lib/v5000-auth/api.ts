import { NextResponse } from 'next/server';
import { isDatabaseConfigured } from './db';
import { loginErrorMessage } from './config';

export function dbUnavailableResponse() {
  return NextResponse.json(
    { ok: false, code: 'database_unconfigured', message: loginErrorMessage('database_unconfigured') },
    { status: 503 },
  );
}

export async function withDatabase<T>(fn: () => Promise<T>): Promise<T | NextResponse> {
  if (!isDatabaseConfigured()) {
    return dbUnavailableResponse();
  }
  try {
    return await fn();
  } catch (err) {
    console.error('[v5000-auth]', err);
    return NextResponse.json(
      { ok: false, code: 'database_error', message: loginErrorMessage('database_error') },
      { status: 500 },
    );
  }
}
