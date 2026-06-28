/** 선택한 카테고리 행을 HEADER(nav) 바로 아래로 — 아래로 내려가는 스크롤은 하지 않음 */
export function scrollElementBelowNav(el: HTMLElement | null, gap = 8) {
  if (!el || typeof window === 'undefined') return;
  const nav = document.querySelector('.nf-nav-bar');
  const navBottom = nav?.getBoundingClientRect().bottom ?? 0;
  const elTop = el.getBoundingClientRect().top + window.scrollY;
  const target = elTop - navBottom - gap;
  if (target < window.scrollY - 2) {
    window.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
  }
}
