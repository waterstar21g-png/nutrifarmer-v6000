import { createHash, randomBytes, randomInt } from 'crypto';
import { and, eq, gt } from 'drizzle-orm';
import { getDb } from './db';
import { v5000PasswordResets } from './schema';
import { RESET_CODE_TTL_MS, RESET_MAX_ATTEMPTS, SITE_URL } from './config';
import { sendAccountHintEmail, sendResetCodeEmail } from '@/lib/mailer';
import { findUsersByEmail, lookupUsersByLogin, formatPickUser } from './users';
import { maskEmail } from './validate';

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export async function sendFindAccountEmail(email: string): Promise<{ ok: boolean; code?: string }> {
  const users = await findUsersByEmail(email);
  if (!users.length) {
    return { ok: true };
  }

  const sent = await sendAccountHintEmail({
    to: users[0].email,
    accounts: users.map(u => ({ displayName: u.displayName, loginId: u.loginId })),
  });

  if (!sent) return { ok: false, code: 'mail_failed' };
  return { ok: true };
}

export async function createPasswordReset(login: string): Promise<
  | { ok: true; token: string; maskedEmail: string }
  | { ok: false; code: string; attempt?: string; pick_users?: ReturnType<typeof formatPickUser>[] }
> {
  const lookup = await lookupUsersByLogin(login);

  if (lookup.status === 'ambiguous') {
    return {
      ok: false,
      code: 'ambiguous',
      attempt: login,
      pick_users: lookup.users.map(formatPickUser),
    };
  }

  if (lookup.status !== 'found' || !lookup.users[0]) {
    return { ok: true, token: '', maskedEmail: '' };
  }

  const user = lookup.users[0];
  const token = randomBytes(24).toString('hex');
  const code = String(randomInt(100000, 999999));
  const expiresAt = new Date(Date.now() + RESET_CODE_TTL_MS);

  const db = getDb();
  await db.insert(v5000PasswordResets).values({
    userId: user.id,
    tokenHash: sha256(token),
    codeHash: sha256(code),
    expiresAt,
  });

  const verifyUrl = `${SITE_URL}/login?panel=verify&token=${encodeURIComponent(token)}&email=${encodeURIComponent(maskEmail(user.email))}`;
  const sent = await sendResetCodeEmail({
    to: user.email,
    displayName: user.displayName,
    code,
    verifyUrl,
  });

  if (!sent) return { ok: false, code: 'mail_failed', attempt: login };

  return { ok: true, token, maskedEmail: maskEmail(user.email) };
}

export async function verifyResetCode(
  token: string,
  code: string,
): Promise<{ ok: true; token: string } | { ok: false; code: string }> {
  const db = getDb();
  const rows = await db
    .select()
    .from(v5000PasswordResets)
    .where(
      and(
        eq(v5000PasswordResets.tokenHash, sha256(token)),
        gt(v5000PasswordResets.expiresAt, new Date()),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row) return { ok: false, code: 'code_expired' };

  if (row.attempts >= RESET_MAX_ATTEMPTS) {
    return { ok: false, code: 'code_expired' };
  }

  if (sha256(code) !== row.codeHash) {
    await db
      .update(v5000PasswordResets)
      .set({ attempts: row.attempts + 1 })
      .where(eq(v5000PasswordResets.id, row.id));
    return { ok: false, code: 'invalid_code' };
  }

  return { ok: true, token };
}

export async function completePasswordReset(
  token: string,
  password: string,
): Promise<{ ok: true } | { ok: false; code: string }> {
  const db = getDb();
  const rows = await db
    .select()
    .from(v5000PasswordResets)
    .where(
      and(
        eq(v5000PasswordResets.tokenHash, sha256(token)),
        gt(v5000PasswordResets.expiresAt, new Date()),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row) return { ok: false, code: 'code_expired' };

  const { updateUserPassword } = await import('./users');
  await updateUserPassword(row.userId, password);

  await db.delete(v5000PasswordResets).where(eq(v5000PasswordResets.id, row.id));

  return { ok: true };
}
