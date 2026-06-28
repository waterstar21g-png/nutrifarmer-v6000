/** 선택한 카테고리 버튼 행을 HEADER 바로 아래에 맞추도록 스크롤 */
export function scrollRowUnderHeader(rowEl: HTMLElement | null) {
  if (!rowEl) return;
  const nav = document.querySelector('.nf-nav-bar');
  const topBar = document.querySelector('.nf-top-bar');
  const headerBottom =
    (nav?.getBoundingClientRect().bottom ?? 0) ||
    (topBar?.getBoundingClientRect().bottom ?? 0);
  const rowTop = rowEl.getBoundingClientRect().top + window.scrollY;
  const target = rowTop - headerBottom - 8;
  window.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
}
