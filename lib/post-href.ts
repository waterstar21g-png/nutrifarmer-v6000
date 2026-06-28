export function postHref(categorySlug: string, slug: string, pid?: number): string {
  const base = `/${categorySlug}/${slug}`;
  return pid ? `${base}?pid=${pid}` : base;
}
