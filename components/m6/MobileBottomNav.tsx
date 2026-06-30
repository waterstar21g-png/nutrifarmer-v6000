'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SHOWCASE_CATS } from '@/lib/site-data';

const RESERVED = new Set([
  'categories', 'theme', 'upload', 'photo', 'text', 'done', 'write', 'login', 'api',
]);

export function MobileBottomNav() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const isCategories =
    pathname === '/categories' ||
    SHOWCASE_CATS.some(c => pathname === `/${c.slug}` || pathname.startsWith(`/${c.slug}/`)) ||
    (!RESERVED.has(pathname.split('/')[1] ?? '') && pathname.split('/').length >= 2 && !pathname.startsWith('/theme'));
  const isTheme = pathname.startsWith('/theme');
  const isUpload =
    pathname === '/upload' || pathname.startsWith('/photo') || pathname.startsWith('/done');
  const isWrite = pathname === '/write' || pathname.startsWith('/text');
  const isAccount = pathname.startsWith('/login');

  return (
    <nav className="m6-bottom-nav m6-bottom-nav--6" aria-label="모바일 메인 메뉴">
      <Link href="/" className={`m6-bottom-nav__item${isHome ? ' is-active' : ''}`}>
        <span className="m6-bottom-nav__icon" aria-hidden>🏠</span>
        <span>홈</span>
      </Link>
      <Link href="/categories" className={`m6-bottom-nav__item${isCategories ? ' is-active' : ''}`}>
        <span className="m6-bottom-nav__icon" aria-hidden>📂</span>
        <span>카테고리</span>
      </Link>
      <Link href="/theme" className={`m6-bottom-nav__item${isTheme ? ' is-active' : ''}`}>
        <span className="m6-bottom-nav__icon" aria-hidden>🎨</span>
        <span>테마</span>
      </Link>
      <Link href="/upload" className={`m6-bottom-nav__item${isUpload ? ' is-active' : ''}`}>
        <span className="m6-bottom-nav__icon" aria-hidden>📷</span>
        <span>사진올리기</span>
      </Link>
      <Link href="/write" className={`m6-bottom-nav__item${isWrite ? ' is-active' : ''}`}>
        <span className="m6-bottom-nav__icon" aria-hidden>✍️</span>
        <span>글쓰기</span>
      </Link>
      <Link href="/login" className={`m6-bottom-nav__item${isAccount ? ' is-active' : ''}`}>
        <span className="m6-bottom-nav__icon" aria-hidden>👤</span>
        <span>계정</span>
      </Link>
    </nav>
  );
}
