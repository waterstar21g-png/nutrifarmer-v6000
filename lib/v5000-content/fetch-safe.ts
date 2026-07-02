import { classifyDbError, postsUnavailableMessage } from '@/lib/v5000-content/db-error';

/** DB 조회 결과 — 실패·캐시·빈 목록 구분 */
export type SafeFetchResult<T> = {
  data: T;
  loadFailed: boolean;
  stale?: boolean;
  notice?: string;
};

export async function safeFetchPostList<T>(
  fn: () => Promise<{ items: T; stale: boolean }>,
): Promise<SafeFetchResult<T>> {
  try {
    const { items, stale } = await fn();
    return { data: items, loadFailed: false, stale: stale || undefined };
  } catch (err) {
    console.error('[v6000] DB fetch failed:', err);
    const kind = classifyDbError(err);
    return {
      data: [] as T,
      loadFailed: true,
      notice: postsUnavailableMessage(kind),
    };
  }
}

/** @deprecated safeFetchPostList 사용 */
export async function safeFetchPosts<T>(
  fn: () => Promise<T>,
  empty: T,
): Promise<SafeFetchResult<T>> {
  try {
    return { data: await fn(), loadFailed: false };
  } catch (err) {
    console.error('[v6000] DB fetch failed:', err);
    return {
      data: empty,
      loadFailed: true,
      notice: postsUnavailableMessage(classifyDbError(err)),
    };
  }
}
