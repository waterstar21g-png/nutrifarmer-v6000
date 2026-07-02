import { listPublishedByCategory } from '@/lib/v5000-content/posts';
import { rowsToPreviewPosts } from '@/lib/v5000-content/public-posts';
import { getThemeSlugs } from '@/lib/theme-map';
import type { PreviewPost } from '@/lib/home-posts';

export async function listPostsByTheme(
  key: string,
  perSlug = 15,
): Promise<{ posts: PreviewPost[]; loadFailed: boolean }> {
  const slugs = getThemeSlugs(key);
  let loadFailed = false;
  const batches = await Promise.all(
    slugs.map(async slug => {
      try {
        return await listPublishedByCategory(slug, perSlug);
      } catch (err) {
        console.error('[v6000] theme posts fetch failed:', err);
        loadFailed = true;
        return [];
      }
    }),
  );
  const mergedRows = batches.flat();
  const posts = await rowsToPreviewPosts(mergedRows);
  return { posts: posts.sort((a, b) => b.id - a.id), loadFailed };
}
