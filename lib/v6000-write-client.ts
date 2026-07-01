'use client';

import type { VisionDraftResult } from '@/lib/ai-vision-draft';

export interface UploadedMedia {
  id: number;
  url: string;
  alt?: string;
}

export interface PublishedPost {
  id: number;
  slug: string;
  categorySlug: string;
  title: string;
}

async function parseJson<T>(r: Response): Promise<T & { ok?: boolean; message?: string; code?: string }> {
  const data = (await r.json()) as T & { ok?: boolean; message?: string; code?: string };
  if (r.status === 401) {
    const code = data.code ?? 'unauthorized';
    throw new Error(code === 'session_idle' ? 'SESSION_IDLE' : 'LOGIN_REQUIRED');
  }
  if (!r.ok || data.ok === false) {
    throw new Error(data.message ?? `HTTP ${r.status}`);
  }
  return data;
}

export async function uploadPhoto(file: File, alt?: string): Promise<UploadedMedia> {
  const fd = new FormData();
  fd.append('file', file);
  if (alt) fd.append('alt', alt);
  const r = await fetch('/api/v5000/media', {
    method: 'POST',
    credentials: 'same-origin',
    body: fd,
  });
  const data = await parseJson<{ id: number; url: string; alt?: string }>(r);
  return { id: data.id, url: data.url, alt: data.alt };
}

export async function requestVisionDraft(input: {
  imageUrls: string[];
  hint?: string;
  userIntent?: string;
  mergeMode?: 'single' | 'multi';
}): Promise<VisionDraftResult> {
  const r = await fetch('/api/v5000/ai/vision-draft', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await parseJson<{ draft: VisionDraftResult }>(r);
  return data.draft;
}

export async function publishPost(input: {
  title: string;
  body: string;
  excerpt: string;
  categorySlug: string;
  status?: 'draft' | 'publish';
}): Promise<PublishedPost> {
  const r = await fetch('/api/v5000/posts', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...input, status: input.status ?? 'publish' }),
  });
  const data = await parseJson<{ post: PublishedPost }>(r);
  return data.post;
}
