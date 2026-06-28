import type { Metadata } from 'next';
import { unstable_noStore as noStore } from 'next/cache';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  findPublishedPostById,
  findPublishedPostBySlug,
} from '@/lib/v5000-content/posts';
import { getSiteCategory } from '@/lib/v5000-content/public-posts';
import { firstImageFromBody } from '@/lib/v5000-content/public-posts';
import { rewriteHtmlMediaUrls } from '@/lib/v5000-content/media-mirror';
import { MobileCatScroll } from '@/components/m6/MobileCatScroll';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ category: string; slug: string }>;
  searchParams: Promise<{ pid?: string }>;
}

function removeFirstImageBlock(html: string): string {
  if (!html) return html;
  const figureWithImage = /<figure\b[^>]*>[\s\S]*?<img\b[\s\S]*?<\/figure>/i;
  if (figureWithImage.test(html)) {
    return html.replace(figureWithImage, '').trimStart();
  }
  return html.replace(/<img\b[^>]*>/i, '').trimStart();
}

async function resolvePost(slug: string, postId?: number) {
  if (postId) {
    const byId = await findPublishedPostById(postId).catch(() => null);
    if (byId) return byId;
  }
  return findPublishedPostBySlug(slug).catch(() => null);
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  noStore();
  const { slug } = await params;
  const { pid } = await searchParams;
  const postId = pid ? parseInt(pid, 10) : undefined;
  const post = await resolvePost(slug, Number.isFinite(postId) ? postId : undefined);
  if (!post) return {};
  return { title: post.title, description: post.excerpt.slice(0, 160) };
}

export default async function MobileSinglePage({ params, searchParams }: Props) {
  noStore();
  const { slug, category } = await params;
  const { pid } = await searchParams;
  const postId = pid ? parseInt(pid, 10) : undefined;
  const post = await resolvePost(slug, Number.isFinite(postId) ? postId : undefined);

  if (!post) notFound();

  const cat = getSiteCategory(post.categorySlug) ?? getSiteCategory(category);
  const rawBodyHtml = await rewriteHtmlMediaUrls(post.body);
  const displayImgUrl = firstImageFromBody(rawBodyHtml);
  const bodyHtml = displayImgUrl ? removeFirstImageBlock(rawBodyHtml) : rawBodyHtml;
  const publishedIso = (post.publishedAt ?? post.updatedAt).toISOString();
  const dateStr = new Date(publishedIso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <div className="m6-single-banner">
        <h1 className="m6-single-banner__title">{post.title}</h1>
        <div className="m6-single-banner__meta">
          <time dateTime={publishedIso}>{dateStr}</time>
          {cat && <span>{cat.name}</span>}
        </div>
      </div>

      {displayImgUrl && (
        <div className="m6-single-featured">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={displayImgUrl} alt={post.title} />
        </div>
      )}

      {bodyHtml.replace(/<[^>]+>/g, '').trim().length > 0 && (
        <div
          className="m6-single-body wp-content"
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />
      )}

      <section className="m6-section">
        <MobileCatScroll activeSlug={post.categorySlug} />
      </section>

      {cat && (
        <Link href={`/${cat.slug}`} className="m6-single-back">
          ← {cat.name} 목록
        </Link>
      )}
    </>
  );
}
