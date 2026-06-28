import { NextRequest, NextResponse } from 'next/server';
import { canEditPost, requireSession, withDatabase } from '@/lib/v5000-content/api';
import { deletePost, findPostById, toPostDto, updatePost } from '@/lib/v5000-content/posts';
import { postErrorMessage, validatePostInput } from '@/lib/v5000-content/validate';

export const dynamic = 'force-dynamic';

type RouteCtx = { params: Promise<{ id: string }> };

async function parseId(params: Promise<{ id: string }>): Promise<number | null> {
  const id = parseInt((await params).id, 10);
  return Number.isFinite(id) ? id : null;
}

export async function GET(_req: NextRequest, ctx: RouteCtx) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const id = await parseId(ctx.params);
  if (!id) {
    return NextResponse.json({ ok: false, code: 'not_found', message: postErrorMessage('not_found') }, { status: 404 });
  }

  const result = await withDatabase(async () => {
    const row = await findPostById(id);
    if (!row) {
      return NextResponse.json({ ok: false, code: 'not_found', message: postErrorMessage('not_found') }, { status: 404 });
    }
    if (!canEditPost(session, row.authorId) && row.status !== 'publish') {
      return NextResponse.json({ ok: false, code: 'forbidden', message: postErrorMessage('forbidden') }, { status: 403 });
    }
    return NextResponse.json({ ok: true, post: toPostDto(row) });
  });

  if (result instanceof NextResponse) return result;
  return result;
}

export async function PUT(req: NextRequest, ctx: RouteCtx) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const id = await parseId(ctx.params);
  if (!id) {
    return NextResponse.json({ ok: false, code: 'not_found', message: postErrorMessage('not_found') }, { status: 404 });
  }

  let body: {
    title?: string;
    body?: string;
    excerpt?: string;
    categorySlug?: string;
    status?: 'draft' | 'publish';
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, code: 'invalid_json', message: postErrorMessage() }, { status: 400 });
  }

  if (body.categorySlug !== undefined) {
    const validation = validatePostInput({ categorySlug: body.categorySlug });
    if (!validation.ok) {
      return NextResponse.json(
        { ok: false, code: validation.code, message: postErrorMessage(validation.code) },
        { status: 400 },
      );
    }
  }
  if (body.status !== undefined && body.status !== 'draft' && body.status !== 'publish') {
    return NextResponse.json(
      { ok: false, code: 'invalid_status', message: postErrorMessage('invalid_status') },
      { status: 400 },
    );
  }

  const result = await withDatabase(async () => {
    const existing = await findPostById(id);
    if (!existing) {
      return NextResponse.json({ ok: false, code: 'not_found', message: postErrorMessage('not_found') }, { status: 404 });
    }
    if (!canEditPost(session, existing.authorId)) {
      return NextResponse.json({ ok: false, code: 'forbidden', message: postErrorMessage('forbidden') }, { status: 403 });
    }

    const row = await updatePost(id, {
      title: body.title,
      body: body.body,
      excerpt: body.excerpt,
      categorySlug: body.categorySlug?.trim(),
      status: body.status,
    });
    if (!row) {
      return NextResponse.json({ ok: false, code: 'not_found', message: postErrorMessage('not_found') }, { status: 404 });
    }
    return NextResponse.json({ ok: true, post: toPostDto(row) });
  });

  if (result instanceof NextResponse) return result;
  return result;
}

export async function DELETE(_req: NextRequest, ctx: RouteCtx) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const id = await parseId(ctx.params);
  if (!id) {
    return NextResponse.json({ ok: false, code: 'not_found', message: postErrorMessage('not_found') }, { status: 404 });
  }

  const result = await withDatabase(async () => {
    const existing = await findPostById(id);
    if (!existing) {
      return NextResponse.json({ ok: false, code: 'not_found', message: postErrorMessage('not_found') }, { status: 404 });
    }
    if (!canEditPost(session, existing.authorId)) {
      return NextResponse.json({ ok: false, code: 'forbidden', message: postErrorMessage('forbidden') }, { status: 403 });
    }
    await deletePost(id);
    return NextResponse.json({ ok: true });
  });

  if (result instanceof NextResponse) return result;
  return result;
}
