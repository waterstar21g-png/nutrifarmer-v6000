import Link from 'next/link';
import { postHref } from '@/lib/post-href';
import type { PreviewPost } from '@/lib/home-posts';
import { MobilePostOwnerMenu } from './MobilePostOwnerMenu';

interface Props {
  post: PreviewPost;
}

/** 서버 컴포넌트 — 옛 JS 하이드레이션이 목록 UI를 덮어쓰지 못함 */
export function MobilePostCard({ post }: Props) {
  const href = postHref(post.categorySlug, post.slug, post.pid ?? post.id);

  return (
    <div className="m6-post-card-wrap">
      <MobilePostOwnerMenu
        postId={post.id}
        variant="card"
      />
      <Link href={href} prefetch={false} className="m6-post-card">
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
          <h2 className="m6-post-card__title">{post.title}</h2>
          {post.excerpt && <p className="m6-post-card__excerpt">{post.excerpt}</p>}
        </div>
      </Link>
    </div>
  );
}
