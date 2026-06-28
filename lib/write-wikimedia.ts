/** Wikimedia Commons — 키워드 기반 무료 이미지 검색 */

export interface WikimediaHit {
  url: string;
  title: string;
}

export async function searchWikimediaImages(keyword: string, limit = 2): Promise<WikimediaHit[]> {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'search',
    gsrsearch: `filetype:bitmap ${keyword}`,
    gsrlimit: String(Math.min(limit + 2, 8)),
    prop: 'imageinfo',
    iiprop: 'url',
    iiurlwidth: '960',
  });

  const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
    cache: 'no-store',
  });
  if (!res.ok) return [];

  const data = (await res.json()) as {
    query?: { pages?: Record<string, { title?: string; imageinfo?: Array<{ url?: string }> }> };
  };

  const hits: WikimediaHit[] = [];
  const pages = data.query?.pages ?? {};
  for (const page of Object.values(pages)) {
    const url = page.imageinfo?.[0]?.url;
    if (!url || !/\.(jpe?g|png|webp|gif)(\?|$)/i.test(url)) continue;
    hits.push({ url, title: page.title?.replace(/^File:/, '') ?? keyword });
    if (hits.length >= limit) break;
  }
  return hits;
}
