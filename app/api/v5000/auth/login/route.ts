import { NextRequest, NextResponse } from 'next/server';
import {
  loginErrorMessage,
  postLoginRedirectPath,
  SESSION_COOKIE,
  SESSION_COOKIE_OPTS,
} from '@/lib/v5000-auth/config';
import { isDatabaseConfigured } from '@/lib/v5000-auth/db';
import { withDatabase } from '@/lib/v5000-auth/api';
import { verifyPassword } from '@/lib/v5000-auth/password';
import { encodeSession, sessionMaxAge } from '@/lib/v5000-auth/session';
import {
  findUserById,
  formatPickUser,
  lookupUsersByLogin,
} from '@/lib/v5000-auth/users';
import type { V5000User } from '@/lib/v5000-auth/schema';

export const dynamic = 'force-dynamic';

function authConfigResponse() {
  return NextResponse.json(
    { ok: false, code: 'auth_unconfigured', message: loginErrorMessage('auth_unconfigured') },
    { status: 503 },
  );
}

function loginRedirectPath(): string {
  return postLoginRedirectPath();
}

export async function POST(req: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { ok: false, code: 'database_unconfigured', message: loginErrorMessage('database_unconfigured') },
      { status: 503 },
    );
  }
  if (!process.env.AUTH_SESSION_SECRET?.trim() && process.env.NODE_ENV === 'production') {
    return authConfigResponse();
  }

  let body: {
    login?: string;
    password?: string;
    remember?: boolean;
    pick_user?: number;
    redirect_to?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: 'empty', message: loginErrorMessage('empty') },
      { status: 400 },
    );
  }

  const login = (body.login ?? '').trim();
  const password = body.password ?? '';

  if (!login || !password) {
    return NextResponse.json(
      { ok: false, code: 'empty', message: loginErrorMessage('empty') },
      { status: 400 },
    );
  }

  const result = await withDatabase(async () => {
    let user: V5000User | null = null;

    if (body.pick_user) {
      user = await findUserById(body.pick_user);
      const lookup = await lookupUsersByLogin(login);
      const allowed = lookup.users.some(u => u.id === body.pick_user);
      if (!user || !allowed) {
        return NextResponse.json(
          {
            ok: false,
            code: 'user_not_found',
            message: loginErrorMessage('user_not_found'),
            attempt: login,
            pick_users: lookup.users.map(formatPickUser),
          },
          { status: 400 },
        );
      }
    } else {
      const lookup = await lookupUsersByLogin(login);
      if (lookup.status === 'ambiguous') {
        return NextResponse.json(
          {
            ok: false,
            code: 'ambiguous',
            message: loginErrorMessage('ambiguous'),
            attempt: login,
            pick_users: lookup.users.map(formatPickUser),
          },
          { status: 400 },
        );
      }
      if (lookup.status !== 'found' || !lookup.users[0]) {
        return NextResponse.json(
          {
            ok: false,
            code: 'user_not_found',
            message: loginErrorMessage('user_not_found'),
            attempt: login,
          },
          { status: 400 },
        );
      }
      user = lookup.users[0];
    }

    if (user.mustResetPassword || !user.passwordHash) {
      return NextResponse.json(
        {
          ok: false,
          code: 'must_reset_password',
          message: loginErrorMessage('must_reset_password'),
          attempt: login,
        },
        { status: 403 },
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        {
          ok: false,
          code: 'incorrect_password',
          message: loginErrorMessage('incorrect_password'),
          attempt: login,
        },
        { status: 400 },
      );
    }

    return { user, remember: !!body.remember };
  });

  if (result instanceof NextResponse) return result;

  const { user, remember } = result;
  const redirectPath = loginRedirectPath();
  const token = encodeSession(
    {
      userId: user.id,
      role: user.role,
      loginId: user.loginId,
      displayName: user.displayName,
      remember,
    },
    remember,
  );

  const response = NextResponse.json({
    ok: true,
    redirect: redirectPath,
    user: { name: user.displayName, loginId: user.loginId },
  });
  response.cookies.set(SESSION_COOKIE, token, {
    ...SESSION_COOKIE_OPTS,
    maxAge: sessionMaxAge(remember),
  });
  return response;
}
