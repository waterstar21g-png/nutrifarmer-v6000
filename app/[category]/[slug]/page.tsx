import type { Metadata } from 'next';
import { unstable_noStore as noStore } from 'next/cache';
import { notFound } from 'next/navigation';
import { MobileSinglePost } from '@/components/m6/MobileSinglePost';
import { findPublishedPostWithAuthor } from '@/lib/v5000-content/posts';
import { firstImageFromBody } from '@/lib/v5000-content/public-posts';
import { rewriteHtmlMediaUrls } from '@/lib/v5000-content/media-mirror';
import { stripLeadingPostMeta } from '@/lib/single-post-body';

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
    return findPublishedPostWithAuthor({ id: postId }).catch(() => null);
  }
  return findPublishedPostWithAuthor({ slug }).catch(() => null);
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
  const { slug } = await params;
  const { pid } = await searchParams;
  const postId = pid ? parseInt(pid, 10) : undefined;
  const post = await resolvePost(slug, Number.isFinite(postId) ? postId : undefined);

  if (!post) notFound();

  const rawBodyHtml = await rewriteHtmlMediaUrls(post.body);
  const cleanedBody = stripLeadingPostMeta(rawBodyHtml);
  const displayImgUrl = firstImageFromBody(cleanedBody);
  const bodyHtml = displayImgUrl ? removeFirstImageBlock(cleanedBody) : cleanedBody;
  const publishedIso = (post.publishedAt ?? post.updatedAt).toISOString();
  const dateStr = new Date(publishedIso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <MobileSinglePost
      postId={post.id}
      categorySlug={post.categorySlug}
      title={post.title}
      imageUrl={displayImgUrl}
      bodyHtml={bodyHtml}
      fullBodyHtml={cleanedBody}
      authorName={post.authorDisplayName ?? '회원'}
      dateStr={dateStr}
      publishedIso={publishedIso}
    />
  );
}
