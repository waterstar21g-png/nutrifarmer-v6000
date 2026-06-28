import { NextRequest, NextResponse } from 'next/server';
import { loginErrorMessage } from '@/lib/v5000-auth/config';
import { withDatabase } from '@/lib/v5000-auth/api';
import { isValidEmail } from '@/lib/v5000-auth/validate';
import { sendFindAccountEmail } from '@/lib/v5000-auth/recovery';

export const dynamic = 'force-dynamic';

const FIND_SUCCESS =
  '입력한 이메일로 계정 안내 메일을 보냈습니다. 메일함·스팸함을 확인한 뒤 로그인해 주세요.';

export async function POST(req: NextRequest) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: 'empty', message: loginErrorMessage('empty') },
      { status: 400 },
    );
  }

  const email = (body.email ?? '').trim();
  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { ok: false, code: 'invalid_email', message: loginErrorMessage('invalid_email') },
      { status: 400 },
    );
  }

  const result = await withDatabase(async () => {
    const sent = await sendFindAccountEmail(email);
    if (!sent.ok) {
      return NextResponse.json(
        { ok: false, code: sent.code, message: loginErrorMessage(sent.code) },
        { status: 400 },
      );
    }
    return NextResponse.json({ ok: true, sent: true, message: FIND_SUCCESS });
  });

  if (result instanceof NextResponse) return result;
  return result;
}
