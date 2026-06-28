import bcrypt from 'bcryptjs';
import { MIN_PASSWORD_LENGTH } from './config';

const ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, ROUNDS);
}

export async function verifyPassword(password: string, hash: string | null): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

export function validatePasswordPair(
  password: string,
  confirm: string,
): { ok: true } | { ok: false; code: string } {
  if (password.length < MIN_PASSWORD_LENGTH) return { ok: false, code: 'weak' };
  if (password !== confirm) return { ok: false, code: 'mismatch' };
  return { ok: true };
}
