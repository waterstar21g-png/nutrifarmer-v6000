const FALLBACKS = [
  'https://old.nutrifarmer.kr/wp-json',
  'https://www.nutrifarmer.kr/wp-json',
];

export function resolveWpApiBase() {
  const configured = process.env.WP_API_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');
  return 'https://old.nutrifarmer.kr/wp-json';
}

export function wpAuthHeader() {
  const user = process.env.WP_APP_USER?.trim();
  const pass = process.env.WP_APP_PASSWORD?.trim();
  if (!user || !pass) return null;
  return `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`;
}

export async function wpFetchJson(path, { revalidate = false } = {}) {
  const bases = [...new Set([
    resolveWpApiBase(),
    ...FALLBACKS.map(b => b.replace(/\/$/, '')),
  ])];

  const auth = wpAuthHeader();
  let lastErr = null;

  for (const base of bases) {
    const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
    try {
      const res = await fetch(url, {
        headers: auth ? { Authorization: auth } : {},
        ...(revalidate ? {} : { cache: 'no-store' }),
      });
      if (res.status === 403 || res.status === 404) {
        lastErr = new Error(`HTTP ${res.status}: ${url}`);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
      return {
        base,
        data: await res.json(),
        total: Number(res.headers.get('x-wp-total') ?? 0),
        totalPages: Number(res.headers.get('x-wp-totalpages') ?? 1),
      };
    } catch (e) {
      lastErr = e;
    }
  }

  throw lastErr ?? new Error('WP fetch failed');
}

export async function fetchAllWpPages(pathBuilder) {
  const items = [];
  let page = 1;
  let totalPages = 1;
  let base = null;

  do {
    const result = await wpFetchJson(pathBuilder(page));
    base = result.base;
    totalPages = result.totalPages;
    const chunk = Array.isArray(result.data) ? result.data : [];
    items.push(...chunk);
    page++;
  } while (page <= totalPages);

  return { base, items };
}
