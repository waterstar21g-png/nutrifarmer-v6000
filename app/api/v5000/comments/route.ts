import { NextRequest, NextResponse } from 'next/server';
import { withDatabase } from '@/lib/v5000-content/api';
import { createComment, listApprovedComments } from '@/lib/v5000-content/comments';

export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parsePostId(req: NextRequest): number | null {
  const raw = req.nextUrl.searchParams.get('post_id');
  if (!raw) return null;
  const id = parseInt(raw, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export async function GET(req: NextRequest) {
  const postId = parsePostId(req);
  if (!postId) {
    return NextResponse.json({ ok: false, message: 'post_id가 필요합니다.' }, { status: 400 });
  }

  const result = await withDatabase(async () => {
    const comments = await listApprovedComments(postId);
    return NextResponse.json({ ok: true, comments });
  });

  if (result instanceof NextResponse) return result;
  return result;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: 'JSON 본문이 필요합니다.' }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const postId = typeof data.postId === 'number' ? data.postId : parseInt(String(data.postId ?? ''), 10);
  const authorName = String(data.authorName ?? '').trim().slice(0, 200);
  const authorEmail = String(data.authorEmail ?? '').trim().slice(0, 320);
  const authorUrl = String(data.authorUrl ?? '').trim().slice(0, 1024);
  const text = String(data.body ?? '').trim().slice(0, 5000);

  if (!Number.isFinite(postId) || postId <= 0) {
    return NextResponse.json({ ok: false, message: 'postId가 올바르지 않습니다.' }, { status: 400 });
  }
  if (!authorName) {
    return NextResponse.json({ ok: false, message: '이름을 입력해 주세요.' }, { status: 400 });
  }
  if (!authorEmail || !EMAIL_RE.test(authorEmail)) {
    return NextResponse.json({ ok: false, message: '이메일을 올바르게 입력해 주세요.' }, { status: 400 });
  }
  if (!text) {
    return NextResponse.json({ ok: false, message: '댓글 내용을 입력해 주세요.' }, { status: 400 });
  }

  const result = await withDatabase(async () => {
    try {
      const comment = await createComment({
        postId,
        authorName,
        authorEmail,
        authorUrl: authorUrl || undefined,
        body: text,
      });
      return NextResponse.json({ ok: true, comment });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown';
      if (msg === 'post_not_found') {
        return NextResponse.json({ ok: false, message: '게시글을 찾을 수 없습니다.' }, { status: 404 });
      }
      throw e;
    }
  });

  if (result instanceof NextResponse) return result;
  return result;
}
