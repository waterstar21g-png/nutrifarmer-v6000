import { buildBodyImageFigureHtml } from '@/lib/write-body-images';
import { normalizeBodyForEditor } from '@/lib/write-body-blocks';
import { extractImagesFromHtml } from '@/lib/write-post-images';

export type BodyInsertPosition = 'inline' | 'top' | 'bottom';

export function countBodyImages(html: string): number {
  return extractImagesFromHtml(html).length;
}

export function stripVideoBlocks(body: string): string {
  return body
    .replace(/<figure[^>]*data-nfw-embed=["']video["'][^>]*>[\s\S]*?<\/figure>/gi, '')
    .replace(/\n?\[동영상:[^\]]*\]\([^)]+\)\n?/g, '\n')
    .trim();
}

export function stripFileBlocks(body: string): string {
  return body
    .replace(/<figure[^>]*data-nfw-embed=["']file["'][^>]*>[\s\S]*?<\/figure>/gi, '')
    .replace(/\n?\[📎[^\]]*\]\([^)]+\)\n?/g, '\n')
    .trim();
}

export function stripMarkdownImages(body: string): string {
  return body.replace(/\n?!\[[^\]]*\]\([^)]+\)\n?/g, '\n').trim();
}

export function stripBodyFigures(body: string): string {
  return body
    .replace(/<figure\b[^>]*>[\s\S]*?<\/figure>/gi, '')
    .replace(/<div\b[^>]*class="[^"]*nfw-body-img[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** 덮어쓰기: 본문에서 해당 유형·위치 콘텐츠 제거 후 삽입 */
export function prepareBodyForMaterialInsert(
  body: string,
  position: BodyInsertPosition,
  kind: 'image' | 'video' | 'file' | 'text',
): string {
  let next = body;
  if (kind === 'video') next = stripVideoBlocks(next);
  if (kind === 'file') next = stripFileBlocks(next);
  if (kind === 'image') {
    if (position === 'top') {
      next = next.replace(/^(\s*<figure\b[\s\S]*?<\/figure>\s*)+/i, '');
      next = next.replace(/^(\s*<div\b[^>]*nfw-body-img[\s\S]*?<\/div>\s*)+/i, '');
    } else if (position === 'bottom') {
      next = next.replace(/(\s*<figure\b[\s\S]*?<\/figure>\s*)+$/i, '');
      next = next.replace(/(\s*<div\b[^>]*nfw-body-img[\s\S]*?<\/div>\s*)+$/i, '');
    } else {
      next = stripBodyFigures(next);
    }
    next = stripMarkdownImages(next);
  }
  return normalizeBodyForEditor(next);
}

export function mergeBodyHtml(
  body: string,
  html: string,
  position: BodyInsertPosition,
): string {
  const chunk = html.trim();
  if (!chunk) return body;
  if (position === 'top') return normalizeBodyForEditor(`${chunk}${body ? `\n${body}` : ''}`);
  if (position === 'bottom') return normalizeBodyForEditor(`${body}${body ? '\n' : ''}${chunk}`);
  return normalizeBodyForEditor(`${body}${body ? '\n' : ''}${chunk}`);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 일반명령문 추가 — 차수 색상 단락 */
export function formatAiAppendChunk(plain: string, revision: number): string {
  const revClass = `nf-rev-${Math.min(Math.max(revision, 1), 5)}`;
  const inner = escapeHtml(plain.trim()).replace(/\n/g, '<br>');
  return `<p class="${revClass}">${inner}</p>`;
}

/** contenteditable — 커서(inline) 또는 상·하 위치에 HTML 추가 */
export function insertHtmlAtDom(
  el: HTMLDivElement,
  html: string,
  position: BodyInsertPosition,
): string {
  const chunk = html.trim();
  if (!chunk) return normalizeBodyForEditor(el.innerHTML);

  if (position === 'inline') {
    el.focus();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && el.contains(sel.anchorNode)) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const tpl = document.createElement('template');
      tpl.innerHTML = chunk;
      const frag = tpl.content;
      const last = frag.lastChild;
      range.insertNode(frag);
      if (last) {
        range.setStartAfter(last);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      return normalizeBodyForEditor(el.innerHTML);
    }
  }

  const current = normalizeBodyForEditor(el.innerHTML);
  return mergeBodyHtml(current, chunk, position === 'inline' ? 'bottom' : position);
}

export function insertFigureAtDom(
  el: HTMLDivElement,
  url: string,
  alt: string,
  position: BodyInsertPosition,
  descFontSize?: number,
): string {
  const figure = buildBodyImageFigureHtml(url, alt, undefined, descFontSize);
  if (position === 'inline') {
    el.focus();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && el.contains(sel.anchorNode)) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const tpl = document.createElement('template');
      tpl.innerHTML = figure;
      const node = tpl.content.firstChild;
      if (node) {
        range.insertNode(node);
        range.setStartAfter(node);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      return normalizeBodyForEditor(el.innerHTML);
    }
  }
  const current = normalizeBodyForEditor(el.innerHTML);
  return mergeBodyHtml(current, figure, position === 'inline' ? 'bottom' : position);
}
