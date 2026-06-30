'use client';

import type { V7000LastPost } from '@/lib/v7000-config';
import { V7000_LAST_POST_KEY } from '@/lib/v7000-config';

export function saveLastPost(post: Omit<V7000LastPost, 'at'>): void {
  if (typeof window === 'undefined') return;
  const data: V7000LastPost = { ...post, at: Date.now() };
  window.localStorage.setItem(V7000_LAST_POST_KEY, JSON.stringify(data));
}

export function readLastPost(): V7000LastPost | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(V7000_LAST_POST_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as V7000LastPost;
  } catch {
    return null;
  }
}
