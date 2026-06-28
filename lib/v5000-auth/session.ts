import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

export interface V5000Session {
  userId: number;
  role: string;
  loginId: string;
  displayName: string;
  exp: number;
}

function sessionSecret(): string {
  const secret = process.env.AUTH_SESSION_SECRET?.trim();
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SESSION_SECRET is required in production');
  }
  return secret || 'nf-v5000-dev-session-secret';
}

export function encodeSession(payload: Omit<V5000Session, 'exp'> & { exp?: number }, remember = false): string {
  const exp =
    payload.exp ??
    Math.floor(Date.now() / 1000) + (remember ? 14 * 86400 : 2 * 86400);
  const body: V5000Session = {
    userId: payload.userId,
    role: payload.role,
    loginId: payload.loginId,
    displayName: payload.displayName,
    exp,
  };
  const data = Buffer.from(JSON.stringify(body), 'utf8').toString('base64url');
  const sig = createHmac('sha256', sessionSecret()).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function decodeSession(token: string): V5000Session | null {
  const [data, sig] = token.split('.');
  if (!data || !sig) return null;
  const expected = createHmac('sha256', sessionSecret()).update(data).digest('base64url');
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as V5000Session;
    if (!parsed.userId || !parsed.exp) return null;
    if (parsed.exp < Math.floor(Date.now() / 1000)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function readSessionFromRequest(req: NextRequest): Promise<V5000Session | null> {
  const { SESSION_COOKIE } = await import('./config');
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return decodeSession(token);
}

export async function readSessionFromCookies(): Promise<V5000Session | null> {
  const { SESSION_COOKIE } = await import('./config');
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return decodeSession(token);
}

export function sessionMaxAge(remember: boolean): number {
  return remember ? 60 * 60 * 24 * 14 : 60 * 60 * 24 * 2;
}
