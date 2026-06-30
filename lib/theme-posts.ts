import { listPublishedByCategory } from '@/lib/v5000-content/posts';
import { getSiteCategory, rowToPreviewPost } from '@/lib/v5000-content/public-posts';
import { rewriteHtmlMediaUrls } from '@/lib/v5000-content/media-mirror';
import { getThemeSlugs } from '@/lib/theme-map';
import type { PreviewPost } from '@/lib/home-posts';

export async function listPostsByTheme(key: string, perSlug = 15): Promise<PreviewPost[]> {
  const slugs = getThemeSlugs(key);
  const batches = await Promise.all(
    slugs.map(slug => listPublishedByCategory(slug, perSlug).catch(() => [])),
  );
  const merged: PreviewPost[] = [];
  for (let i = 0; i < slugs.length; i++) {
    const cat = getSiteCategory(slugs[i]);
    for (const row of batches[i]) {
      const body = await rewriteHtmlMediaUrls(row.body);
      merged.push(rowToPreviewPost({ ...row, body }, cat));
    }
  }
  return merged.sort((a, b) => b.id - a.id);
}
