'use client';

import { usePathname } from 'next/navigation';
import { SHOWCASE_CATS } from '@/lib/site-data';

const RESERVED = new Set([
  'categories', 'theme', 'upload', 'photo', 'text', 'done', 'write', 'login', 'api',
]);

export function MobileBottomNav({ loggedIn = false }: { loggedIn?: boolean }) {
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

  const navLink = (href: string, active: boolean, icon: string, label: string) => (
    <a href={href} className={`m6-bottom-nav__item${active ? ' is-active' : ''}`}>
      <span className="m6-bottom-nav__icon" aria-hidden>{icon}</span>
      <span>{label}</span>
    </a>
  );

  return (
    <nav className="m6-bottom-nav m6-bottom-nav--6" aria-label="모바일 메인 메뉴">
      {navLink('/', isHome, '🏠', '홈')}
      {navLink('/categories', isCategories, '📂', '카테고리')}
      {navLink('/theme', isTheme, '🎨', '테마')}
      {navLink('/upload', isUpload, '📷', '사진올리기')}
      {navLink('/write', isWrite, '✍️', '글쓰기')}
      <a href="/login" className={`m6-bottom-nav__item${isAccount ? ' is-active' : ''}`}>
        <span className="m6-bottom-nav__icon" aria-hidden>{loggedIn ? '✓' : '👤'}</span>
        <span>{loggedIn ? '계정' : '로그인'}</span>
      </a>
    </nav>
  );
}
