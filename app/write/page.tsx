import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '글쓰기',
  description: '모바일에서 글쓰기 — V5000 에디터 연결',
};

const WRITE_URL =
  process.env.NEXT_PUBLIC_V5000_WRITE_URL?.trim() || 'https://www.nutrifarmer.kr/write';

export default function MobileWritePage() {
  return (
    <section className="m6-hero" style={{ marginBottom: '1rem' }}>
      <p className="m6-hero__label">글쓰기</p>
      <h1 className="m6-hero__title">AI 글쓰기</h1>
      <p className="m6-hero__desc">
        모바일에서는 V5000 글쓰기 화면으로 이동합니다. 로그인 후 새 글을 작성할 수 있습니다.
      </p>
      <p style={{ marginTop: '1rem' }}>
        <a
          href={WRITE_URL}
          className="m6-cat-chip is-active"
          style={{ display: 'inline-block', textDecoration: 'none' }}
        >
          글쓰기 열기 →
        </a>
      </p>
      <p style={{ marginTop: '0.75rem', fontSize: '0.8125rem', opacity: 0.9 }}>
        <Link href="/login?redirect_to=/write">로그인</Link>
        {' · '}
        <Link href="/">홈으로</Link>
      </p>
    </section>
  );
}
