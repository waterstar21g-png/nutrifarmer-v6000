import {
  getCachedLatestPublished,
  getCachedPublishedByCategory,
  getCachedSearchPublished,
} from '@/lib/v5000-content/post-list-cache';
import { listPublishedPaginated, type V5000PostListRow } from '@/lib/v5000-content/posts';
import type { V5000PostRow } from '@/lib/v5000-content/schema';
import {
  getSiteCategory,
  rowToPreviewPost,
  previewImageUrl,
} from '@/lib/v5000-content/public-posts';
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

function rowToGallery(row: V5000PostListRow, categorySlug: string): GalleryItem {
  return {
    key: `post-${row.id}`,
    post: rowToSitePostCard(row),
    categorySlug,
    categoryName: categoryName(categorySlug),
    imageUrl: previewImageUrl(row),
    pid: row.id,
  };
}

export async function getSidebarPosts(categorySlug: string): Promise<SidebarPostItem[]> {
  const { data: rows } = await getCachedPublishedByCategory(categorySlug, 100);
  return rows.map(rowToSidebar);
}

export async function getCategoryGallery(
  categorySlug: string,
  page: number,
  perPage: number,
): Promise<{ items: GalleryItem[]; total: number; totalPages: number }> {
  const { rows, total, totalPages } = await listPublishedPaginated(categorySlug, page, perPage);
  return {
    items: rows.map(row => rowToGallery(row, categorySlug)),
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
      const { data: rows } = await getCachedPublishedByCategory(slug, perPage);
      const cat = getSiteCategory(slug);
      const previews = rows.map(row => rowToPreviewPost(row, cat));
      return [slug, previews] as const;
    }),
  );
  return Object.fromEntries(entries);
}

export async function getLatestPreviewPosts(perPage = 6): Promise<PreviewPost[]> {
  const { data: rows } = await getCachedLatestPublished(perPage);
  return rows.map(row => rowToPreviewPost(row));
}

export async function getLatestPreviewPostsCached(
  perPage = 6,
): Promise<{ posts: PreviewPost[]; stale: boolean }> {
  const { data: rows, stale } = await getCachedLatestPublished(perPage);
  return { posts: rows.map(row => rowToPreviewPost(row)), stale };
}

export async function getCategoryPreviewPosts(
  categorySlug: string,
  limit = 30,
): Promise<PreviewPost[]> {
  const { data: rows } = await getCachedPublishedByCategory(categorySlug, limit);
  const cat = getSiteCategory(categorySlug);
  return rows.map(row => rowToPreviewPost(row, cat));
}

export async function getCategoryPreviewPostsCached(
  categorySlug: string,
  limit = 30,
): Promise<{ posts: PreviewPost[]; stale: boolean }> {
  const { data: rows, stale } = await getCachedPublishedByCategory(categorySlug, limit);
  const cat = getSiteCategory(categorySlug);
  return { posts: rows.map(row => rowToPreviewPost(row, cat)), stale };
}

export async function searchPosts(query: string, limit = 12): Promise<PreviewPost[]> {
  const { data: rows } = await getCachedSearchPublished(query, limit);
  return rows.map(row => rowToPreviewPost(row));
}

export async function searchPostsCached(
  query: string,
  limit = 12,
): Promise<{ posts: PreviewPost[]; stale: boolean }> {
  const { data: rows, stale } = await getCachedSearchPublished(query, limit);
  return { posts: rows.map(row => rowToPreviewPost(row)), stale };
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
