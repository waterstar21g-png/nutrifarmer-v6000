import { put } from '@vercel/blob';
import { getDb } from '@/lib/v5000-auth/db';
import { validateUploadMime, resolveUploadMime } from './upload-mime';
import { v5000Media } from './schema';

const MAX_BYTES = 15 * 1024 * 1024;

export function isBlobConfigured(): boolean {
  return !!(
    process.env.BLOB_READ_WRITE_TOKEN?.trim() ||
    process.env.BLOB_STORE_ID?.trim()
  );
}

function safeFilename(name: string): string {
  return name.replace(/[^\w.\uAC00-\uD7A3-]/g, '_').slice(0, 120) || 'file';
}

export interface UploadResult {
  id: number;
  url: string;
  key: string;
  mime: string;
  alt: string;
  sizeBytes: number;
}

export async function uploadMediaBlob(
  file: File,
  uploaderId: number,
  alt?: string,
): Promise<UploadResult> {
  if (!isBlobConfigured()) {
    throw new Error('blob_unconfigured');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('file_too_large');
  }
  const mime = validateUploadMime(resolveUploadMime(file), file.name);

  const pathname = `media/${uploaderId}/${Date.now()}-${safeFilename(file.name)}`;
  const altText = alt?.trim() || file.name.replace(/\.[^.]+$/, '');

  const blob = await put(pathname, file, {
    access: 'public',
    addRandomSuffix: false,
    contentType: mime,
  });

  const db = getDb();
  const rows = await db
    .insert(v5000Media)
    .values({
      r2Key: pathname,
      publicUrl: blob.url,
      mime,
      alt: altText,
      sizeBytes: file.size,
      uploaderId,
    })
    .returning();

  const row = rows[0]!;
  return {
    id: row.id,
    url: row.publicUrl,
    key: row.r2Key,
    mime: row.mime,
    alt: row.alt ?? altText,
    sizeBytes: row.sizeBytes ?? file.size,
  };
}
