import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { searchPosts } from '@/lib/site-content';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q) return NextResponse.json({ posts: [] });

  const rows = await searchPosts(q, 12).catch(() => []);

  const results = rows.map(row => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    categorySlug: row.categorySlug,
    categoryName: row.categoryName,
    imageUrl: row.imageUrl,
    pid: row.pid,
  }));

  return NextResponse.json({ posts: results });
}
