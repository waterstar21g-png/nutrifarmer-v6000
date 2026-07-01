'use client';

import { useEffect } from 'react';
import { APP_VERSION } from '@/lib/app-version';

/** 배포 버전 변경 시 1회 강제 새로고침 — 옛 JS 번들 제거 */
export function AppVersionGuard() {
  useEffect(() => {
    const key = 'nf-v6000-app-version';
    try {
      const prev = localStorage.getItem(key);
      if (prev && prev !== APP_VERSION) {
        localStorage.setItem(key, APP_VERSION);
        window.location.reload();
        return;
      }
      localStorage.setItem(key, APP_VERSION);
    } catch {
      /* private mode */
    }
  }, []);

  return null;
}
