/** 단일글 이동 — pathname·pid 변경 시 전체 로드(2번째 이후 글 무반응 방지) */
export function navigateToPost(href: string): void {
  if (typeof window === 'undefined') return;
  const next = new URL(href, window.location.origin);
  const cur = new URL(window.location.href);
  if (cur.pathname === next.pathname && cur.search === next.search) return;
  window.location.assign(`${next.pathname}${next.search}`);
}
