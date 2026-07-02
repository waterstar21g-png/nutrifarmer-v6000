'use client';

import type { VisionDraftResult } from '@/lib/ai-vision-draft';
import type { PhotoFlowMode } from '@/lib/v7000-config';
import type { SuggestedImage } from '@/lib/write-image-suggest';

export const PHOTO_DRAFT_KEY = 'nf-v7000-photo-draft';
export const TEXT_DRAFT_KEY = 'nf-v7000-text-draft';
const PHOTO_IDB = 'nf-v7000-photo-idb';
const PHOTO_STORE = 'files';
const DRAFT_MAX_AGE_MS = 4 * 60 * 60 * 1000;

export interface PhotoFlowDraft {
  v: 1;
  mode: PhotoFlowMode;
  step: 'confirm' | 'review';
  draft: VisionDraftResult | null;
  uploadedUrls: string[];
  userMeaning: string;
  savedAt: number;
}

export interface TextFlowDraft {
  v: 1;
  step: 'write' | 'images';
  title: string;
  excerpt: string;
  bodyText: string;
  categorySlug: string;
  images: SuggestedImage[];
  pickedUrl: string | null;
  savedAt: number;
}

export function photoReturnPath(mode: PhotoFlowMode): string {
  if (mode === 'multi') return '/photo?mode=multi';
  if (mode === 'continuous') return '/photo?mode=continuous';
  return '/photo';
}

export function loginPathFor(returnPath: string): string {
  return `/login?redirect_to=${encodeURIComponent(returnPath)}`;
}

function isFresh(savedAt: number): boolean {
  return Date.now() - savedAt < DRAFT_MAX_AGE_MS;
}

export function savePhotoFlowDraft(draft: Omit<PhotoFlowDraft, 'v' | 'savedAt'>): void {
  if (typeof window === 'undefined') return;
  const data: PhotoFlowDraft = { v: 1, ...draft, savedAt: Date.now() };
  sessionStorage.setItem(PHOTO_DRAFT_KEY, JSON.stringify(data));
}

export function readPhotoFlowDraft(mode: PhotoFlowMode): PhotoFlowDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(PHOTO_DRAFT_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as PhotoFlowDraft;
    if (data.v !== 1 || data.mode !== mode || !isFresh(data.savedAt)) {
      sessionStorage.removeItem(PHOTO_DRAFT_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function clearPhotoFlowDraft(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(PHOTO_DRAFT_KEY);
}

export function saveTextFlowDraft(draft: Omit<TextFlowDraft, 'v' | 'savedAt'>): void {
  if (typeof window === 'undefined') return;
  const data: TextFlowDraft = { v: 1, ...draft, savedAt: Date.now() };
  sessionStorage.setItem(TEXT_DRAFT_KEY, JSON.stringify(data));
}

export function readTextFlowDraft(): TextFlowDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(TEXT_DRAFT_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as TextFlowDraft;
    if (data.v !== 1 || !isFresh(data.savedAt)) {
      sessionStorage.removeItem(TEXT_DRAFT_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function clearTextFlowDraft(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(TEXT_DRAFT_KEY);
}

function openPhotoIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(PHOTO_IDB, 1);
    req.onerror = () => reject(req.error);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(PHOTO_STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
  });
}

/** 로그인 이동 전 — 갤러리에서 고른 원본 파일 보관 */
export async function stashPhotoFiles(files: File[]): Promise<void> {
  if (typeof window === 'undefined' || !files.length) return;
  const db = await openPhotoIdb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(PHOTO_STORE, 'readwrite');
    const store = tx.objectStore(PHOTO_STORE);
    store.clear();
    for (const file of files) {
      store.put({ id: `${file.name}-${file.size}-${file.lastModified}`, file });
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function restorePhotoFiles(): Promise<File[]> {
  if (typeof window === 'undefined') return [];
  try {
    const db = await openPhotoIdb();
    const files = await new Promise<File[]>((resolve, reject) => {
      const tx = db.transaction(PHOTO_STORE, 'readonly');
      const req = tx.objectStore(PHOTO_STORE).getAll();
      req.onsuccess = () => {
        const rows = (req.result ?? []) as { id: string; file: File }[];
        resolve(rows.map(r => r.file).filter(Boolean));
      };
      req.onerror = () => reject(req.error);
    });
    db.close();
    return files;
  } catch {
    return [];
  }
}

export async function clearStashedPhotoFiles(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const db = await openPhotoIdb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(PHOTO_STORE, 'readwrite');
      tx.objectStore(PHOTO_STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    /* ignore */
  }
}

export function isAuthRedirectError(msg: string): boolean {
  return msg === 'LOGIN_REQUIRED' || msg === 'SESSION_IDLE';
}
