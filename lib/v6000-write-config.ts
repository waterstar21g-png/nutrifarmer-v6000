/** V6.1 모바일 쓰기·사진 AI — 설정 */

export const V6000_AUTO_MODE_KEY = 'nf-v6000-auto-mode';
export const V6000_LAST_POST_KEY = 'nf-v6000-last-post';

/** @deprecated V7000 백업 키 — 읽기 폴백용 */
export const V7000_AUTO_MODE_KEY = 'nf-v7000-auto-mode';
/** @deprecated V7000 백업 키 — 읽기 폴백용 */
export const V7000_LAST_POST_KEY = 'nf-v7000-last-post';

export type PhotoFlowMode = 'single' | 'continuous' | 'multi';

export interface V6000LastPost {
  id: number;
  slug: string;
  categorySlug: string;
  title: string;
  at: number;
}

export interface V6000MenuItem {
  id: number;
  title: string;
  desc: string;
  href?: string;
  action?: 'auto-toggle' | 'last-post';
  external?: boolean;
}

export const V6000_MENUS: V6000MenuItem[] = [
  { id: 1, title: '사진 → 글', desc: '한 장으로 AI 글 작성', href: '/photo' },
  { id: 2, title: '글 → 사진', desc: '글 내용에 맞는 이미지 추천', href: '/text' },
  { id: 3, title: '사진 → 글 연속', desc: '게시 후 바로 다음 사진', href: '/photo?mode=continuous' },
  { id: 4, title: '여러 사진 합치기', desc: '여러 장을 한 글로', href: '/photo?mode=multi' },
  { id: 5, title: '전 구간 자동', desc: '확인·게시 자동 (토글)', action: 'auto-toggle' },
  { id: 6, title: '게시글 보기', desc: '방금 쓴 글 읽기', action: 'last-post' },
];

export const PHOTO_FLOW_STEPS = ['사진', 'AI', '확인', '완료'] as const;
export const TEXT_FLOW_STEPS = ['글쓰기', '사진', '완료'] as const;
export const WRITE_FLOW_STEPS = ['작성', '게시', '완료'] as const;

export function postReadUrl(categorySlug: string, slug: string, postId: number): string {
  return `/${categorySlug}/${slug}?pid=${postId}`;
}

export function menuTitleForMode(mode: PhotoFlowMode): string {
  if (mode === 'multi') return '4 · 여러 사진 합치기';
  if (mode === 'continuous') return '3 · 사진→글 연속';
  return '1 · 사진→글';
}
