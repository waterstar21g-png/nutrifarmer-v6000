import { clampMediaFontSize, mediaCaptionStyle, MEDIA_FONT_SIZE_DEFAULT } from '@/lib/media-font-size';
import {
  bodyImagesToPublishHtml,
  clampBodyImgWidth,
  normalizeBodyImagesForEditor,
} from '@/lib/write-body-images';
export const DEFAULT_VIDEO_BLOCK_WIDTH = 480;
export const DEFAULT_FILE_BLOCK_WIDTH = 360;

export { clampBodyImgWidth as clampBodyBlockWidth };

function escAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function escHtml(s: string): string {
  return escAttr(s).replace(/\n/g, ' ');
}

function blockBar(kindLabel: string, width: number): string {
  return (
    `<div class="nfw-body-block__bar">` +
    `<span class="nfw-body-block__drag" title="드래그하여 이동" aria-label="드래그하여 이동">⋮⋮</span>` +
    `<span class="nfw-body-block__kind">${kindLabel}</span>` +
    `<input type="number" class="nfw-body-block__width-in" min="80" max="900" value="${width}" aria-label="너비(px)" />` +
    `<span class="nfw-body-block__unit">px</span>` +
    `<button type="button" class="nfw-body-block__del" aria-label="삭제">삭제</button>` +
    `</div>`
  );
}

export function videoEmbedSrc(url: string): string {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  return url.trim();
}

export function buildBodyVideoBlockHtml(
  url: string,
  title: string,
  widthPx = DEFAULT_VIDEO_BLOCK_WIDTH,
  descFontSize = MEDIA_FONT_SIZE_DEFAULT,
): string {
  const w = clampBodyImgWidth(widthPx);
  const safeUrl = escAttr(url.trim());
  const safeTitle = escAttr((title || url).slice(0, 100));
  const embed = escAttr(videoEmbedSrc(url));
  const fs = clampMediaFontSize(descFontSize);
  const captionText = (title || url).trim();
  return (
    `<figure class="nfw-body-block nfw-body-block--video" contenteditable="false" data-nfw-embed="video" data-url="${safeUrl}" data-title="${safeTitle}" data-width="${w}" data-nf-fs="${fs}" style="width:${w}px">` +
    blockBar('동영상', w) +
    `<div class="nfw-body-block__body">` +
    `<iframe class="nfw-body-block__iframe" src="${embed}" title="${safeTitle}" allowfullscreen loading="lazy"></iframe>` +
    `<p class="nfw-body-block__caption" style="${mediaCaptionStyle(fs)}">${escHtml(captionText)}</p>` +
    `</div>` +
    `<span class="nfw-body-block__resize" aria-hidden="true"></span>` +
    `</figure>`
  );
}

export function buildBodyFileBlockHtml(
  url: string,
  name: string,
  widthPx = DEFAULT_FILE_BLOCK_WIDTH,
  descFontSize = MEDIA_FONT_SIZE_DEFAULT,
): string {
  const w = clampBodyImgWidth(widthPx);
  const safeUrl = escAttr(url.trim());
  const safeName = escAttr((name || '파일').slice(0, 100));
  const fs = clampMediaFontSize(descFontSize);
  const label = (name || url).trim();
  return (
    `<figure class="nfw-body-block nfw-body-block--file" contenteditable="false" data-nfw-embed="file" data-url="${safeUrl}" data-title="${safeName}" data-width="${w}" data-nf-fs="${fs}" style="width:${w}px">` +
    blockBar('파일', w) +
    `<div class="nfw-body-block__body">` +
    `<a class="nfw-body-block__file-link" href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="${mediaCaptionStyle(fs)}">📎 ${escHtml(label)}</a>` +
    `</div>` +
    `<span class="nfw-body-block__resize" aria-hidden="true"></span>` +
    `</figure>`
  );
}

/** 편집기 — 이미지·동영상·파일 마크다운 → 조작 가능 블록 */
export function normalizeBodyForEditor(html: string): string {
  if (!html) return '';
  let s = html;

  s = s.replace(/\[동영상:\s*([^\]]*)\]\(([^)]+)\)/g, (_, title: string, url: string) =>
    buildBodyVideoBlockHtml(url.trim(), title.trim() || url.trim()));

  s = s.replace(/\[📎\s*([^\]]*)\]\(([^)]+)\)/g, (_, name: string, url: string) =>
    buildBodyFileBlockHtml(url.trim(), name.trim() || url.trim()));

  return normalizeBodyImagesForEditor(s);
}

function stripBlockChrome(html: string): string {
  return html
    .replace(/<div class="nfw-body-block__bar">[\s\S]*?<\/div>/gi, '')
    .replace(/<div class="nfw-body-img__bar">[\s\S]*?<\/div>/gi, '')
    .replace(/<span class="nfw-body-block__resize"[^>]*>\s*<\/span>/gi, '')
    .replace(/<span class="nfw-body-img__resize"[^>]*>\s*<\/span>/gi, '')
    .replace(/<span class="nfw-body-block__drag"[^>]*>[\s\S]*?<\/span>/gi, '')
    .replace(/<span class="nfw-body-img__drag"[^>]*>[\s\S]*?<\/span>/gi, '');
}

/** 게시·미리보기 — 블록 → 링크·iframe·img */
export function bodyBlocksToPublishHtml(html: string): string {
  if (!html) return '';
  let s = stripBlockChrome(html);

  s = s.replace(
    /<figure[^>]*data-nfw-embed=["']video["'][^>]*>[\s\S]*?<\/figure>/gi,
    fig => {
      const url = fig.match(/data-url=["']([^"']+)["']/i)?.[1] ?? '';
      const title = fig.match(/data-title=["']([^"']*)["']/i)?.[1] ?? '동영상';
      if (!url) return '';
      const embed = videoEmbedSrc(url.replace(/&amp;/g, '&'));
      if (embed.includes('youtube.com/embed')) {
        return `<div class="nfw-pub-video"><iframe src="${embed}" title="${title}" allowfullscreen loading="lazy" style="width:100%;max-width:640px;aspect-ratio:16/9;border:none;border-radius:8px"></iframe></div>`;
      }
      return `<p><a href="${url}" target="_blank" rel="noopener noreferrer">동영상: ${title}</a></p>`;
    },
  );

  s = s.replace(
    /<figure[^>]*data-nfw-embed=["']file["'][^>]*>[\s\S]*?<\/figure>/gi,
    fig => {
      const url = fig.match(/data-url=["']([^"']+)["']/i)?.[1] ?? '';
      const title = fig.match(/data-title=["']([^"']*)["']/i)?.[1] ?? '파일';
      if (!url) return '';
      return `<p><a href="${url.replace(/&amp;/g, '&')}" target="_blank" rel="noopener noreferrer">📎 ${title}</a></p>`;
    },
  );

  return bodyImagesToPublishHtml(s);
}
