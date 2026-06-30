import { NextResponse } from 'next/server';
import {
  applyRefreshedSessionCookie,
  decodeSession,
  isSessionIdle,
  parseSessionPayload,
  readSessionTokenFromCookies,
} from '@/lib/v5000-auth/session';
import { SESSION_COOKIE, SESSION_COOKIE_OPTS, loginErrorMessage } from '@/lib/v5000-auth/config';
import { withDatabase } from '@/lib/v5000-auth/api';

export const dynamic = 'force-dynamic';

function clearSessionResponse() {
  const res = NextResponse.json({ loggedIn: false });
  res.cookies.set(SESSION_COOKIE, '', { ...SESSION_COOKIE_OPTS, maxAge: 0 });
  return res;
}

export async function GET() {
  const token = await readSessionTokenFromCookies();
  if (!token) return NextResponse.json({ loggedIn: false });

  const raw = parseSessionPayload(token);
  if (!raw) return clearSessionResponse();

  const now = Math.floor(Date.now() / 1000);
  if (raw.exp < now) return clearSessionResponse();

  if (isSessionIdle(raw)) {
    const res = NextResponse.json({
      loggedIn: false,
      code: 'session_idle',
      message: loginErrorMessage('session_idle'),
    });
    res.cookies.set(SESSION_COOKIE, '', { ...SESSION_COOKIE_OPTS, maxAge: 0 });
    return res;
  }

  const session = decodeSession(token);
  if (!session) return clearSessionResponse();

  const result = await withDatabase(async () => {
    const { findUserById } = await import('@/lib/v5000-auth/users');
    const { countPublishedPostsByAuthor } = await import('@/lib/v5000-content/posts');
    const { userMemberGrade } = await import('@/lib/v5000-auth/config');

    const user = await findUserById(session.userId);
    if (!user) return clearSessionResponse();

    const publishedPostCount = await countPublishedPostsByAuthor(user.id);
    const res = NextResponse.json({
      loggedIn: true,
      user: {
        id: user.id,
        name: user.displayName,
        loginId: user.loginId,
        role: user.role,
        memberGrade: userMemberGrade(user.role, publishedPostCount),
        publishedPostCount,
        mustResetPassword: user.mustResetPassword,
      },
    });
    applyRefreshedSessionCookie(res, session);
    return res;
  });

  if (result instanceof NextResponse) return result;
  return result;
}
