import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { POSTS_LOAD_ERROR_MSG } from '@/lib/v5000-content/fetch-safe';
import { getThemePanel } from '@/lib/theme-map';
import { listPostsByTheme } from '@/lib/theme-posts';
import { MobilePostCard } from '@/components/m6/MobilePostCard';
import { MobileCatScroll } from '@/components/m6/MobileCatScroll';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ key: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { key } = await params;
  const panel = getThemePanel(key);
  if (!panel) return {};
  return { title: panel.title, description: panel.lead };
}

export default async function ThemeDetailPage({ params }: Props) {
  const { key } = await params;
  const panel = getThemePanel(key);
  if (!panel) notFound();

  const { posts, loadFailed } = await listPostsByTheme(key, 12);

  return (
    <>
      <section className="m6-hero">
        <p className="m6-hero__label">테마</p>
        <h1 className="m6-hero__title">{panel.title}</h1>
        <p className="m6-hero__desc">{panel.lead}</p>
      </section>
      <section className="m6-section">
        <MobileCatScroll />
      </section>
      <section className="m6-section">
        <div className="m6-section__head">
          <h2 className="m6-section__title">글 · 사진</h2>
          <span className="m6-section__link">{loadFailed ? '—' : `${posts.length}건`}</span>
        </div>
        <div className="m6-post-list">
          {loadFailed ? (
            <p className="m6-empty m6-empty--warn">{POSTS_LOAD_ERROR_MSG}</p>
          ) : posts.length > 0 ? (
            posts.map(p => <MobilePostCard key={`${p.categorySlug}-${p.id}`} post={p} />)
          ) : (
            <p className="m6-empty">이 테마에 게시글이 없습니다.</p>
          )}
        </div>
      </section>
    </>
  );
}
