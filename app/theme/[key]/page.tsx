import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getThemePanel } from '@/lib/theme-map';
import { listPostsByTheme } from '@/lib/theme-posts';
import { MobileCatScroll } from '@/components/m6/MobileCatScroll';
import { PostListSection } from '@/components/m6/PostListSection';

export const revalidate = 300;

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

  const { posts, loadFailed, stale, notice } = await listPostsByTheme(key, 12);

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
          <span className="m6-section__link">
            {loadFailed ? '—' : stale ? `${posts.length}건 · 저장본` : `${posts.length}건`}
          </span>
        </div>
        <div className="m6-post-list">
          <PostListSection
            posts={posts}
            loadFailed={loadFailed}
            stale={stale}
            notice={notice}
            emptyMessage="이 테마에 게시글이 없습니다."
          />
        </div>
      </section>
    </>
  );
}
