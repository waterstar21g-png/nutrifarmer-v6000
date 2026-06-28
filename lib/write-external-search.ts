/** 외부 검색 — 그리드 입력에서 검색어 추출 (URL 칸 → 이미지설명 순) */

export function pickExternalSearchQuery(...fields: string[]): string | null {
  for (const raw of fields) {
    const t = raw.trim();
    if (!t) continue;
    if (/^https?:\/\//i.test(t)) continue;
    return t;
  }
  return null;
}

export function buildGoogleImageSearchUrl(query: string): string {
  return `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;
}

export function buildGoogleWebSearchUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

export function buildYouTubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}
