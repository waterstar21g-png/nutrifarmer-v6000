import { NextResponse } from 'next/server';
import { withDatabase } from '@/lib/v5000-auth/api';
import { readSessionFromCookies, type V5000Session } from '@/lib/v5000-auth/session';

export { withDatabase };

export async function requireSession(): Promise<V5000Session | NextResponse> {
  const session = await readSessionFromCookies();
  if (!session) {
    return NextResponse.json({ ok: false, code: 'unauthorized', message: '먼저 로그인 하세요' }, { status: 401 });
  }
  return session;
}

/** V6.1 개발 단계 — 로그인 사용자 전원 수정·삭제 허용 (향후 샛별·일반·가족·관리자 등급) */
export function canEditPost(_session: V5000Session, _authorId: number): boolean {
  return true;
}
