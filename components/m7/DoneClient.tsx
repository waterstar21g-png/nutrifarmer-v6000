'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { postReadUrl } from '@/lib/v6000-write-config';
import { saveLastPost } from '@/lib/v6000-write-last-post';

export function DoneClient() {
  const params = useSearchParams();
  const category = params.get('category') ?? '';
  const slug = params.get('slug') ?? '';
  const pid = Number(params.get('pid') ?? '0');
  const title = decodeURIComponent(params.get('title') ?? '게시글');
  const readUrl = category && slug && pid ? postReadUrl(category, slug, pid) : null;

  useEffect(() => {
    if (category && slug && pid) {
      saveLastPost({ id: pid, slug, categorySlug: category, title: params.get('title') ?? title });
    }
  }, [category, slug, pid, title, params]);

  return (
    <div className="m7-done">
      <div className="m7-done__stepbar">
        {['사진', 'AI', '확인'].map(l => (
          <span key={l} className="m7-steps__item is-done"><span className="m7-steps__dot">✓</span><span className="m7-steps__label">{l}</span></span>
        ))}
        <span className="m7-steps__item is-current"><span className="m7-steps__dot">4</span><span className="m7-steps__label">완료</span></span>
      </div>
      <div className="m7-done__celebrate">
        <span className="m7-done__emoji">🎉</span>
        <h2 className="m7-done__title">{title}</h2>
        <p className="m7-done__lead">게시 완료</p>
      </div>
      <div className="m7-actions">
        {readUrl && <Link href={readUrl} className="m7-btn m7-btn--primary m7-btn--xl">글 읽기</Link>}
        <Link href="/photo?mode=continuous" className="m7-btn">3 · 연속 쓰기</Link>
        <Link href="/photo" className="m7-btn">1 · 새 사진</Link>
        <Link href="/upload" className="m7-btn m7-btn--ghost">⌂ 사진올리기</Link>
      </div>
    </div>
  );
}
