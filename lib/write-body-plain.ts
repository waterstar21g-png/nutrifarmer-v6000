/** 본문 HTML → AI·비교용 순수 텍스트 */

import { bodyBlocksToPublishHtml } from '@/lib/write-body-blocks';

export function stripBodyPlain(html: string): string {
  if (!html) return '';
  let s = html;
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<\/p>\s*<p[^>]*>/gi, '\n\n');
  s = s.replace(/<[^>]+>/g, '');
  s = s.replace(/&nbsp;/g, ' ');
  s = s.replace(/&amp;/g, '&');
  s = s.replace(/&lt;/g, '<');
  s = s.replace(/&gt;/g, '>');
  s = s.replace(/&quot;/g, '"');
  return s.replace(/\n{3,}/g, '\n\n').trim();
}

/** AI·비교용 — 삭제선·차수 색상 제거 후 순수 텍스트 */
export function stripBodyForPublish(html: string): string {
  if (!html) return '';
  let s = html;
  s = s.replace(/<del[^>]*>[\s\S]*?<\/del>/gi, '');
  s = s.replace(/<span class="nf-rev-\d+">([\s\S]*?)<\/span>/gi, '$1');
  s = s.replace(/<br\s*\/?>/gi, '\n');
  const withBlocks = bodyBlocksToPublishHtml(s);
  return stripBodyPlain(withBlocks);
}

/** 게시·미리보기용 HTML — 이미지·줄바꿈 유지 */
export function bodyHtmlForPublish(html: string): string {
  if (!html) return '';
  let s = html;
  s = s.replace(/<del[^>]*>[\s\S]*?<\/del>/gi, '');
  s = s.replace(/<span class="nf-rev-\d+">([\s\S]*?)<\/span>/gi, '$1');
  s = s.replace(/<div class="nfw-body-img__bar">[\s\S]*?<\/div>/gi, '');
  s = s.replace(/<div class="nfw-body-block__bar">[\s\S]*?<\/div>/gi, '');
  s = s.replace(/<span class="nfw-body-img__resize"[^>]*>\s*<\/span>/gi, '');
  s = s.replace(/<span class="nfw-body-block__resize"[^>]*>\s*<\/span>/gi, '');
  s = s.replace(/<span class="nfw-body-img__drag"[^>]*>[\s\S]*?<\/span>/gi, '');
  s = s.replace(/<span class="nfw-body-block__drag"[^>]*>[\s\S]*?<\/span>/gi, '');
  s = bodyBlocksToPublishHtml(s);
  s = s.replace(/<br\s*\/?>/gi, '<br>');
  const text = stripBodyPlain(s);
  if (!text && !/<(img|iframe)\b/i.test(s) && !/nfw-pub-video/i.test(s)) return '';
  return s.trim();
}

/** 배포 미리보기 — 최종본만 (삭제·수정 표시 제외) */
export function bodyHtmlForPreview(html: string): string {
  const out = bodyHtmlForPublish(html);
  if (!out) return '';
  if (/<img\b/i.test(out) || /<br\b/i.test(out)) return out;
  return out
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}
