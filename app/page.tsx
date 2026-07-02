import type { Metadata } from 'next';
import Link from 'next/link';
import { SHOWCASE_CATS } from '@/lib/site-data';
import { safeFetchPostList } from '@/lib/v5000-content/fetch-safe';
import {
  getCategoryPreviewPostsCached,
  getLatestPreviewPostsCached,
  searchPostsCached,
} from '@/lib/site-content';
import { MobileCatScroll } from '@/components/m6/MobileCatScroll';
import { PostListSection } from '@/components/m6/PostListSection';

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
    const { data: results, loadFailed, stale, notice } = await safeFetchPostList(async () => {
      const r = await searchPostsCached(query, 20);
      return { items: r.posts, stale: r.stale };
    });

    return (
      <>
        <section className="m6-hero">
          <p className="m6-hero__label">검색</p>
          <h1 className="m6-hero__title">&quot;{query}&quot;</h1>
          <p className="m6-hero__desc">
            {loadFailed ? '—' : stale ? `${results.length}건 · 저장본` : `${results.length}건`}
          </p>
        </section>
        <div className="m6-post-list">
          <PostListSection
            posts={results}
            loadFailed={loadFailed}
            stale={stale}
            notice={notice}
            emptyMessage="검색 결과가 없습니다."
          />
        </div>
      </>
    );
  }

  const { data: latest, loadFailed, stale, notice } = await safeFetchPostList(async () => {
    const r = await getLatestPreviewPostsCached(12);
    return { items: r.posts, stale: r.stale };
  });

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
          <PostListSection
            posts={latest}
            loadFailed={loadFailed}
            stale={stale}
            notice={notice}
            emptyMessage="아직 게시글이 없습니다."
          />
        </div>
      </section>
    </>
  );
}
