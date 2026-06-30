import { FEATURE_PANELS, STAT_ITEMS } from '@/lib/site-data';

export const THEME_KEYS = FEATURE_PANELS.map(p => p.key);

export interface ThemeInfo {
  key: string;
  label: string;
  num: string;
  title: string;
  lead: string;
}

export function listThemes(): ThemeInfo[] {
  return FEATURE_PANELS.map(panel => {
    const stat = STAT_ITEMS[panel.statIndex];
    return {
      key: panel.key,
      label: stat?.label ?? panel.title,
      num: stat?.num ?? '',
      title: panel.title,
      lead: panel.lead,
    };
  });
}

export function getThemePanel(key: string) {
  return FEATURE_PANELS.find(p => p.key === key) ?? null;
}

export function getThemeSlugs(key: string): string[] {
  const panel = getThemePanel(key);
  if (!panel) return [];
  const stat = STAT_ITEMS[panel.statIndex];
  if (!stat) return [];
  return [...new Set(stat.cards.map(c => c.slug))];
}

const slugToThemes = new Map<string, { key: string; label: string }[]>();

function buildSlugThemeMap() {
  if (slugToThemes.size > 0) return;
  for (const panel of FEATURE_PANELS) {
    const stat = STAT_ITEMS[panel.statIndex];
    if (!stat) continue;
    for (const card of stat.cards) {
      const list = slugToThemes.get(card.slug) ?? [];
      if (!list.some(t => t.key === panel.key)) {
        list.push({ key: panel.key, label: stat.label });
      }
      slugToThemes.set(card.slug, list);
    }
  }
}

export function getThemesForCategory(slug: string): { key: string; label: string }[] {
  buildSlugThemeMap();
  return slugToThemes.get(slug) ?? [];
}
