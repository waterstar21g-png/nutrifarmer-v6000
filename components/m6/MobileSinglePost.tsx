'use client';

import { MobilePostOwnerMenu } from './MobilePostOwnerMenu';

interface Props {
  postId: number;
  categorySlug: string;
  title: string;
  imageUrl: string | null;
  bodyHtml: string;
  fullBodyHtml: string;
  authorName: string;
  dateStr: string;
  publishedIso: string;
}

export function MobileSinglePost({
  postId,
  categorySlug,
  title,
  imageUrl,
  bodyHtml,
  fullBodyHtml,
  authorName,
  dateStr,
  publishedIso,
}: Props) {
  const hasBody = bodyHtml.replace(/<[^>]+>/g, '').trim().length > 0;

  return (
    <article className="m6-single">
      <MobilePostOwnerMenu
        postId={postId}
        variant="single"
        initialFullBody={fullBodyHtml}
        afterDeleteTo={`/${categorySlug}`}
      />

      {imageUrl && (
        <div className="m6-single-featured">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={title} />
        </div>
      )}

      <h1 className="m6-single__title">{title}</h1>

      {hasBody && (
        <div
          className="m6-single-body wp-content"
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />
      )}

      <footer className="m6-single__byline">
        <span>{authorName}</span>
        <time dateTime={publishedIso}>{dateStr}</time>
      </footer>
    </article>
  );
}
