/** 동일 이메일로 여러 계정 허용 (관리 1 + author 3 등) */
export const SHARED_EMAIL_MAX_ACCOUNTS = 4;

export const SHARED_EMAIL_ALLOWLIST: readonly string[] = ['waterstar21@naver.com'];

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function getEmailRegistrationLimit(email: string): number {
  const normalized = normalizeEmail(email);
  if (SHARED_EMAIL_ALLOWLIST.includes(normalized)) return SHARED_EMAIL_MAX_ACCOUNTS;
  return 1;
}

export function isSharedEmailAllowlist(email: string): boolean {
  return SHARED_EMAIL_ALLOWLIST.includes(normalizeEmail(email));
}
