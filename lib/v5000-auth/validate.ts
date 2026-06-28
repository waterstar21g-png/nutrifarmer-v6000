export type ValidateResult = { ok: true } | { ok: false; code: string };

/** v4000 동일 — 별명/ID 규칙 */
export function validateLoginId(value: string): ValidateResult {
  const v = value.trim();
  if (!v) return { ok: false, code: 'empty_nickname' };

  if (/[\uAC00-\uD7A3]/.test(v)) {
    const hangul = v.match(/[\uAC00-\uD7A3]/g) ?? [];
    if (hangul.length < 2) return { ok: false, code: 'weak_nickname_ko' };
    return { ok: true };
  }

  if (/^[a-zA-Z0-9._-]+$/.test(v)) {
    if (v.length < 6) return { ok: false, code: 'weak_nickname_en' };
    return { ok: true };
  }

  if ([...v].length < 2) return { ok: false, code: 'weak_nickname' };
  return { ok: true };
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const visible = local.length <= 2 ? local[0] : local.slice(0, 2);
  return `${visible}***@${domain}`;
}
