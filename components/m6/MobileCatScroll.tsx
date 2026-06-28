import Link from 'next/link';
import { SHOWCASE_CATS } from '@/lib/site-data';

interface Props {
  activeSlug?: string;
}

export function MobileCatScroll({ activeSlug }: Props) {
  return (
    <div className="m6-cat-scroll" role="navigation" aria-label="카테고리">
      {SHOWCASE_CATS.map(cat => (
        <Link
          key={cat.slug}
          href={`/${cat.slug}`}
          className={`m6-cat-chip${activeSlug === cat.slug ? ' is-active' : ''}`}
        >
          {cat.name}
        </Link>
      ))}
    </div>
  );
}
