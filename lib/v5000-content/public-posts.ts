import { SHOWCASE_CATS, ABOUT_ITEMS, FAMILY_ITEMS, type CatItem } from '@/lib/site-data';
import type { PreviewPost } from '@/lib/home-posts';
import { firstImageUrlFromHtml } from '@/lib/write-featured-image';
import { resolveMediaUrlSync } from './media-mirror';
import type { V5000PostRow } from './schema';

const ALL_CATS: CatItem[] = [...SHOWCASE_CATS, ...ABOUT_ITEMS, ...FAMILY_ITEMS];

export function getSiteCategory(slug: string): CatItem | null {
  return ALL_CATS.find(c => c.slug === slug) ?? null;
}

export function firstImageFromBody(html: string): string | null {
  const src = firstImageUrlFromHtml(html);
  return src ? resolveMediaUrlSync(src) : null;
}

export function rowToPreviewPost(row: V5000PostRow, cat?: CatItem | null): PreviewPost {
  const c = cat ?? getSiteCategory(row.categorySlug);
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt.replace(/<[^>]+>/g, '').trim(),
    imageUrl: firstImageFromBody(row.body),
    categorySlug: row.categorySlug,
    categoryName: c?.name ?? row.categorySlug,
    pid: row.id,
  };
}

export function rowToSidebarPost(row: V5000PostRow) {
  return {
    id: row.id,
    slug: row.slug,
    title: { rendered: row.title },
  };
}
