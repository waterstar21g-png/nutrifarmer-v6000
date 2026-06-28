import { unstable_cache } from 'next/cache';
import { getDb, isDatabaseConfigured } from '@/lib/v5000-auth/db';
import { v5000MediaMirror } from './schema';

const WP_UPLOADS_RE = /\/wp-content\/uploads\/(.+)$/i;

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
  const cdn = process.env.NEXT_PUBLIC_CDN_URL?.trim().replace(/\/$/, '');
  if (!key || !cdn) return null;
  return `${cdn}/${key}`;
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
  const norm = normalizeMediaUrl(source);
  const map = await getMediaMirrorMap();
  const hit = map[norm];
  if (hit) return hit;
  return cdnUrlFromWp(norm) ?? source;
}

/** V5000 파일 프록시·WP uploads → CDN (동기 폴백) */
export function resolveMediaUrlSync(source: string): string {
  if (!source?.trim()) return '';
  const trimmed = source.trim();
  const norm = normalizeMediaUrl(trimmed.startsWith('/') ? `https://local${trimmed}` : trimmed);
  const cdn = process.env.NEXT_PUBLIC_CDN_URL?.trim().replace(/\/$/, '');

  const apiKey =
    trimmed.match(/^\/api\/v5000\/files\/(.+)$/i)?.[1] ??
    norm.match(/\/api\/v5000\/files\/(.+)$/i)?.[1];
  if (apiKey && cdn) {
    return `${cdn}/${decodeURIComponent(apiKey)}`;
  }

  if (trimmed.startsWith('/')) return trimmed;

  return cdnUrlFromWp(norm) ?? source;
}

/** HTML 본문 내 WP 이미지 URL 일괄 치환 */
export async function rewriteHtmlMediaUrls(html: string): Promise<string> {
  if (!html?.includes('wp-content/uploads')) return html;
  const map = await getMediaMirrorMap();
  return html.replace(
    /https?:\/\/[^"'\s>]+\/wp-content\/uploads\/[^"'\s>)]+/gi,
    match => {
      const norm = normalizeMediaUrl(match);
      return map[norm] ?? cdnUrlFromWp(norm) ?? match;
    },
  );
}

/** 여러 URL 한 번에 해석 */
export async function resolveMediaUrls(sources: string[]): Promise<Map<string, string>> {
  const map = await getMediaMirrorMap();
  const out = new Map<string, string>();
  for (const src of sources) {
    if (!src) continue;
    const norm = normalizeMediaUrl(src);
    out.set(src, map[norm] ?? cdnUrlFromWp(norm) ?? src);
  }
  return out;
}
