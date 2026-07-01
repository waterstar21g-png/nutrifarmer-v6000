'use client';

import { V6000_AUTO_MODE_KEY } from '@/lib/v6000-write-config';

export function readAutoMode(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(V6000_AUTO_MODE_KEY) === '1';
}

export function writeAutoMode(on: boolean): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(V6000_AUTO_MODE_KEY, on ? '1' : '0');
}

export function toggleAutoMode(): boolean {
  const next = !readAutoMode();
  writeAutoMode(next);
  return next;
}
