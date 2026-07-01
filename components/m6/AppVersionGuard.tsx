'use client';

import { useEffect } from 'react';
import { appVersionLabel, normalizeAppVersion } from '@/lib/app-version';

/** 배포 버전 변경 시 1회 강제 새로고침 — 옛 JS 번들 제거 */
export function AppVersionGuard() {
  useEffect(() => {
    const key = 'nf-v6000-app-version';
    const current = appVersionLabel();
    try {
      const prev = localStorage.getItem(key);
      if (prev && normalizeAppVersion(prev) !== normalizeAppVersion(current)) {
        localStorage.setItem(key, current);
        window.location.reload();
        return;
      }
      localStorage.setItem(key, current);
    } catch {
      /* private mode */
    }
  }, []);

  return null;
}
