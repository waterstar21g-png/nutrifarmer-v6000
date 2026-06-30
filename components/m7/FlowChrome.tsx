'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ConfirmSheet } from './ConfirmSheet';

interface Props {
  title: string;
  subtitle?: string;
  stepIndex: number;
  stepLabels: readonly string[];
  busy?: boolean;
  dirty?: boolean;
  onBack?: () => void;
  onAbort?: () => void;
}

export function FlowChrome({
  title,
  subtitle,
  stepIndex,
  stepLabels,
  busy = false,
  dirty = false,
  onBack,
  onAbort,
}: Props) {
  const router = useRouter();
  const [confirmHome, setConfirmHome] = useState(false);
  const [confirmAbort, setConfirmAbort] = useState(false);

  function goHome() {
    if (dirty || busy) {
      setConfirmHome(true);
      return;
    }
    router.push('/upload');
  }

  function abortFlow() {
    if (dirty || busy) {
      setConfirmAbort(true);
      return;
    }
    if (onAbort) onAbort();
    else router.push('/upload');
  }

  return (
    <>
      <header className="m7-chrome">
        <div className="m7-chrome__row">
          {onBack ? (
            <button type="button" className="m7-chrome__icon" onClick={onBack} disabled={busy} aria-label="이전">
              ←
            </button>
          ) : (
            <Link href="/upload" className="m7-chrome__icon" aria-label="사진올리기">⌂</Link>
          )}
          <div className="m7-chrome__title-wrap">
            <h1 className="m7-chrome__title">{title}</h1>
            {subtitle && <p className="m7-chrome__sub">{subtitle}</p>}
          </div>
          <button
            type="button"
            className="m7-chrome__icon m7-chrome__icon--abort"
            onClick={abortFlow}
            disabled={false}
            aria-label="중단"
          >
            ✕
          </button>
        </div>

        <nav className="m7-steps" aria-label="진행 단계">
          {stepLabels.map((label, i) => (
            <span
              key={label}
              className={`m7-steps__item${i === stepIndex ? ' is-current' : ''}${i < stepIndex ? ' is-done' : ''}`}
            >
              <span className="m7-steps__dot">{i < stepIndex ? '✓' : i + 1}</span>
              <span className="m7-steps__label">{label}</span>
            </span>
          ))}
        </nav>

        <div className="m7-chrome__home-row">
          <button type="button" className="m7-link-btn" onClick={goHome}>← 홈으로</button>
        </div>
      </header>

      <ConfirmSheet
        open={confirmHome}
        title="홈으로 돌아갈까요?"
        message="진행 중인 작업은 저장되지 않습니다."
        confirmLabel="홈으로"
        cancelLabel="계속 작성"
        onConfirm={() => { setConfirmHome(false); router.push('/upload'); }}
        onCancel={() => setConfirmHome(false)}
      />

      <ConfirmSheet
        open={confirmAbort}
        title="작업을 중단할까요?"
        message="지금까지 입력·선택한 내용이 사라집니다."
        confirmLabel="중단"
        cancelLabel="계속"
        onConfirm={() => {
          setConfirmAbort(false);
          if (onAbort) onAbort();
          else router.push('/upload');
        }}
        onCancel={() => setConfirmAbort(false)}
      />
    </>
  );
}
