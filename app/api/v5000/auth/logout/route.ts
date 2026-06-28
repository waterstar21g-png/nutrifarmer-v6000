import { NextResponse } from 'next/server';
import { SESSION_COOKIE, SESSION_COOKIE_OPTS } from '@/lib/v5000-auth/config';

export const dynamic = 'force-dynamic';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, '', { ...SESSION_COOKIE_OPTS, maxAge: 0 });
  return response;
}
