/** DB 장애 시 마지막 성공 목록 보관 (워밍된 서버리스 인스턴스 간 공유) */
type StaleEntry<T> = { data: T; savedAt: number };

declare global {
  // eslint-disable-next-line no-var
  var __v6000PostStale: Map<string, StaleEntry<unknown>> | undefined;
}

const STALE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function store(): Map<string, StaleEntry<unknown>> {
  if (!globalThis.__v6000PostStale) {
    globalThis.__v6000PostStale = new Map();
  }
  return globalThis.__v6000PostStale;
}

export function savePostListStale<T>(key: string, data: T): void {
  store().set(key, { data, savedAt: Date.now() });
}

export function loadPostListStale<T>(key: string): T | null {
  const hit = store().get(key);
  if (!hit) return null;
  if (Date.now() - hit.savedAt > STALE_MAX_AGE_MS) {
    store().delete(key);
    return null;
  }
  return hit.data as T;
}
