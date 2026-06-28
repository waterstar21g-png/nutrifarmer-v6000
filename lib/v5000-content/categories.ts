import { SHOWCASE_CATS } from '@/lib/site-data';

const VALID_SLUGS = new Set(SHOWCASE_CATS.map(c => c.slug));

export function isValidCategorySlug(slug: string): boolean {
  return VALID_SLUGS.has(slug);
}

export function listCategories() {
  return SHOWCASE_CATS.map(c => ({ slug: c.slug, name: c.name }));
}
