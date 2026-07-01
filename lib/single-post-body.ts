import { SHOWCASE_CATS, STAT_ITEMS, ABOUT_ITEMS, FAMILY_ITEMS } from '@/lib/site-data';

const META_LABELS = new Set<string>([
  ...SHOWCASE_CATS.map(c => c.name),
  ...ABOUT_ITEMS.map(c => c.name),
  ...FAMILY_ITEMS.map(c => c.name),
  ...STAT_ITEMS.map(s => s.label),
  '콘텐츠 카테고리',
]);

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 단일글 상단 카테고리·테마 태그 줄 제거 */
export function stripLeadingPostMeta(html: string): string {
  let next = html.trim();
  for (let i = 0; i < 6; i++) {
    const m = next.match(
      /^(\s*(?:<(?:p|div|span|ul|li)[^>]*>[\s\S]*?<\/(?:p|div|span|ul|li)>\s*)+)/i,
    );
    if (!m) break;
    const block = m[1];
    const text = block.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!text || text.length > 80) break;
    const parts = text.split(/[·|/]/).map(s => s.trim()).filter(Boolean);
    const allMeta = parts.every(p => META_LABELS.has(p) || [...META_LABELS].some(l => p.includes(l)));
    if (!allMeta && !META_LABELS.has(text)) break;
    next = next.slice(block.length).trimStart();
  }
  return next;
}

export function extractImageBlocks(html: string): string {
  const figures = html.match(/<figure[\s\S]*?<\/figure>/gi) ?? [];
  if (figures.length) return figures.join('\n');
  const imgs = html.match(/<img\b[^>]*\/?>/gi) ?? [];
  return imgs.join('\n');
}

export function bodyHtmlToPlainText(html: string): string {
  return html
    .replace(/<figure[\s\S]*?<\/figure>/gi, '')
    .replace(/<img\b[^>]*\/?>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function plainTextToBodyHtml(text: string, imageBlocks: string): string {
  const paras = text
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('\n');
  const imgs = imageBlocks.trim();
  if (imgs && paras) return `${imgs}\n${paras}`;
  return imgs || paras || '<p></p>';
}
