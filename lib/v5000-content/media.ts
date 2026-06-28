import { isBlobConfigured, uploadMediaBlob } from './blob';
import {
  isR2AuthError,
  isR2Configured,
  uploadMedia as uploadMediaR2,
  type UploadResult,
} from './r2';

export type { UploadResult };

export function isMediaStorageConfigured(): boolean {
  return isR2Configured() || isBlobConfigured();
}

/** R2 우선 — 인증 실패 시 Vercel Blob 폴백, 없으면 Blob 단독 */
export async function uploadMedia(
  file: File,
  uploaderId: number,
  alt?: string,
): Promise<UploadResult> {
  if (isR2Configured()) {
    try {
      return await uploadMediaR2(file, uploaderId, alt);
    } catch (err) {
      if (isR2AuthError(err) && isBlobConfigured()) {
        console.warn('[v5000-media] R2 auth failed — falling back to Vercel Blob');
        return uploadMediaBlob(file, uploaderId, alt);
      }
      throw err;
    }
  }
  if (isBlobConfigured()) {
    return uploadMediaBlob(file, uploaderId, alt);
  }
  throw new Error('storage_unconfigured');
}
