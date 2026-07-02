import { classifyDbError, postsUnavailableMessage } from '@/lib/v5000-content/db-error';
import type { PreviewPost } from '@/lib/home-posts';
import { getCachedPublishedByCategory } from '@/lib/v5000-content/post-list-cache';
import { getSiteCategory, rowToPreviewPost } from '@/lib/v5000-content/public-posts';
import { getThemeSlugs } from '@/lib/theme-map';

export async function listPostsByTheme(
  key: string,
  perSlug = 15,
): Promise<{ posts: PreviewPost[]; loadFailed: boolean; stale: boolean; notice?: string }> {
  const slugs = getThemeSlugs(key);
  let loadFailed = false;
  let stale = false;
  let lastError: unknown;
  const batches = await Promise.all(
    slugs.map(async slug => {
      try {
        const result = await getCachedPublishedByCategory(slug, perSlug);
        if (result.stale) stale = true;
        return result.data;
      } catch (err) {
        console.error('[v6000] theme posts fetch failed:', err);
        loadFailed = true;
        lastError = err;
        return [];
      }
    }),
  );
  const merged: PreviewPost[] = [];
  for (let i = 0; i < slugs.length; i++) {
    const cat = getSiteCategory(slugs[i]);
    for (const row of batches[i]) {
      merged.push(rowToPreviewPost(row, cat));
    }
  }
  const posts = merged.sort((a, b) => b.id - a.id);
  if (posts.length > 0 && loadFailed) {
    loadFailed = false;
    stale = true;
  }
  return {
    posts,
    loadFailed,
    stale,
    notice: loadFailed && lastError ? postsUnavailableMessage(classifyDbError(lastError)) : undefined,
  };
}
