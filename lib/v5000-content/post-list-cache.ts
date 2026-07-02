import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import {
  listLatestPublished,
  listPublishedByCategory,
  searchPublishedPosts,
} from '@/lib/v5000-content/posts';
import type { V5000PostRow } from '@/lib/v5000-content/schema';

/** 공개 목록 — Neon 전송량 절감 (5분 캐시) */
export const POST_LIST_REVALIDATE_SEC = 300;

export const POSTS_LIST_TAG = 'v5000-posts-list';

export function postCategoryTag(categorySlug: string): string {
  return `${POSTS_LIST_TAG}-cat-${categorySlug}`;
}

export function invalidatePostListCache(categorySlugs?: string | string[]): void {
  revalidateTag(POSTS_LIST_TAG);
  if (!categorySlugs) return;
  const list = Array.isArray(categorySlugs) ? categorySlugs : [categorySlugs];
  for (const slug of list) {
    const s = slug?.trim();
    if (s) revalidateTag(postCategoryTag(s));
  }
}

/** 글 생성·수정·삭제 후 공개 페이지 캐시 갱신 */
export function invalidatePostPages(categorySlug: string, slug?: string): void {
  const cat = categorySlug.trim();
  invalidatePostListCache(cat);
  revalidatePath('/');
  if (cat) revalidatePath(`/${cat}`);
  if (slug?.trim() && cat) revalidatePath(`/${cat}/${slug.trim()}`);
}

export async function getCachedLatestPublished(limit: number): Promise<V5000PostRow[]> {
  return unstable_cache(
    async () => listLatestPublished(limit),
    [POSTS_LIST_TAG, 'latest', String(limit)],
    { revalidate: POST_LIST_REVALIDATE_SEC, tags: [POSTS_LIST_TAG] },
  )();
}

export async function getCachedPublishedByCategory(
  categorySlug: string,
  limit: number,
): Promise<V5000PostRow[]> {
  return unstable_cache(
    async () => listPublishedByCategory(categorySlug, limit),
    [POSTS_LIST_TAG, 'cat', categorySlug, String(limit)],
    {
      revalidate: POST_LIST_REVALIDATE_SEC,
      tags: [POSTS_LIST_TAG, postCategoryTag(categorySlug)],
    },
  )();
}

export async function getCachedSearchPublished(
  query: string,
  limit: number,
): Promise<V5000PostRow[]> {
  const q = query.trim();
  if (!q) return [];
  return unstable_cache(
    async () => searchPublishedPosts(q, limit),
    [POSTS_LIST_TAG, 'search', q, String(limit)],
    { revalidate: 60, tags: [POSTS_LIST_TAG] },
  )();
}
