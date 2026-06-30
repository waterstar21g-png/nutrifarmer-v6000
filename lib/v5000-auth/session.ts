import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import type { NextResponse } from 'next/server';
import { SESSION_COOKIE, SESSION_COOKIE_OPTS } from './config';

export const IDLE_LIMIT_SEC = 600;

export interface V5000Session {
  userId: number;
  role: string;
  loginId: string;
  displayName: string;
  exp: number;
  lastActive?: number;
  remember?: boolean;
}

function sessionSecret(): string {
  const secret = process.env.AUTH_SESSION_SECRET?.trim();
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SESSION_SECRET is required in production');
  }
  return secret || 'nf-v5000-dev-session-secret';
}

export function encodeSession(
  payload: Omit<V5000Session, 'exp'> & { exp?: number },
  remember = false,
): string {
  const now = Math.floor(Date.now() / 1000);
  const exp = payload.exp ?? now + (remember ? 14 * 86400 : 2 * 86400);
  const body: V5000Session = {
    userId: payload.userId,
    role: payload.role,
    loginId: payload.loginId,
    displayName: payload.displayName,
    exp,
    lastActive: payload.lastActive ?? now,
    remember: payload.remember ?? remember,
  };
  const data = Buffer.from(JSON.stringify(body), 'utf8').toString('base64url');
  const sig = createHmac('sha256', sessionSecret()).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function parseSessionPayload(token: string): V5000Session | null {
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
    return parsed;
  } catch {
    return null;
  }
}

export function isSessionIdle(session: V5000Session): boolean {
  const now = Math.floor(Date.now() / 1000);
  const lastActive = session.lastActive ?? now;
  return now - lastActive > IDLE_LIMIT_SEC;
}

export function decodeSession(token: string): V5000Session | null {
  const parsed = parseSessionPayload(token);
  if (!parsed) return null;
  const now = Math.floor(Date.now() / 1000);
  if (parsed.exp < now) return null;
  if (isSessionIdle(parsed)) return null;
  return parsed;
}

export function refreshSessionToken(session: V5000Session): string {
  const remember = !!session.remember;
  return encodeSession({
    userId: session.userId,
    role: session.role,
    loginId: session.loginId,
    displayName: session.displayName,
    exp: session.exp,
    lastActive: Math.floor(Date.now() / 1000),
    remember: session.remember,
  }, remember);
}

export function applyRefreshedSessionCookie(res: NextResponse, session: V5000Session): void {
  const remember = !!session.remember;
  res.cookies.set(SESSION_COOKIE, refreshSessionToken(session), {
    ...SESSION_COOKIE_OPTS,
    maxAge: sessionMaxAge(remember),
  });
}

export async function readSessionFromRequest(req: NextRequest): Promise<V5000Session | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return decodeSession(token);
}

export async function readSessionFromCookies(): Promise<V5000Session | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return decodeSession(token);
}

export async function readSessionTokenFromCookies(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value;
}

export function sessionMaxAge(remember: boolean): number {
  return remember ? 60 * 60 * 24 * 14 : 60 * 60 * 24 * 2;
}
