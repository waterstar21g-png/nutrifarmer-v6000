'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MobileBottomNav } from './MobileBottomNav';
import { appVersionLabel } from '@/lib/app-version';

const AUTH_API = '/api/v5000/auth';
const TOUCH_INTERVAL_MS = 2 * 60 * 1000;

export function MobileShell({ children }: { children: React.ReactNode }) {
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
          router.push('/login?reason=idle');
          return;
        }
        setUserName(data.loggedIn ? data.user?.name ?? '회원' : null);
      })
      .catch(() => setUserName(null));
  }, [router]);

  const touchSession = useCallback(() => {
    const now = Date.now();
    if (!activeRef.current || now - lastTouchRef.current < TOUCH_INTERVAL_MS) return;
    lastTouchRef.current = now;
    fetch(`${AUTH_API}/touch`, { method: 'POST', credentials: 'same-origin' })
      .then(async r => {
        if (r.status === 401) {
          const data = await r.json();
          if (data.code === 'session_idle') router.push('/login?reason=idle');
        }
      })
      .catch(() => undefined);
  }, [router]);

  useEffect(() => { refreshAuth(); }, [refreshAuth, pathname]);

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

  if (isLogin) {
    return <div className="m6-app m6-app--login">{children}</div>;
  }

  return (
    <div className="m6-app">
      <header className="m6-header">
        <Link href="/" className="m6-header__brand">탁월한 찬사 · {appVersionLabel()}</Link>
        <form className="m6-header__search" onSubmit={onSearch}>
          <input name="q" type="search" placeholder="검색" aria-label="검색" />
        </form>
        {userName ? (
          <span className="m6-header__auth" title={userName}>{userName.slice(0, 4)}</span>
        ) : (
          <Link href="/login" className="m6-header__auth">로그인</Link>
        )}
      </header>
      <main className="m6-main">{children}</main>
      <MobileBottomNav />
    </div>
  );
}
