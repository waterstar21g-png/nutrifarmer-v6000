'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SHOWCASE_CATS } from '@/lib/site-data';
import type { VisionDraftResult } from '@/lib/ai-vision-draft';
import { readAutoMode } from '@/lib/v7000-auto-mode';
import { menuTitleForMode, PHOTO_FLOW_STEPS, postReadUrl, type PhotoFlowMode } from '@/lib/v7000-config';
import { saveLastPost } from '@/lib/v7000-last-post';
import { publishPost, requestVisionDraft, uploadPhoto } from '@/lib/v7000-client';
import { prependFeaturedImageIfMissing } from '@/lib/write-featured-image';
import { FlowChrome } from './FlowChrome';

type Step = 'pick' | 'confirm' | 'ai' | 'review';

interface LocalPhoto {
  id: string;
  file: File;
  preview: string;
}

interface PublishedBrief {
  id: number;
  slug: string;
  categorySlug: string;
  title: string;
}

interface Props {
  mode: PhotoFlowMode;
}

export function MobilePhotoWriteFlow({ mode }: Props) {
  const router = useRouter();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const meaningRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef(false);

  const [step, setStep] = useState<Step>('pick');
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [draft, setDraft] = useState<VisionDraftResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [toast, setToast] = useState<PublishedBrief | null>(null);
  const [showMeaningGrid, setShowMeaningGrid] = useState(false);
  const [userMeaning, setUserMeaning] = useState('');
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

  const multi = mode === 'multi';
  const continuous = mode === 'continuous';

  const stepIndex =
    step === 'pick' || step === 'confirm' ? 0 : step === 'ai' ? 1 : step === 'review' ? 2 : 0;

  useEffect(() => {
    setAutoMode(readAutoMode());
  }, []);

  useEffect(() => {
    return () => {
      photos.forEach(p => URL.revokeObjectURL(p.preview));
    };
  }, [photos]);

  useEffect(() => {
    if (showMeaningGrid) {
      meaningRef.current?.focus();
    }
  }, [showMeaningGrid]);

  function resetAll() {
    photos.forEach(p => URL.revokeObjectURL(p.preview));
    setPhotos([]);
    setDraft(null);
    setStep('pick');
    setError(null);
    setBusy(false);
    setShowMeaningGrid(false);
    setUserMeaning('');
    abortRef.current = false;
    setUploadedUrls([]);
  }

  function buildPublishBody(textBody: string, urls: string[], title: string): string {
    let html = textBody;
    for (const url of urls) {
      html = prependFeaturedImageIfMissing(html, url, title);
    }
    return html;
  }

  function hardAbort() {
    abortRef.current = true;
    resetAll();
    router.push('/upload');
  }

  function addFiles(files: FileList | null) {
    if (!files?.length) return;
    const next: LocalPhoto[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      next.push({
        id: `${Date.now()}-${i}`,
        file,
        preview: URL.createObjectURL(file),
      });
    }
    if (!next.length) return;
    setPhotos(prev => (multi ? [...prev, ...next] : [next[0]]));
    setStep('confirm');
    setError(null);
    setShowMeaningGrid(false);
    setUserMeaning('');
  }

  function finishPublish(post: PublishedBrief) {
    saveLastPost(post);
    if (continuous) {
      setToast(post);
      resetAll();
    } else {
      router.push(
        `/done?category=${encodeURIComponent(post.categorySlug)}&slug=${encodeURIComponent(post.slug)}&pid=${post.id}&title=${encodeURIComponent(post.title)}`,
      );
    }
  }

  async function runPipeline(auto: boolean, userIntent?: string) {
    setBusy(true);
    setError(null);
    abortRef.current = false;
    setStep('ai');

    try {
      const uploaded: string[] = [];
      for (const p of photos) {
        if (abortRef.current) return;
        const media = await uploadPhoto(p.file);
        uploaded.push(media.url);
      }

      if (abortRef.current) return;

      const intent = userIntent?.trim();
      const result = await requestVisionDraft({
        imageUrls: uploaded,
        mergeMode: multi ? 'multi' : 'single',
        userIntent: intent || undefined,
      });

      if (abortRef.current) return;
      setDraft(result);
      setUploadedUrls(uploaded);

      if (auto) {
        const post = await publishPost({
          title: result.title,
          body: buildPublishBody(result.body, uploaded, result.title),
          excerpt: result.excerpt,
          categorySlug: result.categorySlug,
        });
        finishPublish(post);
      } else {
        setStep('review');
      }
    } catch (e) {
      if (abortRef.current) return;
      const msg = e instanceof Error ? e.message : '처리 실패';
      if (msg === 'LOGIN_REQUIRED') {
        const q = multi ? '?mode=multi' : continuous ? '?mode=continuous' : '';
        router.push(`/login?redirect_to=${encodeURIComponent(`/photo${q}`)}`);
        return;
      }
      setError(msg);
      setStep('confirm');
    } finally {
      setBusy(false);
    }
  }

  function onStartAiAuto() {
    const auto = readAutoMode();
    setAutoMode(auto);
    setShowMeaningGrid(false);
    runPipeline(auto);
  }

  function onToggleMeaning() {
    setShowMeaningGrid(v => !v);
    setError(null);
  }

  function onStartWithMeaning() {
    const text = userMeaning.trim();
    if (!text) {
      setError('나의 의미를 입력해 주세요.');
      meaningRef.current?.focus();
      return;
    }
    const auto = readAutoMode();
    setAutoMode(auto);
    runPipeline(auto, text);
  }

  async function onPublish() {
    if (!draft) return;
    setBusy(true);
    setError(null);
    try {
      const post = await publishPost({
        title: draft.title,
        body: buildPublishBody(draft.body, uploadedUrls, draft.title),
        excerpt: draft.excerpt,
        categorySlug: draft.categorySlug,
      });
      finishPublish(post);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '게시 실패';
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  function onBack() {
    if (busy) return;
    if (step === 'review') {
      setStep('confirm');
      return;
    }
    if (step === 'confirm') {
      resetAll();
    }
  }

  const dirty = photos.length > 0 || draft !== null || step !== 'pick' || userMeaning.trim().length > 0;

  return (
    <div className="m7-flow">
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="m7-hidden-input"
        onChange={e => addFiles(e.target.files)}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple={multi}
        className="m7-hidden-input"
        onChange={e => addFiles(e.target.files)}
      />

      <FlowChrome
        title={menuTitleForMode(mode)}
        subtitle={
          step === 'ai'
            ? 'AI가 글을 작성 중…'
            : showMeaningGrid
              ? '이 사진에 담긴 나의 의미'
              : '사진만 주세요'
        }
        stepIndex={stepIndex}
        stepLabels={PHOTO_FLOW_STEPS}
        busy={busy}
        dirty={dirty}
        onBack={step === 'confirm' || step === 'review' ? onBack : undefined}
        onAbort={hardAbort}
      />

      {toast && (
        <div className="m7-toast">
          <span>🎉 {toast.title}</span>
          <a href={postReadUrl(toast.categorySlug, toast.slug, toast.id)} className="m7-link-btn">글 보기</a>
          <button type="button" className="m7-link-btn" onClick={() => setToast(null)}>닫기</button>
        </div>
      )}

      {error && <p className="m7-error" role="alert">{error}</p>}

      {step === 'pick' && (
        <div className="m7-pick m7-pick--hero">
          <p className="m7-pick__hint">📷 촬영하거나 🖼 앨범에서 고르세요</p>
          <div className="m7-pick__row">
            <button type="button" className="m7-btn m7-btn--primary m7-btn--half" onClick={() => cameraRef.current?.click()}>
              📷 카메라
            </button>
            <button type="button" className="m7-btn m7-btn--half" onClick={() => galleryRef.current?.click()}>
              🖼 갤러리
            </button>
          </div>
        </div>
      )}

      {step === 'confirm' && (
        <div className="m7-actions">
          <div className={`m7-grid${multi ? '' : ' m7-grid--single'}`}>
            {photos.map(p => (
              <img key={p.id} src={p.preview} alt="" className="m7-grid__img" />
            ))}
          </div>
          {multi && (
            <button type="button" className="m7-btn m7-btn--ghost" onClick={() => galleryRef.current?.click()}>
              + 사진 추가 ({photos.length}장)
            </button>
          )}

          <div className="m7-btn-row">
            <button
              type="button"
              className="m7-btn m7-btn--primary m7-btn--half"
              disabled={busy}
              onClick={onStartAiAuto}
            >
              {autoMode ? '⚡ AI 자동' : '✨ AI 글 작성'}
            </button>
            <button
              type="button"
              className={`m7-btn m7-btn--half m7-btn--meaning${showMeaningGrid ? ' is-active' : ''}`}
              disabled={busy}
              onClick={onToggleMeaning}
            >
              💭 나의 의미
            </button>
          </div>

          {showMeaningGrid && (
            <div className="m7-meaning-grid">
              <p className="m7-meaning-grid__lead">이 사진에 담고 싶은 마음·기억·의미를 적어 주세요.</p>
              <textarea
                ref={meaningRef}
                className="m7-meaning-grid__input"
                rows={4}
                value={userMeaning}
                onChange={e => setUserMeaning(e.target.value)}
                placeholder="예: 우리 아들 첫 학교 사진, 그때 참 작았는데… 지금 보면 그리워요"
                disabled={busy}
              />
              <button
                type="button"
                className="m7-btn m7-btn--primary m7-btn--xl"
                disabled={busy || !userMeaning.trim()}
                onClick={onStartWithMeaning}
              >
                ✨ 이 의미로 AI 글 작성
              </button>
            </div>
          )}

          <button type="button" className="m7-btn m7-btn--ghost" disabled={busy} onClick={resetAll}>
            ↩ 다시 고르기
          </button>
        </div>
      )}

      {step === 'ai' && (
        <div className="m7-loading">
          <div className="m7-spinner" aria-hidden />
          <p>{busy ? '업로드 · AI 처리 중…' : '준비 중…'}</p>
          <button
            type="button"
            className="m7-btn m7-btn--ghost"
            onClick={() => { abortRef.current = true; resetAll(); }}
          >
            ✕ 중단
          </button>
        </div>
      )}

      {step === 'review' && draft && (
        <div className="m7-review">
          <label className="m7-field">
            <span>카테고리</span>
            <select value={draft.categorySlug} onChange={e => setDraft({ ...draft, categorySlug: e.target.value })}>
              {SHOWCASE_CATS.map(c => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="m7-field">
            <span>제목</span>
            <input value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} />
          </label>
          <label className="m7-field">
            <span>요약</span>
            <textarea rows={2} value={draft.excerpt} onChange={e => setDraft({ ...draft, excerpt: e.target.value })} />
          </label>
          <button
            type="button"
            className="m7-link-btn m7-review__toggle"
            onClick={() => setShowAdvanced(v => !v)}
          >
            {showAdvanced ? '▲ 본문 접기' : '▼ 본문 편집 (고급)'}
          </button>
          {showAdvanced && (
            <label className="m7-field">
              <span>본문 HTML</span>
              <textarea rows={5} value={draft.body} onChange={e => setDraft({ ...draft, body: e.target.value })} />
            </label>
          )}
          <button type="button" className="m7-btn m7-btn--primary m7-btn--xl" disabled={busy} onClick={onPublish}>
            🚀 게시하기
          </button>
        </div>
      )}
    </div>
  );
}
