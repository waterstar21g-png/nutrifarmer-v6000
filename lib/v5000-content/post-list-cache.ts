import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import {
  listLatestPublished,
  listPublishedByCategory,
  searchPublishedPosts,
  type V5000PostListRow,
} from '@/lib/v5000-content/posts';
import { loadPostListStale, savePostListStale } from '@/lib/v5000-content/post-list-stale';

/** 공개 목록 — Neon 전송량 절감 (5분 캐시) */
export const POST_LIST_REVALIDATE_SEC = 300;

export const POSTS_LIST_TAG = 'v5000-posts-list';

export type CachedPostList<T> = { data: T; stale: boolean };

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

async function fetchWithStale<T>(
  staleKey: string,
  fetchFresh: () => Promise<T>,
): Promise<CachedPostList<T>> {
  try {
    const data = await fetchFresh();
    savePostListStale(staleKey, data);
    return { data, stale: false };
  } catch (err) {
    console.error(`[v6000] post list fetch failed (${staleKey}):`, err);
    const cached = loadPostListStale<T>(staleKey);
    if (cached != null) {
      const isEmpty = Array.isArray(cached) && cached.length === 0;
      if (!isEmpty) return { data: cached, stale: true };
    }
    throw err;
  }
}

export async function getCachedLatestPublished(
  limit: number,
): Promise<CachedPostList<V5000PostListRow[]>> {
  const staleKey = `latest:${limit}`;
  return fetchWithStale(staleKey, () =>
    unstable_cache(
      async () => listLatestPublished(limit),
      [POSTS_LIST_TAG, 'latest', String(limit)],
      { revalidate: POST_LIST_REVALIDATE_SEC, tags: [POSTS_LIST_TAG] },
    )(),
  );
}

export async function getCachedPublishedByCategory(
  categorySlug: string,
  limit: number,
): Promise<CachedPostList<V5000PostListRow[]>> {
  const staleKey = `cat:${categorySlug}:${limit}`;
  return fetchWithStale(staleKey, () =>
    unstable_cache(
      async () => listPublishedByCategory(categorySlug, limit),
      [POSTS_LIST_TAG, 'cat', categorySlug, String(limit)],
      {
        revalidate: POST_LIST_REVALIDATE_SEC,
        tags: [POSTS_LIST_TAG, postCategoryTag(categorySlug)],
      },
    )(),
  );
}

export async function getCachedSearchPublished(
  query: string,
  limit: number,
): Promise<CachedPostList<V5000PostListRow[]>> {
  const q = query.trim();
  if (!q) return { data: [], stale: false };
  const staleKey = `search:${q}:${limit}`;
  return fetchWithStale(staleKey, () =>
    unstable_cache(
      async () => searchPublishedPosts(q, limit),
      [POSTS_LIST_TAG, 'search', q, String(limit)],
      { revalidate: 60, tags: [POSTS_LIST_TAG] },
    )(),
  );
}
