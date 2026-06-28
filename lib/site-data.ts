/**
 * site-data.ts — 사이트 전역 정적 데이터 (단일 진실의 원천)
 * 카테고리/섹션 데이터를 한 곳에서 관리합니다.
 */

export interface CatItem {
  slug: string;
  name: string;
  desc: string;
  icon: string;
}

export interface StatItem {
  num: string;
  label: string;
  cards: CatItem[];
}

/** 8가지 메인 카테고리 쇼케이스 */
export const SHOWCASE_CATS: CatItem[] = [
  { slug: 'daily-life',       name: '일상 기록',   desc: '매일의 소소한 이야기',          icon: '📔' },
  { slug: 'family-growth',    name: '가족·성장',   desc: '자녀·손자 성장 기록',            icon: '🏡' },
  { slug: 'personal-archive', name: '개인 자료',   desc: '개인 자료 보관함',               icon: '📁' },
  { slug: 'archive-dev',      name: '프로그램',    desc: '프로그램 구축 자료',             icon: '💻' },
  { slug: 'life-photos',      name: '삶·사진',     desc: '삶의 기록과 사진',               icon: '📷' },
  { slug: 'revenue',          name: '수익관리',    desc: '수익 기록·분석',                 icon: '💰' },
  { slug: 'pro-writing',      name: '전문 글쓰기', desc: '전문적인 글과 칼럼',             icon: '✍️' },
  { slug: 'fresh-news',       name: '주변 이야기', desc: '주변 사람들의 신선한 이야기',    icon: '📰' },
];

/** 나를 소개합니다 섹션 */
export const ABOUT_ITEMS: CatItem[] = [
  { slug: 'about-memoir',     name: '추억하며',      desc: '삶의 추억과 회고',         icon: '🕯️' },
  { slug: 'about-program',    name: '프로그램 기록', desc: '개발 기록과 성장 노트',    icon: '💡' },
  { slug: 'personal-archive', name: '개인 자료',     desc: '개인 자료 보관함',         icon: '📁' },
  { slug: 'revenue',          name: '수익 관리',     desc: '수익 기록·분석',           icon: '📊' },
];

/** 가족 앨범 섹션 */
export const FAMILY_ITEMS: CatItem[] = [
  { slug: 'family-grandson',  name: '손자 성장일기', desc: '손자들의 성장 기록',       icon: '👶' },
  { slug: 'family-children',  name: '자녀 이야기',   desc: '자녀들의 따뜻한 이야기',  icon: '👨‍👧' },
  { slug: 'family-photos',    name: '가족 사진',     desc: '소중한 가족의 순간',       icon: '📸' },
  { slug: 'family-special',   name: '특별한 날',     desc: '특별한 날의 기록',         icon: '🎉' },
];

/** 통계 카운터 + 관련 카드 */
export const STAT_ITEMS: StatItem[] = [
  {
    num: '8+', label: '콘텐츠 카테고리',
    cards: SHOWCASE_CATS,
  },
  {
    num: '365', label: '일상 기록 가능일',
    cards: [
      { slug: 'daily-life',       name: '일상 기록',   desc: '매일의 소소한 이야기',   icon: '📔' },
      { slug: 'life-photos',      name: '삶·사진',     desc: '삶의 기록과 사진',       icon: '📷' },
      { slug: 'about-memoir',     name: '추억하며',    desc: '삶의 추억과 회고',       icon: '🕯️' },
      { slug: 'pro-writing',      name: '전문 글쓰기', desc: '전문적인 글과 칼럼',     icon: '✍️' },
      { slug: 'fresh-news',       name: '주변 이야기', desc: '신선한 주변 이야기',     icon: '📰' },
      { slug: 'revenue',          name: '수익관리',    desc: '수익 기록·분석',         icon: '💰' },
      { slug: 'archive-dev',      name: '프로그램',    desc: '프로그램 구축 자료',     icon: '💻' },
      { slug: 'personal-archive', name: '개인 자료',   desc: '개인 자료 보관함',       icon: '📁' },
    ],
  },
  {
    num: '∞', label: '가족·삶의 추억',
    cards: [
      { slug: 'family-growth',   name: '가족·성장',     desc: '자녀·손자 성장 기록',   icon: '🏡' },
      { slug: 'family-grandson', name: '손자 성장일기', desc: '손자들의 성장 기록',    icon: '👶' },
      { slug: 'family-children', name: '자녀 이야기',   desc: '자녀들의 이야기',       icon: '👨‍👧' },
      { slug: 'family-photos',   name: '가족 사진',     desc: '소중한 가족의 순간',    icon: '📸' },
      { slug: 'family-special',  name: '특별한 날',     desc: '특별한 날의 기록',      icon: '🎉' },
      { slug: 'life-photos',     name: '삶·사진',       desc: '삶의 기록과 사진',      icon: '📷' },
      { slug: 'about-memoir',    name: '추억하며',      desc: '삶의 추억과 회고',      icon: '🕯️' },
      { slug: 'about-program',   name: '프로그램 기록', desc: '개발 기록과 노트',      icon: '💡' },
    ],
  },
  {
    num: '4', label: '일상·가족·성장·나눔',
    cards: [
      { slug: 'daily-life',       name: '일상 기록',    desc: '매일의 소소한 이야기',  icon: '📔' },
      { slug: 'family-growth',    name: '가족·성장',    desc: '자녀·손자 성장 기록',   icon: '🏡' },
      { slug: 'about-memoir',     name: '추억하며',     desc: '삶의 추억과 회고',      icon: '🕯️' },
      { slug: 'fresh-news',       name: '주변 이야기',  desc: '신선한 주변 이야기',    icon: '📰' },
      { slug: 'pro-writing',      name: '전문 글쓰기',  desc: '전문적인 글과 칼럼',    icon: '✍️' },
      { slug: 'revenue',          name: '수익관리',     desc: '수익 기록·분석',        icon: '💰' },
      { slug: 'personal-archive', name: '개인 자료',    desc: '개인 자료 보관함',      icon: '📁' },
      { slug: 'archive-dev',      name: '프로그램',     desc: '프로그램 구축 자료',    icon: '💻' },
    ],
  },
];

