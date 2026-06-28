import { and, eq, ilike, or, sql } from 'drizzle-orm';
import { getDb } from './db';
import { v5000Users, type V5000User } from './schema';
import { hashPassword } from './password';
import { getEmailRegistrationLimit, normalizeEmail } from './email-policy';
import { validateLoginId, isValidEmail, maskEmail } from './validate';

export interface PickUser {
  id: number;
  login_id: string;
  email_masked: string;
}

export type LookupStatus = 'empty' | 'not_found' | 'found' | 'ambiguous';

export function formatPickUser(user: V5000User): PickUser {
  return {
    id: user.id,
    login_id: user.loginId,
    email_masked: maskEmail(user.email),
  };
}

export async function findUserById(id: number): Promise<V5000User | null> {
  const db = getDb();
  const rows = await db.select().from(v5000Users).where(eq(v5000Users.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function findUserByLoginId(loginId: string): Promise<V5000User | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(v5000Users)
    .where(eq(v5000Users.loginId, loginId.trim()))
    .limit(1);
  return rows[0] ?? null;
}

export async function findUsersByEmail(email: string): Promise<V5000User[]> {
  const db = getDb();
  return db
    .select()
    .from(v5000Users)
    .where(sql`lower(${v5000Users.email}) = lower(${normalizeEmail(email)})`);
}

export async function findUserByEmail(email: string): Promise<V5000User | null> {
  const rows = await findUsersByEmail(email);
  return rows[0] ?? null;
}

export async function countUsersByEmail(email: string): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(v5000Users)
    .where(sql`lower(${v5000Users.email}) = lower(${normalizeEmail(email)})`);
  return rows[0]?.count ?? 0;
}

export async function lookupUsersByLogin(raw: string): Promise<{
  status: LookupStatus;
  users: V5000User[];
}> {
  const login = raw.trim();
  if (!login) return { status: 'empty', users: [] };

  const db = getDb();

  if (login.includes('@')) {
    const users = await findUsersByEmail(login);
    if (users.length === 1) return { status: 'found', users };
    if (users.length > 1) return { status: 'ambiguous', users };
    return { status: 'not_found', users: [] };
  }

  const byLoginId = await findUserByLoginId(login);
  if (byLoginId) return { status: 'found', users: [byLoginId] };

  const byDisplay = await db
    .select()
    .from(v5000Users)
    .where(eq(v5000Users.displayName, login));

  if (byDisplay.length === 1) return { status: 'found', users: byDisplay };
  if (byDisplay.length > 1) return { status: 'ambiguous', users: byDisplay };

  const fuzzy = await db
    .select()
    .from(v5000Users)
    .where(
      or(
        ilike(v5000Users.displayName, login),
        ilike(v5000Users.loginId, login),
        ilike(v5000Users.email, login),
      ),
    )
    .limit(10);

  if (fuzzy.length === 1) return { status: 'found', users: fuzzy };
  if (fuzzy.length > 1) return { status: 'ambiguous', users: fuzzy };

  return { status: 'not_found', users: [] };
}

export async function isLoginIdTaken(loginId: string): Promise<boolean> {
  const user = await findUserByLoginId(loginId);
  return !!user;
}

export async function checkEmailRegistration(
  email: string,
): Promise<{ ok: true } | { ok: false; code: 'email_exists' | 'email_limit' }> {
  const normalized = normalizeEmail(email);
  const count = await countUsersByEmail(normalized);
  const limit = getEmailRegistrationLimit(normalized);
  if (count >= limit) {
    return { ok: false, code: limit > 1 ? 'email_limit' : 'email_exists' };
  }
  return { ok: true };
}

/** @deprecated checkEmailRegistration 사용 */
export async function isEmailTaken(email: string): Promise<boolean> {
  const check = await checkEmailRegistration(email);
  return !check.ok;
}

export interface RegisterInput {
  loginId: string;
  displayName: string;
  email: string;
  password: string;
}

export async function createUser(input: RegisterInput): Promise<V5000User> {
  const db = getDb();
  const passwordHash = await hashPassword(input.password);
  const now = new Date();

  const rows = await db
    .insert(v5000Users)
    .values({
      loginId: input.loginId.trim(),
      displayName: input.displayName.trim(),
      email: normalizeEmail(input.email),
      passwordHash,
      role: 'author',
      mustResetPassword: false,
      updatedAt: now,
    })
    .returning();

  return rows[0];
}

export async function updateUserPassword(userId: number, password: string): Promise<void> {
  const db = getDb();
  const passwordHash = await hashPassword(password);
  await db
    .update(v5000Users)
    .set({
      passwordHash,
      mustResetPassword: false,
      updatedAt: new Date(),
    })
    .where(eq(v5000Users.id, userId));
}

export function validateRegisterInput(input: {
  username?: string;
  display_name?: string;
  email?: string;
  password?: string;
  password_confirm?: string;
}): { ok: true; data: RegisterInput } | { ok: false; code: string; attempt?: string } {
  const loginId = (input.username ?? '').trim();
  const displayName = (input.display_name ?? '').trim();
  const email = (input.email ?? '').trim();
  const password = input.password ?? '';
  const confirm = input.password_confirm ?? '';

  if (!loginId || !displayName || !email || !password || !confirm) {
    return { ok: false, code: 'empty', attempt: displayName };
  }

  const idCheck = validateLoginId(loginId);
  if (!idCheck.ok) return { ok: false, code: idCheck.code, attempt: displayName };

  if (!isValidEmail(email)) return { ok: false, code: 'invalid_email', attempt: displayName };

  if (password.length < 4) return { ok: false, code: 'weak', attempt: displayName };
  if (password !== confirm) return { ok: false, code: 'mismatch', attempt: displayName };

  return {
    ok: true,
    data: { loginId, displayName, email, password },
  };
}
