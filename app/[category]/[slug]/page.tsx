import type { Metadata } from 'next';
import { unstable_noStore as noStore } from 'next/cache';
import { notFound } from 'next/navigation';
import { MobileSinglePostView } from '@/components/m6/MobileSinglePostView';
import { findPublishedPostWithAuthor } from '@/lib/v5000-content/posts';
import { firstImageFromBody } from '@/lib/v5000-content/public-posts';
import { rewriteHtmlMediaUrls } from '@/lib/v5000-content/media-mirror';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ category: string; slug: string }>;
  searchParams: Promise<{ pid?: string }>;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  noStore();
  const { slug } = await params;
  const { pid } = await searchParams;
  const postId = pid ? parseInt(pid, 10) : undefined;
  const post = await findPublishedPostWithAuthor(slug, Number.isFinite(postId) ? postId : undefined).catch(() => null);
  if (!post) return {};
  return { title: post.title, description: post.excerpt.slice(0, 160) };
}

export default async function MobileSinglePage({ params, searchParams }: Props) {
  noStore();
  const { slug } = await params;
  const { pid } = await searchParams;
  const postId = pid ? parseInt(pid, 10) : undefined;
  const post = await findPublishedPostWithAuthor(slug, Number.isFinite(postId) ? postId : undefined).catch(() => null);

  if (!post) notFound();

  const rawBodyHtml = await rewriteHtmlMediaUrls(post.body);
  const displayImgUrl = firstImageFromBody(rawBodyHtml);

  return (
    <MobileSinglePostView
      postId={post.id}
      authorId={post.authorId}
      authorName={post.authorDisplayName ?? '회원'}
      categorySlug={post.categorySlug}
      title={post.title}
      fullBodyHtml={rawBodyHtml}
      displayImgUrl={displayImgUrl}
    />
  );
}
