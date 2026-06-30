import type { Metadata } from 'next';
import Link from 'next/link';
import { SHOWCASE_CATS, ABOUT_ITEMS, FAMILY_ITEMS } from '@/lib/site-data';

export const metadata: Metadata = {
  title: '카테고리',
  description: '모바일 카테고리 목록',
};

const SECTIONS = [
  { title: '메인 카테고리', items: SHOWCASE_CATS },
  { title: '나를 소개합니다', items: ABOUT_ITEMS },
  { title: '가족 앨범', items: FAMILY_ITEMS },
];

export default function CategoriesPage() {
  return (
    <>
      <section className="m6-hero">
        <p className="m6-hero__label">카테고리</p>
        <h1 className="m6-hero__title">기록의 영역</h1>
        <p className="m6-hero__desc">주제별로 글과 사진을 모아 봅니다.</p>
      </section>
      {SECTIONS.map(sec => (
        <section key={sec.title} className="m6-section">
          <h2 className="m6-section__title">{sec.title}</h2>
          <div className="m6-cat-grid">
            {sec.items.map(cat => (
              <Link key={cat.slug} href={`/${cat.slug}`} className="m6-cat-grid__item">
                <span className="m6-cat-grid__icon" aria-hidden>{cat.icon}</span>
                <strong>{cat.name}</strong>
                <span>{cat.desc}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
