import { NextResponse } from 'next/server';
import {
  applyRefreshedSessionCookie,
  decodeSession,
  isSessionIdle,
  parseSessionPayload,
  readSessionTokenFromCookies,
} from '@/lib/v5000-auth/session';
import { SESSION_COOKIE, SESSION_COOKIE_OPTS, loginErrorMessage } from '@/lib/v5000-auth/config';

export const dynamic = 'force-dynamic';

export async function POST() {
  const token = await readSessionTokenFromCookies();
  if (!token) {
    return NextResponse.json({ ok: false, code: 'unauthorized', message: '로그인이 필요합니다.' }, { status: 401 });
  }

  const raw = parseSessionPayload(token);
  if (!raw) {
    const res = NextResponse.json({ ok: false, code: 'unauthorized', message: '로그인이 필요합니다.' }, { status: 401 });
    res.cookies.set(SESSION_COOKIE, '', { ...SESSION_COOKIE_OPTS, maxAge: 0 });
    return res;
  }

  const now = Math.floor(Date.now() / 1000);
  if (raw.exp < now) {
    const res = NextResponse.json({ ok: false, code: 'session_expired', message: loginErrorMessage('session_expired') }, { status: 401 });
    res.cookies.set(SESSION_COOKIE, '', { ...SESSION_COOKIE_OPTS, maxAge: 0 });
    return res;
  }

  if (isSessionIdle(raw)) {
    const res = NextResponse.json({ ok: false, code: 'session_idle', message: loginErrorMessage('session_idle') }, { status: 401 });
    res.cookies.set(SESSION_COOKIE, '', { ...SESSION_COOKIE_OPTS, maxAge: 0 });
    return res;
  }

  const session = decodeSession(token);
  if (!session) {
    return NextResponse.json({ ok: false, code: 'unauthorized', message: '로그인이 필요합니다.' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  applyRefreshedSessionCookie(res, session);
  return res;
}
