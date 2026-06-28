/** Edge/middleware — nf-v5000-session 페이로드 검사 (서명은 API에서) */

export function sessionPayloadLooksValid(token: string | undefined): boolean {
  if (!token || !token.includes('.')) return false;
  const [data] = token.split('.');
  if (!data) return false;
  try {
    const b64 = data.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : '';
    const parsed = JSON.parse(atob(b64 + pad)) as { userId?: number; exp?: number };
    if (!parsed.userId || !parsed.exp) return false;
    return parsed.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}
