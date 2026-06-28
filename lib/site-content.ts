import {
  listLatestPublished,
  listPublishedPaginated,
  listPublishedByCategory,
  searchPublishedPosts,
} from '@/lib/v5000-content/posts';
import type { V5000PostRow } from '@/lib/v5000-content/schema';
import {
  getSiteCategory,
  rowToPreviewPost,
  firstImageFromBody,
} from '@/lib/v5000-content/public-posts';
import { rewriteHtmlMediaUrls } from '@/lib/v5000-content/media-mirror';
import type { PreviewPost } from '@/lib/home-posts';
import type { SitePostCard } from '@/lib/site-post-card';

export { postHref } from '@/lib/post-href';
export type { SitePostCard } from '@/lib/site-post-card';

export interface SidebarPostItem {
  key: string;
  id: number;
  slug: string;
  title: { rendered: string };
  pid: number;
}

export interface GalleryItem {
  key: string;
  post: SitePostCard;
  categorySlug: string;
  categoryName: string;
  imageUrl: string | null;
  pid: number;
}

function rowToSitePostCard(row: V5000PostRow): SitePostCard {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt.replace(/<[^>]+>/g, '').trim(),
    date: (row.publishedAt ?? row.updatedAt).toISOString(),
  };
}

function categoryName(slug: string): string {
  return getSiteCategory(slug)?.name ?? slug;
}

function rowToSidebar(row: V5000PostRow): SidebarPostItem {
  return {
    key: `post-${row.id}`,
    id: row.id,
    slug: row.slug,
    title: { rendered: row.title },
    pid: row.id,
  };
}

async function rowToGallery(row: V5000PostRow, categorySlug: string): Promise<GalleryItem> {
  const body = await rewriteHtmlMediaUrls(row.body);
  return {
    key: `post-${row.id}`,
    post: rowToSitePostCard(row),
    categorySlug,
    categoryName: categoryName(categorySlug),
    imageUrl: firstImageFromBody(body),
    pid: row.id,
  };
}

export async function getSidebarPosts(categorySlug: string): Promise<SidebarPostItem[]> {
  const rows = await listPublishedByCategory(categorySlug, 100).catch(() => []);
  return rows.map(rowToSidebar);
}

export async function getCategoryGallery(
  categorySlug: string,
  page: number,
  perPage: number,
): Promise<{ items: GalleryItem[]; total: number; totalPages: number }> {
  const { rows, total, totalPages } = await listPublishedPaginated(categorySlug, page, perPage).catch(
    () => ({ rows: [] as V5000PostRow[], total: 0, totalPages: 0 }),
  );
  return {
    items: await Promise.all(rows.map(row => rowToGallery(row, categorySlug))),
    total,
    totalPages,
  };
}

export async function getPreviewPostsBySlugs(
  slugs: string[],
  perPage = 8,
): Promise<Record<string, PreviewPost[]>> {
  const unique = [...new Set(slugs)];
  const entries = await Promise.all(
    unique.map(async slug => {
      const rows = await listPublishedByCategory(slug, perPage).catch(() => []);
      const cat = getSiteCategory(slug);
      const previews = await Promise.all(
        rows.map(async row => {
          const body = await rewriteHtmlMediaUrls(row.body);
          return rowToPreviewPost({ ...row, body }, cat);
        }),
      );
      return [slug, previews] as const;
    }),
  );
  return Object.fromEntries(entries);
}

export async function getLatestPreviewPosts(perPage = 6): Promise<PreviewPost[]> {
  const rows = await listLatestPublished(Math.max(perPage, 20)).catch(() => []);
  return rows.slice(0, perPage).map(row => rowToPreviewPost(row));
}

export async function searchPosts(query: string, limit = 12): Promise<PreviewPost[]> {
  const rows = await searchPublishedPosts(query, limit).catch(() => []);
  return rows.map(row => rowToPreviewPost(row));
}

export function galleryItemToGrid(item: GalleryItem) {
  return {
    key: item.key,
    post: item.post,
    categorySlug: item.categorySlug,
    categoryName: item.categoryName,
    imageUrl: item.imageUrl,
    pid: item.pid,
  };
}

export function previewToGridItem(preview: PreviewPost) {
  return {
    key: `post-${preview.id}`,
    post: {
      id: preview.id,
      slug: preview.slug,
      title: preview.title,
      excerpt: preview.excerpt,
      date: new Date().toISOString(),
    } satisfies SitePostCard,
    categorySlug: preview.categorySlug,
    categoryName: preview.categoryName,
    imageUrl: preview.imageUrl,
    pid: preview.pid ?? preview.id,
  };
}
