'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MOBILE_AUTH_CHANGED } from '@/lib/mobile-auth-events';
import { MobileBottomNav } from './MobileBottomNav';

const AUTH_API = '/api/v5000/auth';
const TOUCH_INTERVAL_MS = 2 * 60 * 1000;

export function MobileShell({
  children,
  serverVersion,
}: {
  children: React.ReactNode;
  serverVersion: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const isLogin = pathname.startsWith('/login');
  const activeRef = useRef(false);
  const lastTouchRef = useRef(0);

  const refreshAuth = useCallback(() => {
    fetch(`${AUTH_API}/me`, { credentials: 'same-origin' })
      .then(async r => {
        const data = await r.json();
        if (data.code === 'session_idle') {
          setUserName(null);
          return;
        }
        setUserName(data.loggedIn ? data.user?.name ?? '회원' : null);
      })
      .catch(() => setUserName(null));
  }, []);

  const touchSession = useCallback(() => {
    const now = Date.now();
    if (!activeRef.current || now - lastTouchRef.current < TOUCH_INTERVAL_MS) return;
    lastTouchRef.current = now;
    fetch(`${AUTH_API}/touch`, { method: 'POST', credentials: 'same-origin' })
      .then(async r => {
        if (r.status === 401) {
          const data = await r.json();
          if (data.code === 'session_idle') setUserName(null);
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth, pathname]);

  useEffect(() => {
    const onAuthChanged = () => refreshAuth();
    window.addEventListener(MOBILE_AUTH_CHANGED, onAuthChanged);
    return () => window.removeEventListener(MOBILE_AUTH_CHANGED, onAuthChanged);
  }, [refreshAuth]);

  useEffect(() => {
    if (isLogin) return;
    const onActivity = () => {
      activeRef.current = true;
      touchSession();
    };
    window.addEventListener('pointerdown', onActivity, { passive: true });
    window.addEventListener('keydown', onActivity);
    window.addEventListener('scroll', onActivity, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', onActivity);
      window.removeEventListener('keydown', onActivity);
      window.removeEventListener('scroll', onActivity);
    };
  }, [isLogin, touchSession]);

  function onSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const q = String(fd.get('q') ?? '').trim();
    if (q) router.push(`/?s=${encodeURIComponent(q)}`);
  }

  return (
    <div className={`m6-app${isLogin ? ' m6-app--login' : ''}`}>
      {!isLogin && (
        <header className="m6-header">
          <a href="/" className="m6-header__brand">탁월한 찬사 · {serverVersion}</a>
          <form className="m6-header__search" onSubmit={onSearch}>
            <input name="q" type="search" placeholder="검색" aria-label="검색" />
          </form>
          {userName ? (
            <Link href="/login" className="m6-header__auth" title={userName}>{userName.slice(0, 4)}</Link>
          ) : (
            <Link href="/login" className="m6-header__auth">로그인</Link>
          )}
        </header>
      )}
      {isLogin && (
        <header className="m6-header m6-header--login">
          <a href="/" className="m6-header__brand">← 홈</a>
          <span className="m6-header__auth m6-header__auth--label">계정</span>
        </header>
      )}
      <main className={`m6-main${isLogin ? ' m6-main--login' : ''}`}>{children}</main>
      <MobileBottomNav loggedIn={!!userName} />
    </div>
  );
}
