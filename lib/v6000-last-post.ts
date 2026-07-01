'use client';

import type { V6000LastPost } from '@/lib/v6000-write-config';
import { V6000_LAST_POST_KEY } from '@/lib/v6000-write-config';

export function saveLastPost(post: Omit<V6000LastPost, 'at'>): void {
  if (typeof window === 'undefined') return;
  const data: V6000LastPost = { ...post, at: Date.now() };
  window.localStorage.setItem(V6000_LAST_POST_KEY, JSON.stringify(data));
}

export function readLastPost(): V6000LastPost | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(V6000_LAST_POST_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as V6000LastPost;
  } catch {
    return null;
  }
}