/** 메인 카테고리 슬러그 목록 (nav/footer용) */
export const MAIN_CAT_SLUGS = SHOWCASE_CATS.map(c => c.slug);

/** SSG·라우트용 전체 카테고리 슬러그 (WP API 빌드 의존 제거) */
export const ALL_CATEGORY_SLUGS = [
  ...new Set([
    ...SHOWCASE_CATS.map(c => c.slug),
    ...ABOUT_ITEMS.map(c => c.slug),
    ...FAMILY_ITEMS.map(c => c.slug),
  ]),
];

export interface FeatureCta {
  label: string;
  slug: string;
}

export interface FeaturePillar {
  key: string;
  slug: string;
  emoji: string;
  title: string;
  subtitle: string;
  detail: string;
}

export type FeaturePanelKey = 'categories' | 'daily365' | 'memories' | 'pillars';

export interface FeaturePanel {
  key: FeaturePanelKey;
  statIndex: number;
  title: string;
  lead: string;
  philosophy: string;
  imageAlt: string;
  ctas?: FeatureCta[];
  pillars?: FeaturePillar[];
}

/** 통계 바 클릭 시 펼쳐지는 안내 패널 (nutrifarmer.kr 동일) */
export const FEATURE_PANELS: FeaturePanel[] = [
  {
    key: 'categories',
    statIndex: 0,
    title: '8가지 콘텐츠, 기록하는 삶',
    lead: '일상·가족·성장·수익까지 — 삶의 영역을 여덟 카테고리로 나누어 차곡차곡 쌓아 갑니다.',
    philosophy:
      '모든 글은 어느 한 주제에만 속하지 않지만, 기록을 찾고 이어 읽기 쉽도록 테마 8개 카테고리를 두었습니다. 카테고리를 누르면 그 영역의 최신 글로 바로 이어집니다.',
    imageAlt: '일상 기록과 카테고리',
  },
  {
    key: 'daily365',
    statIndex: 1,
    title: '365일, 매일의 기록',
    lead: '특별한 날만이 아니라, 평범한 하루도 내일의 추억이 됩니다.',
    philosophy:
      '짧은 메모, 사진 한 장, 오늘의 한 줄 — 작은 기록이 쌓여 가족과 나 자신에게 남기는 연간 일기가 됩니다. 이 블로그는 “완벽한 글”보다 “꾸준한 기록”을 추구합니다.',
    imageAlt: '매일의 기록',
    ctas: [{ label: '일상 기록 글 보기', slug: 'daily-life' }],
  },
  {
    key: 'memories',
    statIndex: 2,
    title: '가족·삶의 추억, 끝없이',
    lead: '손주의 웃음, 가족 식탁, 계절의 풍경 — 시간은 흘러도 기록은 남습니다.',
    philosophy:
      '사진과 글, 영상 링크를 함께 두어 “그때 그 순간”을 다시 만날 수 있게 합니다. ∞는 저장 용량이 아니라, 사랑하는 사람들과의 이야기가 끝없이 이어진다는 믿음입니다.',
    imageAlt: '가족과 삶의 추억',
    ctas: [
      { label: '가족·성장 기록 보기', slug: 'family-growth' },
      { label: '삶·사진 보기', slug: 'life-photos' },
    ],
  },
  {
    key: 'pillars',
    statIndex: 3,
    title: '네 기둥 — 일상 · 가족 · 성장 · 나눔',
    lead: '탁월한 찬사 블로그가 지향하는 네 가지 가치입니다.',
    philosophy:
      '일상은 소소함을, 가족은 온기를, 성장은 배움과 변화를, 나눔은 돌봄과 연결을 의미합니다. 네 기둥이 균형을 이룰 때 기록은 단순한 아카이브가 아니라 삶을 비추는 거울이 됩니다.',
    imageAlt: '일상·가족·성장·나눔',
    pillars: [
      {
        key: 'daily',
        slug: 'daily-life',
        emoji: '📔',
        title: '일상',
        subtitle: '매일의 작은 이야기',
        detail: '아침의 커피, 저녁의 노을 — 소소한 하루를 글과 사진으로 남깁니다.',
      },
      {
        key: 'family',
        slug: 'life-photos',
        emoji: '👨‍👩‍👧‍👦',
        title: '가족',
        subtitle: '함께하는 시간과 사랑',
        detail: '식탁, 여행, 기념일 — 가족과 함께한 순간을 사진과 글로 이어 갑니다.',
      },
      {
        key: 'growth',
        slug: 'family-growth',
        emoji: '🌱',
        title: '성장',
        subtitle: '배움·손주·나의 발전',
        detail: '자녀와 손주의 발자취, 나의 배움과 변화를 차곡차곡 기록합니다.',
      },
      {
        key: 'sharing',
        slug: 'fresh-news',
        emoji: '🤝',
        title: '나눔',
        subtitle: '이웃과 독자에게 전하는 글',
        detail: '주변 이야기와 전문 글쓰기로 독자와 이웃에게 따뜻한 연결을 전합니다.',
      },
    ],
  },
];
