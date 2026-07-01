'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ConfirmSheet } from '@/components/m7/ConfirmSheet';
import {
  bodyHtmlToPlainText,
  extractImageBlocks,
  plainTextToBodyHtml,
} from '@/lib/single-post-body';

interface Props {
  postId: number;
  categorySlug: string;
  isOwner: boolean;
  variant?: 'single' | 'card';
  initialFullBody?: string;
  afterDeleteTo?: string;
}

export function MobilePostOwnerMenu({
  postId,
  categorySlug,
  isOwner,
  variant = 'single',
  initialFullBody,
  afterDeleteTo,
}: Props) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const imageBlocksRef = useRef('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editText, setEditText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('pointerdown', onDocClick);
    return () => document.removeEventListener('pointerdown', onDocClick);
  }, []);

  const openEdit = useCallback(async () => {
    setMenuOpen(false);
    setError(null);
    setBusy(true);
    try {
      let fullBody = initialFullBody;
      if (!fullBody) {
        const r = await fetch(`/api/v5000/posts/${postId}`, { credentials: 'same-origin' });
        const data = await r.json();
        if (!r.ok || !data.ok) throw new Error(data.message ?? '글을 불러오지 못했습니다.');
        fullBody = data.post.body as string;
      }
      imageBlocksRef.current = extractImageBlocks(fullBody);
      setEditText(bodyHtmlToPlainText(fullBody));
      setEditOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : '글을 불러오지 못했습니다.');
    } finally {
      setBusy(false);
    }
  }, [initialFullBody, postId]);

  async function onDelete() {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`/api/v5000/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      const data = await r.json();
      if (!r.ok || !data.ok) throw new Error(data.message ?? '삭제 실패');
      if (afterDeleteTo) router.push(afterDeleteTo);
      else router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : '삭제 실패');
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  }

  async function onSaveEdit() {
    setBusy(true);
    setError(null);
    try {
      const body = plainTextToBodyHtml(editText, imageBlocksRef.current);
      const r = await fetch(`/api/v5000/posts/${postId}`, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      const data = await r.json();
      if (!r.ok || !data.ok) throw new Error(data.message ?? '저장 실패');
      imageBlocksRef.current = extractImageBlocks(body);
      setEditOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 실패');
    } finally {
      setBusy(false);
    }
  }

  if (!isOwner) return null;

  const toolbarClass = variant === 'card' ? 'm6-post-card__toolbar' : 'm6-single__toolbar';

  return (
    <>
      <div className={toolbarClass} ref={menuRef}>
        <button
          type="button"
          className="m6-single__menu-btn"
          aria-label="글 메뉴"
          aria-expanded={menuOpen}
          onClick={e => { e.preventDefault(); e.stopPropagation(); setMenuOpen(v => !v); }}
        >
          ⋮
        </button>
        {menuOpen && (
          <div className="m6-single__menu" role="menu">
            <button type="button" role="menuitem" onClick={e => { e.stopPropagation(); void openEdit(); }}>수정</button>
            <button
              type="button"
              role="menuitem"
              className="is-danger"
              onClick={e => { e.stopPropagation(); setConfirmDelete(true); setMenuOpen(false); }}
            >
              삭제
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className={variant === 'card' ? 'm6-post-card__error' : 'm6-single__error'} role="alert">{error}</p>
      )}

      <ConfirmSheet
        open={confirmDelete}
        title="게시글 삭제"
        message="이 게시글을 삭제할까요? 되돌릴 수 없습니다."
        confirmLabel="삭제"
        cancelLabel="취소"
        onConfirm={onDelete}
        onCancel={() => setConfirmDelete(false)}
      />

      {editOpen && (
        <div className="m6-single-edit" role="dialog" aria-modal="true" aria-labelledby="m6-edit-title">
          <button type="button" className="m6-single-edit__backdrop" aria-label="닫기" onClick={() => setEditOpen(false)} />
          <div className="m6-single-edit__panel">
            <h2 id="m6-edit-title" className="m6-single-edit__title">본문 수정</h2>
            <textarea
              className="m6-single-edit__area"
              value={editText}
              onChange={e => setEditText(e.target.value)}
              rows={10}
              disabled={busy}
            />
            <div className="m6-single-edit__actions">
              <button type="button" className="m7-btn" onClick={() => setEditOpen(false)} disabled={busy}>취소</button>
              <button type="button" className="m7-btn m7-btn--primary" onClick={onSaveEdit} disabled={busy}>저장</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
