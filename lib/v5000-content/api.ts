import { NextResponse } from 'next/server';
import { withDatabase } from '@/lib/v5000-auth/api';
import { readSessionFromCookies, type V5000Session } from '@/lib/v5000-auth/session';

export { withDatabase };

export async function requireSession(): Promise<V5000Session | NextResponse> {
  const session = await readSessionFromCookies();
  if (!session) {
    return NextResponse.json({ ok: false, code: 'unauthorized', message: '로그인이 필요합니다.' }, { status: 401 });
  }
  return session;
}

export function canEditPost(session: V5000Session, authorId: number): boolean {
  return session.role === 'admin' || session.userId === authorId;
}
