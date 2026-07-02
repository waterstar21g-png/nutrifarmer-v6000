import { unstable_cache } from 'next/cache';
import { getDb, isDatabaseConfigured } from '@/lib/v5000-auth/db';
import { v5000MediaMirror } from './schema';

const WP_UPLOADS_RE = /\/wp-content\/uploads\/(.+)$/i;

/** V5000·마이그레이션 스크립트와 동일한 기본 CDN */
export const DEFAULT_CDN_URL = 'https://media.nutrifarmer.kr';

export function mediaCdnBase(): string {
  return process.env.NEXT_PUBLIC_CDN_URL?.trim().replace(/\/$/, '') || DEFAULT_CDN_URL;
}

/** URL 정규화 — 쿼리·해시 제거 */
export function normalizeMediaUrl(url: string): string {
  if (!url?.trim()) return '';
  try {
    const u = new URL(url.trim());
    u.hash = '';
    u.search = '';
    return u.href;
  } catch {
    return url.trim();
  }
}

/** WP uploads 경로 → R2 object key (uploads/YYYY/MM/file.jpg) */
export function wpUrlToR2Key(wpUrl: string): string | null {
  const m = wpUrl.match(WP_UPLOADS_RE);
  if (!m) return null;
  return `uploads/${decodeURIComponent(m[1])}`;
}

/** CDN 베이스 + uploads 상대경로 (DB 없을 때 폴백) */
export function cdnUrlFromWp(wpUrl: string): string | null {
  const key = wpUrlToR2Key(wpUrl);
  if (!key) return null;
  return `${mediaCdnBase()}/${key}`;
}

/** unstable_cache는 Map 직렬화 불가 — plain record 사용 */
type MirrorRecord = Record<string, string>;

async function loadMirrorMap(): Promise<MirrorRecord> {
  if (!isDatabaseConfigured()) return {};
  try {
    const db = getDb();
    const rows = await db.select({
      wpUrl: v5000MediaMirror.wpUrl,
      publicUrl: v5000MediaMirror.publicUrl,
    }).from(v5000MediaMirror);
    const map: MirrorRecord = {};
    for (const row of rows) {
      map[normalizeMediaUrl(row.wpUrl)] = row.publicUrl;
    }
    return map;
  } catch {
    return {};
  }
}

export const getMediaMirrorMap = unstable_cache(
  loadMirrorMap,
  ['v5000-media-mirror-v1'],
  { revalidate: 3600, tags: ['media-mirror'] },
);

/** 단일 URL → R2/CDN (없으면 CDN 경로 추론 → 원본) */
export async function resolveMediaUrl(source: string): Promise<string> {
  if (!source?.trim()) return '';
  const map = await getMediaMirrorMap();
  return resolveMediaUrlWithMap(source, map);
}

/** 미러 맵 기반 URL 해석 — 목록 썸네일 배치 처리용 */
export function resolveMediaUrlWithMap(source: string, map: MirrorRecord): string {
  if (!source?.trim()) return '';
  const trimmed = source.trim();
  const norm = normalizeMediaUrl(trimmed.startsWith('/') ? `https://local${trimmed}` : trimmed);
  const hit = map[norm];
  if (hit) return hit;

  const cdn = mediaCdnBase();
  const apiKey =
    trimmed.match(/^\/api\/v5000\/files\/(.+)$/i)?.[1] ??
    norm.match(/\/api\/v5000\/files\/(.+)$/i)?.[1];
  if (apiKey) {
    return `${cdn}/${decodeURIComponent(apiKey)}`;
  }

  if (trimmed.startsWith('/')) return trimmed;

  return cdnUrlFromWp(norm) ?? source;
}

/** V5000 파일 프록시·WP uploads → CDN (동기 폴백) */
export function resolveMediaUrlSync(source: string): string {
  return resolveMediaUrlWithMap(source, {});
}

const WP_UPLOADS_HTML_RE = /https?:\/\/[^"'\s>]+\/wp-content\/uploads\/[^"'\s>)]+/gi;
const API_FILES_HTML_RE = /(?:https?:\/\/[^"'\s>]+)?\/api\/v5000\/files\/[^"'\s>)]+/gi;

function rewriteHtmlMediaUrlsWithMap(html: string, map: MirrorRecord): string {
  if (!html) return html;
  let out = html;
  if (out.includes('wp-content/uploads')) {
    out = out.replace(WP_UPLOADS_HTML_RE, match => {
      const norm = normalizeMediaUrl(match);
      return map[norm] ?? cdnUrlFromWp(norm) ?? match;
    });
  }
  if (out.includes('/api/v5000/files/')) {
    out = out.replace(API_FILES_HTML_RE, match => resolveMediaUrlWithMap(match, map));
  }
  return out;
}

/** HTML 본문 내 WP·프록시 이미지 URL 일괄 치환 */
export async function rewriteHtmlMediaUrls(html: string): Promise<string> {
  if (!html?.includes('wp-content/uploads') && !html?.includes('/api/v5000/files/')) {
    return html;
  }
  const map = await getMediaMirrorMap();
  return rewriteHtmlMediaUrlsWithMap(html, map);
}

export { rewriteHtmlMediaUrlsWithMap };

/** 여러 URL 한 번에 해석 */
export async function resolveMediaUrls(sources: string[]): Promise<Map<string, string>> {
  const map = await getMediaMirrorMap();
  const out = new Map<string, string>();
  for (const src of sources) {
    if (!src) continue;
    out.set(src, resolveMediaUrlWithMap(src, map));
  }
  return out;
}
