/** 사이드바·게시글 가져오기 — 동일 정렬 (최신 게시일 → 수정일) */
export function sortPostsByPublishDate<
  T extends { publishedAt?: string | Date | null; updatedAt?: string | Date | null },
>(posts: T[]): T[] {
  const ts = (v?: string | Date | null) => (v ? new Date(v).getTime() : 0);
  return [...posts].sort((a, b) => {
    const pub = ts(b.publishedAt) - ts(a.publishedAt);
    if (pub !== 0) return pub;
    return ts(b.updatedAt) - ts(a.updatedAt);
  });
}
