import type { Metadata } from 'next';
import Link from 'next/link';
import { listThemes } from '@/lib/theme-map';

export const metadata: Metadata = {
  title: '테마',
  description: '주제별 테마로 글과 사진 보기',
};

export default function ThemeIndexPage() {
  const themes = listThemes();
  return (
    <>
      <section className="m6-hero">
        <p className="m6-hero__label">테마</p>
        <h1 className="m6-hero__title">삶의 네 기둥</h1>
        <p className="m6-hero__desc">카테고리를 주제별로 다시 묶어 봅니다.</p>
      </section>
      <div className="m6-theme-list">
        {themes.map(t => (
          <Link key={t.key} href={`/theme/${t.key}`} className="m6-theme-card">
            <span className="m6-theme-card__num">{t.num}</span>
            <div>
              <strong>{t.title}</strong>
              <p>{t.lead}</p>
              <span className="m6-theme-card__label">{t.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
