'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { postsStaleBannerMessage } from '@/lib/v5000-content/db-error';

interface Props {
  /** DB 실패 + 저장된 목록도 없을 때 전체 화면 안내 */
  fullPage?: boolean;
  /** 이전에 불러온 목록을 표시 중 */
  stale?: boolean;
  /** 서버에서 분류한 안내 문구 */
  message?: string;
  /** 자동 재시도 (8초 후) */
  autoRetry?: boolean;
}

export function PostsLoadNotice({
  fullPage = false,
  stale = false,
  message,
  autoRetry = true,
}: Props) {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);

  const onRetry = useCallback(() => {
    setRetrying(true);
    router.refresh();
  }, [router]);

  useEffect(() => {
    if (!autoRetry || stale || !fullPage) return;
    const timer = window.setTimeout(onRetry, 8000);
    return () => window.clearTimeout(timer);
  }, [autoRetry, stale, fullPage, onRetry]);

  const title = stale
    ? '최근에 불러온 글을 보여드립니다'
    : '지금은 새 목록을 가져오지 못했습니다';

  const desc = stale
    ? postsStaleBannerMessage()
    : message ??
      '올려 두신 글은 삭제되지 않았습니다. 잠시 후 아래 버튼으로 다시 불러와 주세요.';

  return (
    <div
      className={`m6-posts-notice${fullPage ? ' m6-posts-notice--full' : ''}`}
      role="status"
      aria-live="polite"
    >
      <p className="m6-posts-notice__title">{title}</p>
      <p className="m6-posts-notice__desc">{desc}</p>
      {!stale && (
        <button
          type="button"
          className="m6-posts-notice__btn"
          onClick={onRetry}
          disabled={retrying}
        >
          {retrying ? '불러오는 중…' : '다시 불러오기'}
        </button>
      )}
    </div>
  );
}
