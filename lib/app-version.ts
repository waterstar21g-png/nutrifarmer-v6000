/** V6000 shipped version — package.json 과 동기화 */
export const APP_VERSION = '6.1.0.9';

export function appVersionLabel(): string {
  return `V${APP_VERSION}`;
}

/** localStorage·meta 비교용 — V 접두어 유무와 무관하게 동일 버전으로 취급 */
export function normalizeAppVersion(value: string | null | undefined): string {
  if (!value) return '';
  return value.replace(/^V/i, '').trim();
}
