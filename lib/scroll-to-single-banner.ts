/** 단일글 상단 배너를 sticky 헤더 바로 아래에 맞춤 */
export function scrollToSingleBanner(behavior: ScrollBehavior = 'auto') {
  const banner = document.getElementById('nf-single-banner-band');
  if (!banner || typeof window === 'undefined') return;

  const nav = document.querySelector('.nf-nav-bar');
  const topBar = document.querySelector('.nf-top-bar');
  const headerBottom =
    (nav?.getBoundingClientRect().bottom ?? 0) ||
    (topBar?.getBoundingClientRect().bottom ?? 0);
  const target = banner.getBoundingClientRect().top + window.scrollY - headerBottom;
  window.scrollTo({ top: Math.max(0, target), behavior });
}
