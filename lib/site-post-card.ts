/** 갤러리·카드 UI용 게시글 최소 필드 (Postgres v5000_posts) */
export interface SitePostCard {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
}
