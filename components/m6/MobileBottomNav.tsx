'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Cat {
  slug: string;
  name: string;
}

interface Props {
  cats: Cat[];
}

export function MobileBottomNav({ cats }: Props) {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const isWrite = pathname.startsWith('/write');
  const activeCat = cats.find(c => pathname === `/${c.slug}` || pathname.startsWith(`/${c.slug}/`));

  return (
    <nav className="m6-bottom-nav" aria-label="모바일 메인 메뉴">
      <Link href="/" className={`m6-bottom-nav__item${isHome ? ' is-active' : ''}`}>
        <span className="m6-bottom-nav__icon" aria-hidden>🏠</span>
        <span>홈</span>
      </Link>
      <Link
        href={activeCat ? `/${activeCat.slug}` : `/${cats[0]?.slug ?? 'daily-life'}`}
        className={`m6-bottom-nav__item${activeCat ? ' is-active' : ''}`}
      >
        <span className="m6-bottom-nav__icon" aria-hidden>📂</span>
        <span>카테고리</span>
      </Link>
      <Link href="/write" className={`m6-bottom-nav__item${isWrite ? ' is-active' : ''}`}>
        <span className="m6-bottom-nav__icon" aria-hidden>✍️</span>
        <span>글쓰기</span>
      </Link>
      <Link
        href="/login"
        className={`m6-bottom-nav__item${pathname.startsWith('/login') ? ' is-active' : ''}`}
      >
        <span className="m6-bottom-nav__icon" aria-hidden>👤</span>
        <span>계정</span>
      </Link>
    </nav>
  );
}
