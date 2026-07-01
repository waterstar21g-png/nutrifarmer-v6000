'use client';

import { useEffect, useState } from 'react';
import { readAutoMode, toggleAutoMode } from '@/lib/v6000-auto-mode';

interface Props {
  compact?: boolean;
  showHint?: boolean;
}

export function AutoModeToggle({ compact = false, showHint = false }: Props) {
  const [on, setOn] = useState(false);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    setOn(readAutoMode());
  }, []);

  function handleToggle() {
    const next = toggleAutoMode();
    setOn(next);
    if (next && showHint) setHint(true);
  }

  if (compact) {
    return (
      <button
        type="button"
        className={`m7-auto-pill${on ? ' is-on' : ''}`}
        onClick={handleToggle}
        aria-pressed={on}
      >
        ⚡ 자동모드 {on ? 'ON' : 'OFF'}
      </button>
    );
  }

  return (
    <div className="m7-auto">
      <button
        type="button"
        className={`m7-auto__btn${on ? ' is-on' : ''}`}
        onClick={handleToggle}
        aria-pressed={on}
      >
        <span className="m7-auto__label">자동모드</span>
        <span className="m7-auto__state">{on ? 'ON' : 'OFF'}</span>
      </button>
      {hint && on && (
        <p className="m7-auto__hint">
          자동모드 ON — AI 결과 확인·게시가 자동으로 진행됩니다.
          <button type="button" className="m7-link-btn" onClick={() => setHint(false)}>닫기</button>
        </p>
      )}
    </div>
  );
}
