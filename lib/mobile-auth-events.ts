/** MobileShell ↔ LoginHub 세션 동기화 */
export const MOBILE_AUTH_CHANGED = 'nf-mobile-auth-changed';

export function notifyMobileAuthChanged(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(MOBILE_AUTH_CHANGED));
}
