'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SHOWCASE_CATS } from '@/lib/site-data';
import { WRITE_FLOW_STEPS } from '@/lib/v6000-write-config';
import { publishPost } from '@/lib/v6000-write-client';
import {
  clearWriteFlowDraft,
  isAuthRedirectError,
  loginPathFor,
  readWriteFlowDraft,
  saveWriteFlowDraft,
} from '@/lib/v6000-write-draft';
import { saveLastPost } from '@/lib/v6000-write-last-post';
import { FlowChrome } from './FlowChrome';

const PC_WRITE_URL =
  process.env.NEXT_PUBLIC_V5000_WRITE_URL?.trim() || 'https://www.nutrifarmer.kr/write';

export function MobileWriteFlow() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [categorySlug, setCategorySlug] = useState('daily-life');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restoreNotice, setRestoreNotice] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);

  const dirty = title.trim().length > 0 || bodyText.trim().length > 0 || excerpt.trim().length > 0;

  useEffect(() => {
    if (draftRestored) return;
    const saved = readWriteFlowDraft();
    if (saved) {
      setTitle(saved.title);
      setExcerpt(saved.excerpt);
      setBodyText(saved.bodyText);
      setCategorySlug(saved.categorySlug);
      clearWriteFlowDraft();
      setRestoreNotice('로그인 전 작성 중이던 글을 이어서 불러왔습니다.');
    }
    setDraftRestored(true);
  }, [draftRestored]);

  function saveDraftForLogin() {
    saveWriteFlowDraft({ title, excerpt, bodyText, categorySlug });
  }

  function redirectLogin() {
    saveDraftForLogin();
    router.push(loginPathFor('/write'));
  }

  async function onPublish() {
    if (!title.trim()) {
      setError('제목을 입력하세요.');
      return;
    }
    if (!bodyText.trim()) {
      setError('본문을 입력하세요.');
      return;
    }

    const safeTitle = title.trim().replace(/"/g, '');
    const htmlBody = `<p>${bodyText.trim().replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;

    setBusy(true);
    setError(null);
    try {
      const post = await publishPost({
        title: title.trim(),
        body: htmlBody,
        excerpt: excerpt.trim() || title.trim(),
        categorySlug,
      });
      clearWriteFlowDraft();
      saveLastPost(post);
      router.push(
        `/done?category=${encodeURIComponent(post.categorySlug)}&slug=${encodeURIComponent(post.slug)}&pid=${post.id}&title=${encodeURIComponent(post.title)}`,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : '게시 실패';
      if (isAuthRedirectError(msg)) {
        redirectLogin();
        return;
      }
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="m7-flow">
      <FlowChrome
        title="✍️ 글쓰기"
        subtitle="제목·본문을 쓰고 바로 게시"
        stepIndex={0}
        stepLabels={WRITE_FLOW_STEPS}
        busy={busy}
        dirty={dirty}
      />

      {restoreNotice && (
        <p className="m7-toast" role="status">{restoreNotice}</p>
      )}

      {error && <p className="m7-error" role="alert">{error}</p>}

      <div className="m7-review">
        <label className="m7-field">
          <span>카테고리</span>
          <select value={categorySlug} onChange={e => setCategorySlug(e.target.value)} disabled={busy}>
            {SHOWCASE_CATS.map(c => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="m7-field">
          <span>제목</span>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="글 제목" disabled={busy} />
        </label>
        <label className="m7-field">
          <span>요약 (선택)</span>
          <textarea rows={2} value={excerpt} onChange={e => setExcerpt(e.target.value)} disabled={busy} />
        </label>
        <label className="m7-field">
          <span>본문</span>
          <textarea
            rows={8}
            value={bodyText}
            onChange={e => setBodyText(e.target.value)}
            placeholder="내용을 입력하세요"
            disabled={busy}
          />
        </label>
        <button type="button" className="m7-btn m7-btn--primary m7-btn--xl" disabled={busy} onClick={onPublish}>
          🚀 게시하기
        </button>
      </div>

      <div className="m7-actions" style={{ marginTop: '1rem' }}>
        <p className="m7-pick__hint">다른 방식으로 쓰기</p>
        <Link href="/text" className="m7-btn">2 · 글 → 사진 (AI)</Link>
        <Link href="/upload" className="m7-btn">사진올리기 메뉴</Link>
        <a href={PC_WRITE_URL} className="m7-btn m7-btn--ghost" target="_blank" rel="noopener noreferrer">
          PC 에디터 열기 →
        </a>
      </div>
    </div>
  );
}
