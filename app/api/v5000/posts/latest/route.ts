import { NextRequest, NextResponse } from 'next/server';
import { withDatabase } from '@/lib/v5000-content/api';
import { listPublishedByCategory } from '@/lib/v5000-content/posts';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const categorySlug = req.nextUrl.searchParams.get('category_slug')?.trim();
  if (!categorySlug) {
    return NextResponse.json({ ok: false, message: 'category_slug가 필요합니다.' }, { status: 400 });
  }

  const result = await withDatabase(async () => {
    const rows = await listPublishedByCategory(categorySlug, 1);
    const post = rows[0];
    if (!post) {
      return NextResponse.json({ ok: false, message: '게시글이 없습니다.' }, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      post: { id: post.id, slug: post.slug, categorySlug: post.categorySlug },
    });
  });

  if (result instanceof NextResponse) return result;
  return result;
}
