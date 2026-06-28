import { NextRequest, NextResponse } from 'next/server';
import { loginErrorMessage } from '@/lib/v5000-auth/config';
import { withDatabase } from '@/lib/v5000-auth/api';
import { createPasswordReset } from '@/lib/v5000-auth/recovery';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: { login?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: 'empty', message: loginErrorMessage('empty') },
      { status: 400 },
    );
  }

  const login = (body.login ?? '').trim();
  if (!login) {
    return NextResponse.json(
      { ok: false, code: 'empty_login', message: loginErrorMessage('empty_login') },
      { status: 400 },
    );
  }

  const result = await withDatabase(async () => {
    const out = await createPasswordReset(login);

    if (!out.ok) {
      return NextResponse.json(
        {
          ok: false,
          code: out.code,
          message: loginErrorMessage(out.code),
          attempt: out.attempt,
          pick_users: out.pick_users,
        },
        { status: 400 },
      );
    }

    if (!out.token) {
      return NextResponse.json({
        ok: true,
        sent: true,
        message: '입력하신 정보와 일치하는 계정이 있다면 확인 코드 메일을 보냈습니다.',
      });
    }

    return NextResponse.json({
      ok: true,
      token: out.token,
      maskedEmail: out.maskedEmail,
      message: `${out.maskedEmail}(으)로 확인 코드 메일을 보냈습니다.`,
    });
  });

  if (result instanceof NextResponse) return result;
  return result;
}
