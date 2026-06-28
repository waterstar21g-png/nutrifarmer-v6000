import {
  getPreviewPostsBySlugs as fetchPreviewBySlugs,
  getLatestPreviewPosts as fetchLatest,
  searchPosts as fetchSearch,
} from '@/lib/site-content';

export interface PreviewPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  imageUrl: string | null;
  categorySlug: string;
  categoryName: string;
  /** V5000 게시글 — 단일글 URL disambiguation */
  pid?: number;
}

export async function getPreviewPostsBySlugs(
  slugs: string[],
  perPage = 8,
): Promise<Record<string, PreviewPost[]>> {
  return fetchPreviewBySlugs(slugs, perPage);
}

export async function getLatestPreviewPosts(perPage = 6): Promise<PreviewPost[]> {
  return fetchLatest(perPage);
}

export async function searchPreviewPosts(query: string, limit = 12): Promise<PreviewPost[]> {
  return fetchSearch(query, limit);
}

export async function getHeroPostsBySlugs(
  slugs: string[],
): Promise<Record<string, PreviewPost | null>> {
  const map = await getPreviewPostsBySlugs(slugs, 1);
  return Object.fromEntries(slugs.map(s => [s, map[s]?.[0] ?? null]));
}
