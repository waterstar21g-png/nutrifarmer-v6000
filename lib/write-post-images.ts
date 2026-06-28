import type { PreviewImage } from '@/lib/write-types';

export interface ExtractedImage {
  url: string;
  alt: string;
}

/** HTML·마크다운 본문에서 이미지 URL 추출 */
export function extractImagesFromHtml(html: string): ExtractedImage[] {
  if (!html) return [];
  const out: ExtractedImage[] = [];
  const seen = new Set<string>();

  const push = (url: string, alt: string) => {
    const u = url.trim().replace(/&amp;/g, '&');
    if (!u || seen.has(u)) return;
    seen.add(u);
    out.push({ url: u, alt: (alt || '이미지').slice(0, 100) });
  };

  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0];
    const src =
      tag.match(/\bsrc=["']([^"']+)["']/i)?.[1] ??
      tag.match(/\bdata-src=["']([^"']+)["']/i)?.[1] ??
      tag.match(/\bsrcset=["']([^"'\s,]+)/i)?.[1] ??
      '';
    const alt = tag.match(/\balt=["']([^"']*)["']/i)?.[1] ?? '';
    push(src, alt);
  }
  for (const m of html.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)) {
    push(m[2], m[1]);
  }

  return out;
}

export function toPreviewImages(images: ExtractedImage[]): PreviewImage[] {
  return images.map((img, i) => ({
    id: `load-img-${i}-${Date.now()}`,
    url: img.url,
    alt: img.alt,
    keyword: img.alt,
  }));
}
