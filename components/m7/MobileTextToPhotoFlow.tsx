'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SHOWCASE_CATS } from '@/lib/site-data';
import { readAutoMode } from '@/lib/v6000-auto-mode';
import { TEXT_FLOW_STEPS } from '@/lib/v6000-write-config';
import { saveLastPost } from '@/lib/v6000-last-post';
import { publishPost } from '@/lib/v6000-write-client';
import { extractLocalKeywords, fetchSuggestedImages, type SuggestedImage } from '@/lib/write-image-suggest';
import { FlowChrome } from './FlowChrome';

type Step = 'write' | 'images' | 'busy';

export function MobileTextToPhotoFlow() {
  const router = useRouter();
  const abortRef = useRef(false);

  const [step, setStep] = useState<Step>('write');
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [categorySlug, setCategorySlug] = useState('daily-life');
  const [images, setImages] = useState<SuggestedImage[]>([]);
  const [pickedUrl, setPickedUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoMode, setAutoMode] = useState(false);

  const stepIndex = step === 'write' ? 0 : step === 'images' ? 1 : 1;
  const dirty = title.trim().length > 0 || bodyText.trim().length > 0 || images.length > 0;

  useEffect(() => {
    setAutoMode(readAutoMode());
  }, []);

  function hardAbort() {
    abortRef.current = true;
    setTitle('');
    setExcerpt('');
    setBodyText('');
    setImages([]);
    setPickedUrl(null);
    setStep('write');
    setError(null);
    router.push('/upload');
  }

  async function onSuggest() {
    if (!title.trim() && !bodyText.trim()) {
      setError('제목 또는 본문을 입력하세요.');
      return;
    }
    setBusy(true);
    setError(null);
    abortRef.current = false;
    setStep('busy');

    try {
      let suggested: SuggestedImage[];
      try {
        suggested = await fetchSuggestedImages({ title, excerpt, body: bodyText });
      } catch (e) {
        if (e instanceof Error && e.message === 'LOGIN_REQUIRED') {
          router.push('/login?redirect_to=/text');
          return;
        }
        const keywords = extractLocalKeywords(title, excerpt, bodyText);
        const { collectSuggestedImages } = await import('@/lib/write-image-suggest');
        suggested = await collectSuggestedImages(keywords);
      }

      if (abortRef.current) return;
      setImages(suggested);
      setStep('images');

      if (suggested[0]) {
        setPickedUrl(suggested[0].url);
        if (autoMode) await publishWithImage(suggested[0].url);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '이미지 추천 실패');
      setStep('write');
    } finally {
      setBusy(false);
    }
  }

  async function publishWithImage(imgUrl?: string) {
    const url = imgUrl ?? pickedUrl;
    if (!url) {
      setError('이미지를 선택하세요.');
      return;
    }
    if (!title.trim()) {
      setError('제목을 입력하세요.');
      return;
    }
    const safeTitle = title.trim().replace(/"/g, '');
    const htmlBody = `<figure><img src="${url}" alt="${safeTitle}" style="max-width:100%;height:auto;border-radius:8px"/></figure><p>${bodyText.replace(/\n/g, '</p><p>')}</p>`;
    setBusy(true);
    setError(null);
    setStep('busy');

    try {
      const post = await publishPost({
        title: title.trim(),
        body: htmlBody,
        excerpt: excerpt.trim() || title.trim(),
        categorySlug,
      });
      saveLastPost(post);
      router.push(
        `/done?category=${encodeURIComponent(post.categorySlug)}&slug=${encodeURIComponent(post.slug)}&pid=${post.id}&title=${encodeURIComponent(post.title)}`,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : '게시 실패';
      if (msg === 'LOGIN_REQUIRED') {
        router.push('/login?redirect_to=/text');
        return;
      }
      setError(msg);
      setStep('images');
    } finally {
      setBusy(false);
    }
  }

  function onBack() {
    if (busy) return;
    if (step === 'images') setStep('write');
  }

  return (
    <div className="m7-flow">
      <FlowChrome
        title="2 · 글 → 사진"
        subtitle="글 내용에 맞는 이미지 추천"
        stepIndex={stepIndex}
        stepLabels={TEXT_FLOW_STEPS}
        busy={busy}
        dirty={dirty}
        onBack={step === 'images' ? onBack : undefined}
        onAbort={hardAbort}
      />

      {error && <p className="m7-error" role="alert">{error}</p>}

      {step === 'write' && (
        <div className="m7-review">
          <label className="m7-field">
            <span>카테고리</span>
            <select value={categorySlug} onChange={e => setCategorySlug(e.target.value)}>
              {SHOWCASE_CATS.map(c => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="m7-field">
            <span>제목</span>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="글 제목" />
          </label>
          <label className="m7-field">
            <span>요약 (선택)</span>
            <textarea rows={2} value={excerpt} onChange={e => setExcerpt(e.target.value)} />
          </label>
          <label className="m7-field">
            <span>본문</span>
            <textarea rows={5} value={bodyText} onChange={e => setBodyText(e.target.value)} placeholder="무엇에 대한 글인가요?" />
          </label>
          <button type="button" className="m7-btn m7-btn--primary m7-btn--xl" disabled={busy} onClick={onSuggest}>
            {autoMode ? '⚡ 추천 · 자동 게시' : '✨ 이미지 추천'}
          </button>
        </div>
      )}

      {step === 'busy' && (
        <div className="m7-loading">
          <div className="m7-spinner" aria-hidden />
          <p>처리 중…</p>
          <button type="button" className="m7-btn m7-btn--ghost" onClick={hardAbort}>✕ 중단</button>
        </div>
      )}

      {step === 'images' && images.length > 0 && (
        <div className="m7-actions">
          <p className="m7-pick__hint">마음에 드는 사진을 탭하세요</p>
          <div className="m7-suggest-grid">
            {images.map(img => (
              <button
                key={img.id}
                type="button"
                className={`m7-suggest-item${pickedUrl === img.url ? ' is-picked' : ''}`}
                onClick={() => setPickedUrl(img.url)}
              >
                <img src={img.url} alt={img.alt} />
                <span>{img.keyword}</span>
              </button>
            ))}
          </div>
          <button type="button" className="m7-btn m7-btn--primary m7-btn--xl" disabled={busy} onClick={() => publishWithImage()}>
            🚀 게시하기
          </button>
          <button type="button" className="m7-btn m7-btn--ghost" onClick={() => setStep('write')}>
            ↩ 글 수정
          </button>
        </div>
      )}
    </div>
  );
}

