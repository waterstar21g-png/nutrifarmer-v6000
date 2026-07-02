import type { Metadata } from 'next';
import Link from 'next/link';
import { SHOWCASE_CATS } from '@/lib/site-data';
import { POSTS_LOAD_ERROR_MSG, safeFetchPosts } from '@/lib/v5000-content/fetch-safe';
import { getLatestPreviewPosts, searchPreviewPosts } from '@/lib/home-posts';
import { MobilePostCard } from '@/components/m6/MobilePostCard';
import { MobileCatScroll } from '@/components/m6/MobileCatScroll';

export const revalidate = 300;

export const metadata: Metadata = {
  title: '홈',
  description: '탁월한 찬사 — 모바일 홈',
};

interface Props {
  searchParams: Promise<{ s?: string }>;
}

export default async function MobileHomePage({ searchParams }: Props) {
  const { s } = await searchParams;
  const query = s?.trim();

  if (query) {
    const { data: results, loadFailed } = await safeFetchPosts(
      () => searchPreviewPosts(query, 20),
      [],
    );
    return (
      <>
        <section className="m6-hero">
          <p className="m6-hero__label">검색</p>
          <h1 className="m6-hero__title">&quot;{query}&quot;</h1>
          <p className="m6-hero__desc">{loadFailed ? '—' : `${results.length}건`}</p>
        </section>
        <div className="m6-post-list">
          {loadFailed ? (
            <p className="m6-empty m6-empty--warn">{POSTS_LOAD_ERROR_MSG}</p>
          ) : results.length > 0 ? (
            results.map(p => <MobilePostCard key={`${p.categorySlug}-${p.id}`} post={p} />)
          ) : (
            <p className="m6-empty">검색 결과가 없습니다.</p>
          )}
        </div>
      </>
    );
  }

  const { data: latest, loadFailed } = await safeFetchPosts(
    () => getLatestPreviewPosts(12),
    [],
  );

  return (
    <>
      <section className="m6-hero">
        <p className="m6-hero__label">V6.1 · 모바일</p>
        <h1 className="m6-hero__title">기록하는 삶, 나누는 이야기</h1>
        <p className="m6-hero__desc">
          {SHOWCASE_CATS.length}개 카테고리 · 일상·가족·성장·나눔
        </p>
      </section>

      <section className="m6-section">
        <MobileCatScroll />
      </section>

      <section className="m6-section">
        <div className="m6-section__head">
          <h2 className="m6-section__title">최신 글</h2>
          <Link href="/daily-life" className="m6-section__link">더보기</Link>
        </div>
        <div className="m6-post-list">
          {loadFailed ? (
            <p className="m6-empty m6-empty--warn">{POSTS_LOAD_ERROR_MSG}</p>
          ) : latest.length > 0 ? (
            latest.map(p => <MobilePostCard key={`${p.categorySlug}-${p.id}`} post={p} />)
          ) : (
            <p className="m6-empty">아직 게시글이 없습니다.</p>
          )}
        </div>
      </section>
    </>
  );
}
