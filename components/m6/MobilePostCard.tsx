import Link from 'next/link';
import { postHref } from '@/lib/post-href';
import type { PreviewPost } from '@/lib/home-posts';

interface Props {
  post: PreviewPost;
}

export function MobilePostCard({ post }: Props) {
  const href = postHref(post.categorySlug, post.slug, post.pid ?? post.id);
  const date = post.excerpt ? undefined : undefined;

  return (
    <Link href={href} className="m6-post-card">
      <div className="m6-post-card__thumb">
        {post.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.imageUrl} alt="" loading="lazy" />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontSize: '1.5rem' }}>
            📄
          </div>
        )}
      </div>
      <div className="m6-post-card__body">
        <div className="m6-post-card__cat">{post.categoryName}</div>
        <h2 className="m6-post-card__title">{post.title}</h2>
        {post.excerpt && <p className="m6-post-card__excerpt">{post.excerpt}</p>}
        {date && <time className="m6-post-card__date">{date}</time>}
      </div>
    </Link>
  );
}
