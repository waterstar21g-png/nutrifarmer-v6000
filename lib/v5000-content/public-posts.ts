import { SHOWCASE_CATS, ABOUT_ITEMS, FAMILY_ITEMS, type CatItem } from '@/lib/site-data';
import type { PreviewPost } from '@/lib/home-posts';
import { firstImageUrlFromHtml } from '@/lib/write-featured-image';
import {
  getMediaMirrorMap,
  resolveMediaUrlSync,
  resolveMediaUrlWithMap,
  rewriteHtmlMediaUrlsWithMap,
} from './media-mirror';
import type { V5000PreviewListRow } from './preview-image';
import type { V5000PostRow } from './schema';

const ALL_CATS: CatItem[] = [...SHOWCASE_CATS, ...ABOUT_ITEMS, ...FAMILY_ITEMS];

export function getSiteCategory(slug: string): CatItem | null {
  return ALL_CATS.find(c => c.slug === slug) ?? null;
}

export function firstImageFromBody(html: string): string | null {
  const src = firstImageUrlFromHtml(html);
  return src ? resolveMediaUrlSync(src) : null;
}

function previewPostFromRow(
  row: V5000PostRow,
  cat: CatItem | null,
  imageUrl: string | null,
): PreviewPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt.replace(/<[^>]+>/g, '').trim(),
    imageUrl,
    categorySlug: row.categorySlug,
    categoryName: cat?.name ?? row.categorySlug,
    authorId: row.authorId,
    pid: row.id,
  };
}

/** 목록·검색 썸네일 — 미러 DB로 WP·프록시 URL을 CDN으로 일괄 치환 */
export async function rowsToPreviewPosts(
  rows: Array<V5000PreviewListRow | V5000PostRow>,
  cat?: CatItem | null,
): Promise<PreviewPost[]> {
  if (rows.length === 0) return [];
  const map = await getMediaMirrorMap();
  return rows.map(row => {
    const c = cat ?? getSiteCategory(row.categorySlug);
    const previewSrc = 'previewImageSrc' in row ? row.previewImageSrc : null;
    const rewritten = rewriteHtmlMediaUrlsWithMap(row.body, map);
    const src =
      previewSrc?.trim() ||
      firstImageUrlFromHtml(rewritten);
    const imageUrl = src ? resolveMediaUrlWithMap(src, map) : null;
    return previewPostFromRow(row, c, imageUrl);
  });
}

export function rowToSidebarPost(row: V5000PostRow) {
  return {
    id: row.id,
    slug: row.slug,
    title: { rendered: row.title },
  };
}
