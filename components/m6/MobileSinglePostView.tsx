'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { deletePost, updatePostBody } from '@/lib/v7000-client';
import { stripBodyPlain } from '@/lib/write-body-plain';

interface Props {
  postId: number;
  authorId: number;
  authorName: string;
  categorySlug: string;
  title: string;
  fullBodyHtml: string;
  displayImgUrl: string | null;
}

function removeFirstImageBlock(html: string): string {
  if (!html) return html;
  const figureWithImage = /<figure\b[^>]*>[\s\S]*?<img\b[\s\S]*?<\/figure>/i;
  if (figureWithImage.test(html)) {
    return html.replace(figureWithImage, '').trimStart();
  }
  return html.replace(/<img\b[^>]*>/i, '').trimStart();
}

function extractImagePrefix(html: string): string {
  const figure = html.match(/^(\s*<figure\b[^>]*>[\s\S]*?<\/figure>)/i);
  if (figure) return figure[1];
  const img = html.match(/^(\s*<img\b[^>]*>)/i);
  return img?.[1] ?? '';
}

function plainToBodyHtml(plain: string, imagePrefix: string): string {
  const text = plain.trim();
  if (!text) return imagePrefix;
  const paragraphs = text
    .split(/\n{2,}/)
    .map(block => block.trim())
    .filter(Boolean)
    .map(block => `<p>${block.replace(/\n/g, '<br>')}</p>`)
    .join('');
  return imagePrefix + paragraphs;
}

export function MobileSinglePostView({
  postId,
  authorId,
  authorName,
  categorySlug,
  title,
  fullBodyHtml: initialFullBodyHtml,
  displayImgUrl,
}: Props) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [fullBodyHtml, setFullBodyHtml] = useState(initialFullBodyHtml);
  const bodyHtml = displayImgUrl ? removeFirstImageBlock(fullBodyHtml) : fullBodyHtml;
  const [canManage, setCanManage] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editText, setEditText] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/v5000/auth/me', { credentials: 'same-origin' })
      .then(r => r.json())
      .then(data => {
        if (!data.loggedIn) return;
        const uid = data.user?.id as number | undefined;
        const role = data.user?.role as string | undefined;
        setCanManage(role === 'admin' || uid === authorId);
      })
      .catch(() => undefined);
  }, [authorId]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', onDoc);
    return () => document.removeEventListener('pointerdown', onDoc);
  }, [menuOpen]);

  const openEdit = useCallback(() => {
    setMenuOpen(false);
    const textHtml = displayImgUrl ? removeFirstImageBlock(fullBodyHtml) : fullBodyHtml;
    setEditText(stripBodyPlain(textHtml));
    setError('');
    setEditOpen(true);
  }, [displayImgUrl, fullBodyHtml]);

  const openDelete = useCallback(() => {
    setMenuOpen(false);
    setError('');
    setDeleteOpen(true);
  }, []);

  async function handleSaveEdit() {
    setBusy(true);
    setError('');
    try {
      const prefix = extractImagePrefix(fullBodyHtml);
      const nextBody = plainToBodyHtml(editText, prefix);
      await updatePostBody(postId, nextBody);
      setFullBodyHtml(nextBody);
      setEditOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    setError('');
    try {
      await deletePost(postId);
      router.push(`/${categorySlug}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제에 실패했습니다.');
      setBusy(false);
    }
  }

  const hasBodyText = bodyHtml.replace(/<[^>]+>/g, '').trim().length > 0;

  return (
    <>
      <div className="m6-single-header">
        {canManage && (
          <div className="m6-single-menu" ref={menuRef}>
            <button
              type="button"
              className="m6-single-menu__btn"
              aria-label="게시글 메뉴"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(v => !v)}
            >
              <span aria-hidden>⋮</span>
            </button>
            {menuOpen && (
              <div className="m6-single-menu__dropdown" role="menu">
                <button type="button" role="menuitem" onClick={openEdit}>수정</button>
                <button type="button" role="menuitem" className="is-danger" onClick={openDelete}>삭제</button>
              </div>
            )}
          </div>
        )}
        <h1 className="m6-single-header__title">{title}</h1>
      </div>

      {displayImgUrl && (
        <div className="m6-single-featured">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={displayImgUrl} alt={title} />
        </div>
      )}

      {hasBodyText && (
        <div
          className="m6-single-body wp-content"
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />
      )}

      <p className="m6-single-author">게시자 · {authorName}</p>

      {editOpen && (
        <div className="m6-single-popup" role="dialog" aria-modal="true" aria-labelledby="m6-edit-title">
          <button type="button" className="m6-single-popup__backdrop" aria-label="닫기" onClick={() => setEditOpen(false)} />
          <div className="m6-single-popup__panel">
            <h2 id="m6-edit-title" className="m6-single-popup__title">본문 수정</h2>
            <textarea
              className="m6-single-popup__textarea"
              value={editText}
              onChange={e => setEditText(e.target.value)}
              rows={8}
              autoFocus
            />
            {error && <p className="m6-single-popup__error" role="alert">{error}</p>}
            <div className="m6-single-popup__actions">
              <button type="button" className="m6-single-popup__btn" disabled={busy} onClick={() => setEditOpen(false)}>취소</button>
              <button type="button" className="m6-single-popup__btn m6-single-popup__btn--primary" disabled={busy} onClick={handleSaveEdit}>
                {busy ? '저장 중…' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteOpen && (
        <div className="m6-single-popup" role="dialog" aria-modal="true" aria-labelledby="m6-delete-title">
          <button type="button" className="m6-single-popup__backdrop" aria-label="닫기" onClick={() => setDeleteOpen(false)} />
          <div className="m6-single-popup__panel">
            <h2 id="m6-delete-title" className="m6-single-popup__title">게시글 삭제</h2>
            <p className="m6-single-popup__msg">이 게시글을 삭제할까요? 되돌릴 수 없습니다.</p>
            {error && <p className="m6-single-popup__error" role="alert">{error}</p>}
            <div className="m6-single-popup__actions">
              <button type="button" className="m6-single-popup__btn" disabled={busy} onClick={() => setDeleteOpen(false)}>취소</button>
              <button type="button" className="m6-single-popup__btn m6-single-popup__btn--danger" disabled={busy} onClick={handleDelete}>
                {busy ? '삭제 중…' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
