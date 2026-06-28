import { NextRequest, NextResponse } from 'next/server';
import {
  loginErrorMessage,
  postLoginRedirectPath,
  SESSION_COOKIE,
  SESSION_COOKIE_OPTS,
} from '@/lib/v5000-auth/config';
import { withDatabase } from '@/lib/v5000-auth/api';
import { encodeSession, sessionMaxAge } from '@/lib/v5000-auth/session';
import {
  createUser,
  checkEmailRegistration,
  isLoginIdTaken,
  validateRegisterInput,
} from '@/lib/v5000-auth/users';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: Record<string, string | undefined>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: 'empty', message: loginErrorMessage('empty') },
      { status: 400 },
    );
  }

  const validated = validateRegisterInput({
    username: body.username,
    display_name: body.display_name,
    email: body.email,
    password: body.password,
    password_confirm: body.password_confirm,
  });

  if (!validated.ok) {
    return NextResponse.json(
      {
        ok: false,
        code: validated.code,
        message: loginErrorMessage(validated.code),
        attempt: validated.attempt,
      },
      { status: 400 },
    );
  }

  const result = await withDatabase(async () => {
    if (await isLoginIdTaken(validated.data.loginId)) {
      return NextResponse.json(
        {
          ok: false,
          code: 'login_id_taken',
          message: loginErrorMessage('login_id_taken'),
          attempt: validated.data.displayName,
        },
        { status: 400 },
      );
    }

    const emailCheck = await checkEmailRegistration(validated.data.email);
    if (!emailCheck.ok) {
      return NextResponse.json(
        {
          ok: false,
          code: emailCheck.code,
          message: loginErrorMessage(emailCheck.code),
          attempt: validated.data.displayName,
        },
        { status: 400 },
      );
    }

    const user = await createUser(validated.data);
    const redirectPath = postLoginRedirectPath();
    const token = encodeSession({
      userId: user.id,
      role: user.role,
      loginId: user.loginId,
      displayName: user.displayName,
    });

    const response = NextResponse.json({
      ok: true,
      redirect: redirectPath,
      welcome_id: user.loginId,
      welcome_name: user.displayName,
    });
    response.cookies.set(SESSION_COOKIE, token, {
      ...SESSION_COOKIE_OPTS,
      maxAge: sessionMaxAge(false),
    });
    return response;
  });

  if (result instanceof NextResponse) return result;
  return result;
}
