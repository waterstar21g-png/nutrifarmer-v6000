/** DB 조회 실패와 진짜 빈 목록 구분 */
export type SafeFetchResult<T> = {
  data: T;
  loadFailed: boolean;
};

export async function safeFetchPosts<T>(
  fn: () => Promise<T>,
  empty: T,
): Promise<SafeFetchResult<T>> {
  try {
    return { data: await fn(), loadFailed: false };
  } catch (err) {
    console.error('[v6000] DB fetch failed:', err);
    return { data: empty, loadFailed: true };
  }
}

export const POSTS_LOAD_ERROR_MSG =
  '글 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
