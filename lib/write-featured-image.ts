import { bodyHtmlForPublish } from '@/lib/write-body-plain';
import { extractImagesFromHtml } from '@/lib/write-post-images';

export function firstImageUrlFromHtml(html: string): string | null {
  const imgs = extractImagesFromHtml(html);
  return imgs[0]?.url ?? null;
}

/** 게시·미리보기 — 본문 첫 이미지, 없으면 미리보기 그리드 첫 장 */
export function resolveFeaturedImageUrl(
  bodyHtml: string,
  previewUrls?: string[],
): string | null {
  const published = bodyHtmlForPublish(bodyHtml);
  const fromBody = firstImageUrlFromHtml(published);
  if (fromBody) return fromBody;
  const fallback = previewUrls?.find(u => u?.trim());
  return fallback?.trim() ?? null;
}

export function prependFeaturedImageIfMissing(
  bodyHtml: string,
  imageUrl: string,
  alt = '대표 이미지',
): string {
  const published = bodyHtmlForPublish(bodyHtml);
  if (firstImageUrlFromHtml(published)) return published;
  const safeAlt = alt.slice(0, 100).replace(/"/g, '&quot;');
  const img = `<img src="${imageUrl.replace(/"/g, '&quot;')}" alt="${safeAlt}" style="width:320px;max-width:100%;height:auto;border-radius:6px;margin:0.5rem 0;" />`;
  return published.trim() ? `${img}\n${published}` : img;
}
