'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { SHOWCASE_CATS } from '@/lib/site-data';

const RESERVED = new Set([
  'categories', 'theme', 'upload', 'photo', 'text', 'done', 'write', 'login', 'api',
]);

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
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
    <Link
      href={href}
      prefetch={false}
      className={`m6-bottom-nav__item${active ? ' is-active' : ''}`}
      onClick={() => router.refresh()}
    >
      <span className="m6-bottom-nav__icon" aria-hidden>{icon}</span>
      <span>{label}</span>
    </Link>
  );

  return (
    <nav className="m6-bottom-nav m6-bottom-nav--6" aria-label="모바일 메인 메뉴">
      {navLink('/', isHome, '🏠', '홈')}
      {navLink('/categories', isCategories, '📂', '카테고리')}
      {navLink('/theme', isTheme, '🎨', '테마')}
      {navLink('/upload', isUpload, '📷', '사진올리기')}
      {navLink('/write', isWrite, '✍️', '글쓰기')}
      {navLink('/login', isAccount, '👤', '계정')}
    </nav>
  );
}
