import type { PreviewPost } from '@/lib/home-posts';
import { MobilePostCard } from '@/components/m6/MobilePostCard';
import { PostsLoadNotice } from '@/components/m6/PostsLoadNotice';

interface Props {
  posts: PreviewPost[];
  loadFailed: boolean;
  stale?: boolean;
  notice?: string;
  emptyMessage: string;
}

/** 글 목록 + DB 장애·캐시 안내 — 실패해도 가능하면 글은 그대로 표시 */
export function PostListSection({
  posts,
  loadFailed,
  stale,
  notice,
  emptyMessage,
}: Props) {
  if (posts.length > 0) {
    return (
      <>
        {(stale || loadFailed) && <PostsLoadNotice stale={stale} message={notice} />}
        {posts.map(p => (
          <MobilePostCard key={`${p.categorySlug}-${p.id}`} post={p} />
        ))}
      </>
    );
  }

  if (loadFailed) {
    return <PostsLoadNotice fullPage message={notice} autoRetry />;
  }

  return <p className="m6-empty">{emptyMessage}</p>;
}
