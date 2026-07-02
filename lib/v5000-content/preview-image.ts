import { sql } from 'drizzle-orm';
import { v5000Posts } from './schema';

const IMG_SRC_RE = /<img[^>]+src=["']([^"']+)["']/i;
const IMG_DATA_SRC_RE = /<img[^>]+data-src=["']([^"']+)["']/i;
const MD_IMG_RE = /!\[[^\]]*\]\(([^)]+)\)/i;

/** HTML·마크다운 본문에서 첫 이미지 URL (Node 폴백) */
export function extractPreviewImageSrc(html: string): string | null {
  if (!html?.trim()) return null;
  for (const re of [IMG_SRC_RE, IMG_DATA_SRC_RE, MD_IMG_RE]) {
    const m = html.match(re);
    const src = m?.[1]?.trim().replace(/&amp;/g, '&');
    if (src) return src;
  }
  return null;
}

/** 목록 API용 — data: URL은 프록시 경로로 (RSC 페이로드·모바일 렌더 회피) */
export function previewImageUrlForList(
  postId: number,
  resolved: string | null,
): string | null {
  if (!resolved) return null;
  if (resolved.startsWith('data:') && resolved.length > 2048) {
    return `/api/v5000/posts/${postId}/preview-image`;
  }
  return resolved;
}

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
