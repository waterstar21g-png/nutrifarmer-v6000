import { NextRequest, NextResponse } from 'next/server';
import {
  loginErrorMessage,
  SESSION_COOKIE,
  SESSION_COOKIE_OPTS,
} from '@/lib/v5000-auth/config';
import { withDatabase } from '@/lib/v5000-auth/api';
import { validatePasswordPair } from '@/lib/v5000-auth/password';
import { completePasswordReset } from '@/lib/v5000-auth/recovery';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: { token?: string; password?: string; password_confirm?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: 'empty', message: loginErrorMessage('empty') },
      { status: 400 },
    );
  }

  const token = (body.token ?? '').trim();
  const password = body.password ?? '';
  const confirm = body.password_confirm ?? '';

  if (!token) {
    return NextResponse.json(
      { ok: false, code: 'code_expired', message: loginErrorMessage('code_expired') },
      { status: 400 },
    );
  }

  const pwCheck = validatePasswordPair(password, confirm);
  if (!pwCheck.ok) {
    return NextResponse.json(
      { ok: false, code: pwCheck.code, message: loginErrorMessage(pwCheck.code) },
      { status: 400 },
    );
  }

  const result = await withDatabase(async () => {
    const out = await completePasswordReset(token, password);
    if (!out.ok) {
      return NextResponse.json(
        { ok: false, code: out.code, message: loginErrorMessage(out.code) },
        { status: 400 },
      );
    }

    const response = NextResponse.json({
      ok: true,
      resetSuccess: true,
      message: '비밀번호가 변경되었습니다. 새 비밀번호로 로그인해 주세요.',
    });
    response.cookies.set(SESSION_COOKIE, '', { ...SESSION_COOKIE_OPTS, maxAge: 0 });
    return response;
  });

  if (result instanceof NextResponse) return result;
  return result;
}
