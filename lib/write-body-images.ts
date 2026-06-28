import { clampMediaFontSize, mediaCaptionStyle, MEDIA_FONT_SIZE_DEFAULT } from '@/lib/media-font-size';

export const DEFAULT_BODY_IMG_WIDTH = 320;
export const MIN_BODY_IMG_WIDTH = 80;
export const MAX_BODY_IMG_WIDTH = 900;

export function clampBodyImgWidth(px: number): number {
  return Math.min(MAX_BODY_IMG_WIDTH, Math.max(MIN_BODY_IMG_WIDTH, Math.round(px)));
}

function escAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function escHtml(s: string): string {
  return escAttr(s).replace(/\n/g, ' ');
}

function parseFigureBlock(fig: string): { w: number; src: string; alt: string } | null {
  const src = fig.match(/\bsrc=["']([^"']+)["']/i)?.[1]?.trim();
  if (!src) return null;
  const alt = (fig.match(/\balt=["']([^"']*)["']/i)?.[1] ?? '이미지').slice(0, 100);
  const wRaw =
    fig.match(/data-width=["'](\d+)["']/i)?.[1] ??
    fig.match(/style="[^"]*width:\s*(\d+)px/i)?.[1] ??
    fig.match(/\bwidth=["'](\d+)["']/i)?.[1];
  const w = clampBodyImgWidth(wRaw ? parseInt(wRaw, 10) : DEFAULT_BODY_IMG_WIDTH);
  return { w, src, alt };
}

function figureToImgTag(fig: string): string {
  const meta = parseFigureBlock(fig);
  if (!meta) return '';
  return `<img src="${meta.src}" alt="${meta.alt}" style="width:${meta.w}px;max-width:100%;height:auto;border-radius:6px;margin:0.5rem 0;" />`;
}

export function buildBodyImageFigureHtml(
  url: string,
  alt: string,
  widthPx = DEFAULT_BODY_IMG_WIDTH,
  descFontSize = MEDIA_FONT_SIZE_DEFAULT,
): string {
  const w = clampBodyImgWidth(widthPx);
  const safeUrl = escAttr(url.trim());
  const safeAlt = escAttr((alt || '이미지').slice(0, 100));
  const fs = clampMediaFontSize(descFontSize);
  const captionText = (alt || '').trim();
  const caption =
    captionText && captionText !== '이미지'
      ? `<p class="nfw-body-img__caption nfw-body-block__caption" style="${mediaCaptionStyle(fs)}" data-nf-fs="${fs}">${escHtml(captionText)}</p>`
      : '';
  return (
    `<figure class="nfw-body-img" contenteditable="false" data-nfw-embed="image" data-nfw-img="1" data-width="${w}" style="width:${w}px">` +
    `<div class="nfw-body-img__bar">` +
    `<span class="nfw-body-img__drag nfw-body-block__drag" title="드래그하여 이동" aria-label="드래그하여 이동">⋮⋮</span>` +
    `<input type="number" class="nfw-body-img__width-in nfw-body-block__width-in" min="${MIN_BODY_IMG_WIDTH}" max="${MAX_BODY_IMG_WIDTH}" value="${w}" aria-label="이미지 너비(px)" />` +
    `<span class="nfw-body-img__unit">px</span>` +
    `<button type="button" class="nfw-body-img__del nfw-body-block__del" aria-label="이미지 삭제">삭제</button>` +
    `</div>` +
    `<img src="${safeUrl}" alt="${safeAlt}" draggable="false" />` +
    caption +
    `<span class="nfw-body-img__resize nfw-body-block__resize" aria-hidden="true"></span>` +
    `</figure>`
  );
}

/** 편집기 — 마크다운·단독 img → 조작 가능 figure */
export function normalizeBodyImagesForEditor(html: string): string {
  if (!html) return '';
  let s = html;

  s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt: string, url: string) =>
    buildBodyImageFigureHtml(url.trim(), alt.trim() || '이미지'));

  const figures: string[] = [];
  s = s.replace(/<figure[^>]*class="[^"]*nfw-body-img[^"]*"[\s\S]*?<\/figure>/gi, m => {
    figures.push(m);
    return `\x00FIG${figures.length - 1}\x00`;
  });

  s = s.replace(/<img\b[^>]*>/gi, tag => {
    if (/nfw-body-img/.test(tag)) return tag;
    const src = tag.match(/\bsrc=["']([^"']+)["']/i)?.[1] ?? '';
    if (!src) return tag;
    const alt = tag.match(/\balt=["']([^"']*)["']/i)?.[1] ?? '이미지';
    const w =
      parseInt(tag.match(/\bwidth=["']?(\d+)/i)?.[1] ?? '', 10) ||
      parseInt(tag.match(/width:\s*(\d+)px/i)?.[1] ?? '', 10) ||
      DEFAULT_BODY_IMG_WIDTH;
    return buildBodyImageFigureHtml(src, alt, w);
  });

  figures.forEach((fig, i) => {
    s = s.replace(`\x00FIG${i}\x00`, fig);
  });

  return s;
}

/** 게시·미리보기 — figure → img (width 유지) */
export function bodyImagesToPublishHtml(html: string): string {
  if (!html) return '';
  let s = html;

  s = s.replace(/<figure[^>]*class="[^"]*nfw-body-img[^"]*"[\s\S]*?<\/figure>/gi, fig =>
    figureToImgTag(fig));

  s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt: string, url: string) => {
    const a = alt.trim() || '이미지';
    return `<img src="${url.trim()}" alt="${a}" style="max-width:100%;height:auto;border-radius:6px;margin:0.5rem 0;" />`;
  });

  return s;
}
