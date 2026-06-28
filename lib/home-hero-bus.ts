/** 홈 헤더 카테고리 → 히어로 영역 필터 (쇼케이스 미리보기와 분리) */

type Listener = (slug: string | null) => void;

const listeners = new Set<Listener>();
let current: string | null = null;

export function subscribeHomeHero(fn: Listener): () => void {
  fn(current);
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setHomeHeroCategory(slug: string | null) {
  current = slug;
  listeners.forEach(fn => fn(slug));
}

export function getHomeHeroCategory(): string | null {
  return current;
}
