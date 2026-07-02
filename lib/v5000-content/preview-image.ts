import { sql } from 'drizzle-orm';
import { v5000Posts } from './schema';

/** 목록 썸네일 — 전체 본문에서 첫 이미지 URL만 추출 (base64·대용량 본문 대응) */
export const previewImageSrcSql = sql<string | null>`
  COALESCE(
    (regexp_match(${v5000Posts.body}, '<img[^>]+src=["'']([^"'']+)["'']', 'i'))[1],
    (regexp_match(${v5000Posts.body}, '<img[^>]+data-src=["'']([^"'']+)["'']', 'i'))[1],
    (regexp_match(${v5000Posts.body}, '!\[[^\]]*\]\(([^)]+)\)', 'i'))[1]
  )
`.as('previewImageSrc');

export type V5000PreviewListRow = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  status: string;
  authorId: number;
  categorySlug: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  body: string;
  previewImageSrc: string | null;
};
