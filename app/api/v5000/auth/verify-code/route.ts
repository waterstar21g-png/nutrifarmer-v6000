import { NextRequest, NextResponse } from 'next/server';
import { loginErrorMessage } from '@/lib/v5000-auth/config';
import { withDatabase } from '@/lib/v5000-auth/api';
import { verifyResetCode } from '@/lib/v5000-auth/recovery';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: { token?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: 'empty', message: loginErrorMessage('empty') },
      { status: 400 },
    );
  }

  const token = (body.token ?? '').trim();
  const code = (body.code ?? '').trim();

  if (!token) {
    return NextResponse.json(
      { ok: false, code: 'code_expired', message: loginErrorMessage('code_expired') },
      { status: 400 },
    );
  }
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json(
      { ok: false, code: 'invalid_code', message: loginErrorMessage('invalid_code') },
      { status: 400 },
    );
  }

  const result = await withDatabase(async () => {
    const out = await verifyResetCode(token, code);
    if (!out.ok) {
      return NextResponse.json(
        { ok: false, code: out.code, message: loginErrorMessage(out.code) },
        { status: 400 },
      );
    }
    return NextResponse.json({
      ok: true,
      token: out.token,
      message: '확인되었습니다. 새 비밀번호를 설정해 주세요.',
    });
  });

  if (result instanceof NextResponse) return result;
  return result;
}
