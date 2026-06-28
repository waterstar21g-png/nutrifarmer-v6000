import { NextRequest, NextResponse } from 'next/server';
import { requireSession, withDatabase } from '@/lib/v5000-content/api';
import { listCategories } from '@/lib/v5000-content/categories';
import { createPost, listPosts, listPublishedByCategory, toPostDto } from '@/lib/v5000-content/posts';
import { postErrorMessage, validatePostInput } from '@/lib/v5000-content/validate';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { searchParams } = req.nextUrl;
  const categorySlug = searchParams.get('category_slug') ?? undefined;
  const status = searchParams.get('status') ?? undefined;
  const search = searchParams.get('search') ?? undefined;
  const titleSearch = searchParams.get('search_title') ?? undefined;
  const bodySearch = searchParams.get('search_body') ?? undefined;
  const includeAll = searchParams.get('mine') === '0';
  const mineOnly = searchParams.has('mine') && searchParams.get('mine') !== '0';
  const cat = categorySlug?.trim() || undefined;
  const onlyCategory =
    !mineOnly &&
    Boolean(cat) &&
    !titleSearch?.trim() &&
    !bodySearch?.trim() &&
    !search?.trim() &&
    (!status || status === 'publish');

  const result = await withDatabase(async () => {
    const rows = onlyCategory
      ? await listPublishedByCategory(cat!, 100)
      : await listPosts({
          authorId: includeAll ? undefined : session.userId,
          categorySlug: cat,
          status,
          search,
          titleSearch,
          bodySearch,
          limit: 100,
        });
    return NextResponse.json({
      ok: true,
      posts: rows.map(toPostDto),
      categories: listCategories(),
    });
  });

  if (result instanceof NextResponse) return result;
  return result;
}

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

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

  const validation = validatePostInput({
    title: body.title,
    body: body.body,
    excerpt: body.excerpt,
    categorySlug: body.categorySlug,
    status: body.status ?? 'publish',
  });
  if (!validation.ok) {
    return NextResponse.json(
      { ok: false, code: validation.code, message: postErrorMessage(validation.code) },
      { status: 400 },
    );
  }

  const result = await withDatabase(async () => {
    const row = await createPost({
      title: body.title ?? '',
      body: body.body ?? '',
      excerpt: body.excerpt ?? '',
      categorySlug: body.categorySlug!.trim(),
      status: body.status ?? 'publish',
      authorId: session.userId,
    });
    return NextResponse.json({ ok: true, post: toPostDto(row) });
  });

  if (result instanceof NextResponse) return result;
  return result;
}
