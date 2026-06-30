'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { V7000_MENUS, postReadUrl } from '@/lib/v7000-config';
import { readAutoMode, toggleAutoMode } from '@/lib/v7000-auto-mode';
import { readLastPost } from '@/lib/v7000-last-post';

export function WriteHubMenu() {
  const router = useRouter();
  const [autoOn, setAutoOn] = useState(false);
  const [lastPost, setLastPost] = useState(readLastPost());

  useEffect(() => {
    setAutoOn(readAutoMode());
    setLastPost(readLastPost());
  }, []);

  function onMenuClick(item: (typeof V7000_MENUS)[number]) {
    if (item.action === 'auto-toggle') {
      setAutoOn(toggleAutoMode());
      return;
    }
    if (item.action === 'last-post') {
      const lp = readLastPost();
      if (lp) router.push(postReadUrl(lp.categorySlug, lp.slug, lp.id));
      return;
    }
    if (item.external && item.href) {
      window.location.href = item.href;
      return;
    }
    if (item.href) router.push(item.href);
  }

  return (
    <div className="m7-hub">
      <section className="m7-hub__hero">
        <p className="m7-hub__tag">V6.1 · 사진올리기</p>
        <h1 className="m7-hub__headline">사진만 주세요</h1>
        <p className="m7-hub__lead">AI가 알아서 할게요 — 메뉴 1~6</p>
      </section>

      {autoOn && (
        <p className="m7-hub__auto-banner">⚡ 5번 자동모드 ON — 확인·게시 생략</p>
      )}

      <ul className="m7-menu">
        {V7000_MENUS.map(item => (
          <li key={item.id}>
            <button
              type="button"
              className={`m7-menu__item${item.action === 'auto-toggle' && autoOn ? ' is-active' : ''}`}
              onClick={() => onMenuClick(item)}
            >
              <span className="m7-menu__num">{item.id}</span>
              <span className="m7-menu__body">
                <strong>{item.title}</strong>
                <span>{item.desc}</span>
              </span>
              {item.action === 'auto-toggle' ? (
                <span className="m7-menu__badge">{autoOn ? 'ON' : 'OFF'}</span>
              ) : (
                <span className="m7-menu__arrow" aria-hidden>›</span>
              )}
            </button>
          </li>
        ))}
      </ul>

      {lastPost && (
        <Link
          href={postReadUrl(lastPost.categorySlug, lastPost.slug, lastPost.id)}
          className="m7-hub__last"
        >
          <span>6 · 최근 게시</span>
          <strong>{lastPost.title}</strong>
        </Link>
      )}

      <p className="m7-hub__foot">
        <Link href="/">홈</Link>
        {' · '}
        <Link href="/login">로그인</Link>
      </p>
    </div>
  );
}
