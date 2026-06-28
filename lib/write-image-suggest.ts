export interface SuggestedImage {
  id: string;
  url: string;
  alt: string;
  keyword: string;
}

const FALLBACK_KEYWORDS = [
  'nature landscape',
  'family daily life',
  'sunset sky',
  'autumn leaves',
];

const WIKI_UA = 'nutrifarmer-v5000/1.0 (blog image suggest; contact@nutrifarmer.kr)';

/** OpenAI 없을 때 본문·제목에서 검색어 추출 */
export function extractLocalKeywords(title: string, excerpt: string, body: string): string[] {
  const raw = [title, excerpt, body].filter(Boolean).join(' ');
  const cleaned = raw
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length >= 2);

  const unique: string[] = [];
  for (const w of cleaned) {
    if (!unique.includes(w)) unique.push(w);
    if (unique.length >= 4) break;
  }

  const base = unique.length ? unique : [...FALLBACK_KEYWORDS];
  while (base.length < 4) {
    base.push(FALLBACK_KEYWORDS[base.length % FALLBACK_KEYWORDS.length]);
  }
  return base.slice(0, 4);
}

/** Wikimedia Commons 검색 (서버·클라이언트 공용) */
export async function fetchWikimediaImage(keyword: string): Promise<{ url: string; alt: string } | null> {
  const queries = [
    `filetype:bitmap ${keyword}`,
    keyword,
    `incategory:Featured_pictures_on_Wikimedia_Commons ${keyword}`,
  ];

  for (const q of queries) {
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      origin: '*',
      generator: 'search',
      gsrsearch: q,
      gsrnamespace: '6',
      gsrlimit: '8',
      prop: 'imageinfo',
      iiprop: 'url|mime|extmetadata',
      iiurlwidth: '640',
    });

    try {
      const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
        cache: 'no-store',
        headers: { 'User-Agent': WIKI_UA },
      });
      if (!res.ok) continue;

      const data = (await res.json()) as {
        query?: {
          pages?: Record<
            string,
            {
              title?: string;
              imageinfo?: Array<{
                url?: string;
                thumburl?: string;
                mime?: string;
                extmetadata?: { ImageDescription?: { value?: string } };
              }>;
            }
          >;
        };
      };

      const pages = Object.values(data.query?.pages ?? {});
      for (const page of pages) {
        const info = page.imageinfo?.[0];
        const mime = info?.mime ?? '';
        if (!info?.url || !/^image\/(jpeg|png|webp|gif)$/i.test(mime)) continue;
        const desc = info.extmetadata?.ImageDescription?.value?.replace(/<[^>]+>/g, '').trim();
        return {
          url: info.thumburl || info.url,
          alt: (desc || page.title?.replace(/^File:/, '') || keyword).slice(0, 100),
        };
      }
    } catch {
      /* try next query */
    }
  }
  return null;
}

export async function collectSuggestedImages(keywords: string[]): Promise<SuggestedImage[]> {
  const images: SuggestedImage[] = [];
  const seen = new Set<string>();
  const pool = [...keywords, ...FALLBACK_KEYWORDS];

  for (const keyword of pool) {
    const hit = await fetchWikimediaImage(keyword);
    if (!hit || seen.has(hit.url)) continue;
    seen.add(hit.url);
    images.push({
      id: `suggest-${images.length}-${Date.now()}`,
      url: hit.url,
      alt: hit.alt,
      keyword,
    });
    if (images.length >= 4) break;
  }

  return images;
}

export async function fetchSuggestedImages(payload: {
  title: string;
  excerpt: string;
  body: string;
}): Promise<SuggestedImage[]> {
  let data: { ok?: boolean; images?: SuggestedImage[]; message?: string; code?: string };
  let r: Response;

  try {
    r = await fetch('/api/v5000/ai/suggest-images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    });
    data = (await r.json()) as typeof data;
  } catch {
    throw new Error('서버에 연결하지 못했습니다.');
  }

  if (r.status === 401) {
    throw new Error('LOGIN_REQUIRED');
  }
  if (!r.ok || !data.ok || !Array.isArray(data.images)) {
    throw new Error(data.message ?? `HTTP ${r.status}`);
  }
  return data.images;
}
