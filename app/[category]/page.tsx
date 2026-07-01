import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { listPublishedByCategory } from '@/lib/v5000-content/posts';
import { getSiteCategory, rowToPreviewPost } from '@/lib/v5000-content/public-posts';
import { rewriteHtmlMediaUrls } from '@/lib/v5000-content/media-mirror';
import { MobilePostCard } from '@/components/m6/MobilePostCard';
import { MobileCatScroll } from '@/components/m6/MobileCatScroll';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ category: string }>;
}

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const cat = getSiteCategory(category);
  if (!cat) return {};
  return { title: cat.name, description: cat.desc ?? cat.name };
}

export default async function MobileCategoryPage({ params }: Props) {
  const { category } = await params;
  const cat = getSiteCategory(category);
  if (!cat) notFound();

  const rows = await listPublishedByCategory(category, 30).catch(() => []);
  const posts = await Promise.all(
    rows.map(async row => {
      const body = await rewriteHtmlMediaUrls(row.body);
      return rowToPreviewPost({ ...row, body }, cat);
    }),
  );

  return (
    <>
      <section className="m6-hero">
        <p className="m6-hero__label">카테고리</p>
        <h1 className="m6-hero__title">{cat.name}</h1>
        {cat.desc && <p className="m6-hero__desc">{cat.desc}</p>}
      </section>

      <section className="m6-section">
        <MobileCatScroll activeSlug={category} />
      </section>

      <section className="m6-section">
        <div className="m6-section__head">
          <h2 className="m6-section__title">글 목록</h2>
          <span className="m6-section__link">{posts.length}건</span>
        </div>
        <div className="m6-post-list">
          {posts.length > 0 ? (
            posts.map(p => <MobilePostCard key={p.id} post={p} />)
          ) : (
            <p className="m6-empty">이 카테고리에 게시글이 없습니다.</p>
          )}
        </div>
      </section>
    </>
  );
}
