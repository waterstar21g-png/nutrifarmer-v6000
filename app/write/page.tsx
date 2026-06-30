import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '글쓰기',
  description: '모바일 글쓰기 — V6.1',
};

const PC_WRITE_URL =
  process.env.NEXT_PUBLIC_V5000_WRITE_URL?.trim() || 'https://www.nutrifarmer.kr/write';

export default function MobileWritePage() {
  return (
    <>
      <section className="m6-hero">
        <p className="m6-hero__label">글쓰기</p>
        <h1 className="m6-hero__title">AI 글쓰기</h1>
        <p className="m6-hero__desc">모바일에서 글을 쓰고 이미지를 추천받을 수 있습니다.</p>
      </section>
      <div className="m7-actions" style={{ marginTop: '0.5rem' }}>
        <Link href="/text" className="m7-btn m7-btn--primary m7-btn--xl">2 · 글 → 사진 (AI)</Link>
        <Link href="/upload" className="m7-btn">사진올리기 메뉴</Link>
        <a href={PC_WRITE_URL} className="m7-btn m7-btn--ghost" target="_blank" rel="noopener noreferrer">
          PC 에디터 열기 →
        </a>
      </div>
      <p style={{ marginTop: '0.75rem', fontSize: '0.8125rem', opacity: 0.9 }}>
        <Link href="/login?redirect_to=/write">로그인</Link>
        {' · '}
        <Link href="/">홈으로</Link>
      </p>
    </>
  );
}
