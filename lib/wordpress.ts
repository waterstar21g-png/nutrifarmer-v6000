/**
 * WordPress REST — **마이그레이션 스크립트 전용** (런타임 app/ 에서 import 금지)
 * @see scripts/v5000-migrate-from-wp.mjs · scripts/migrate-wp-images-to-r2.mjs
 */

import { resolveMediaUrlSync } from '@/lib/v5000-content/media-mirror';

const API = process.env.WP_API_URL?.trim() || 'https://www.nutrifarmer.kr/wp-json';

export interface WPPost {
  id: number;
  slug: string;
  status: string;
  date: string;
  modified: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  categories: number[];
  tags: number[];
  featured_media: number;
  _embedded?: {
    'wp:featuredmedia'?: Array<{ source_url: string; alt_text: string }>;
    'wp:term'?: Array<Array<WPCategory>>;
  };
}

export interface WPCategory {
  id: number;
  slug: string;
  name: string;
  count: number;
  parent: number;
  description: string;
}

async function wpFetch<T>(path: string, revalidate = 60): Promise<T> {
  const url = `${API}${path}`;
  const res = await fetch(url, { next: { revalidate } });
  if (!res.ok) throw new Error(`WP API ${res.status}: ${url}`);
  return res.json() as Promise<T>;
}

async function wpFetchPaged<T>(
  path: string, revalidate = 60
): Promise<{ data: T; total: number; totalPages: number }> {
  const url = `${API}${path}`;
  const res = await fetch(url, { next: { revalidate } });
  if (!res.ok) throw new Error(`WP API ${res.status}: ${url}`);
  return {
    data: await res.json() as T,
    total: parseInt(res.headers.get('X-WP-Total') ?? '0', 10),
    totalPages: parseInt(res.headers.get('X-WP-TotalPages') ?? '0', 10),
  };
}

export async function getPosts(opts: {
  page?: number; perPage?: number; categoryId?: number;
  search?: string; embed?: boolean;
} = {}): Promise<{ posts: WPPost[]; total: number; totalPages: number }> {
  const { page = 1, perPage = 12, categoryId, search, embed = true } = opts;
  const p = new URLSearchParams({ page: String(page), per_page: String(perPage), status: 'publish', orderby: 'date', order: 'desc' });
  if (embed) p.set('_embed', '1');
  if (categoryId) p.set('categories', String(categoryId));
  if (search) p.set('search', search);
  const r = await wpFetchPaged<WPPost[]>(`/wp/v2/posts?${p}`, 60);
  return { posts: r.data, total: r.total, totalPages: r.totalPages };
}

export async function getPostBySlug(slug: string): Promise<WPPost | null> {
  const posts = await wpFetch<WPPost[]>(`/wp/v2/posts?slug=${encodeURIComponent(slug)}&_embed=1&status=publish`, 3600);
  return posts[0] ?? null;
}

export async function getCategories(onlyWithPosts = true): Promise<WPCategory[]> {
  return wpFetch<WPCategory[]>(`/wp/v2/categories?per_page=50&hide_empty=${onlyWithPosts ? 1 : 0}`, 3600);
}

export async function getCategoryBySlug(slug: string): Promise<WPCategory | null> {
  const cats = await wpFetch<WPCategory[]>(`/wp/v2/categories?slug=${encodeURIComponent(slug)}&hide_empty=0`, 3600);
  return cats[0] ?? null;
}

export async function getCategoryById(id: number): Promise<WPCategory | null> {
  try { return await wpFetch<WPCategory>(`/wp/v2/categories/${id}`, 3600); }
  catch { return null; }
}

export function getFeaturedImageUrl(post: WPPost): string {
  const src = post._embedded?.['wp:featuredmedia']?.[0]?.source_url ?? '';
  return resolveMediaUrlSync(src);
}

export function getPostCategories(post: WPPost): WPCategory[] {
  return (post._embedded?.['wp:term']?.[0] ?? []) as WPCategory[];
}

export async function getAllPostSlugs(): Promise<Array<{ slug: string; categorySlug: string }>> {
  const result: Array<{ slug: string; categorySlug: string }> = [];
  let page = 1;
  while (true) {
    const { posts, totalPages } = await getPosts({ page, perPage: 100, embed: false });
    for (const post of posts) {
      const catId = post.categories[0];
      const cat = catId ? await getCategoryById(catId) : null;
      result.push({ slug: post.slug, categorySlug: cat?.slug ?? 'uncategorized' });
    }
    if (page >= totalPages) break;
    page++;
  }
  return result;
}
