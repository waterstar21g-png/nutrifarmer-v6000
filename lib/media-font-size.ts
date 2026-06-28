/** 미디어 설명 폰트 — 1=크게, 10=작게 */

export const MEDIA_FONT_SIZE_DEFAULT = 5;
export const MEDIA_FONT_SIZE_MIN = 1;
export const MEDIA_FONT_SIZE_MAX = 10;

export function clampMediaFontSize(level: number): number {
  return Math.min(MEDIA_FONT_SIZE_MAX, Math.max(MEDIA_FONT_SIZE_MIN, Math.round(level)));
}

/** level 1 → 1.35rem … level 10 → 0.62rem */
export function mediaFontSizeRem(level: number): string {
  const n = clampMediaFontSize(level);
  const rem = 1.35 - ((n - 1) * 0.73) / 9;
  return `${rem.toFixed(2)}rem`;
}

export function mediaCaptionStyle(level: number): string {
  return `font-size:${mediaFontSizeRem(level)}`;
}
