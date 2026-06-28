export function slugify(title: string): string {
  const base = title
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\uAC00-\uD7A3-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 180);
  return base || `post-${Date.now()}`;
}

export async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
  excludeId?: number,
): Promise<string> {
  let candidate = slugify(base);
  if (!(await exists(candidate))) return candidate;

  for (let i = 2; i < 100; i++) {
    const next = `${candidate}-${i}`.slice(0, 200);
    if (!(await exists(next))) return next;
  }

  return `${candidate}-${Date.now()}`.slice(0, 200);
}
