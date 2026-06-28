'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { SHOWCASE_CATS } from '@/lib/site-data';
import { MobileBottomNav } from './MobileBottomNav';

const AUTH_API = '/api/v5000/auth';

export function MobileShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const isLogin = pathname.startsWith('/login');

  const refreshAuth = useCallback(() => {
    fetch(`${AUTH_API}/me`)
      .then(r => r.json())
      .then(data => setUserName(data.loggedIn ? data.user?.name ?? '회원' : null))
      .catch(() => setUserName(null));
  }, []);

  useEffect(() => { refreshAuth(); }, [refreshAuth, pathname]);

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
        <Link href="/" className="m6-header__brand">탁월한 찬사</Link>
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
      <MobileBottomNav cats={SHOWCASE_CATS} />
    </div>
  );
}
