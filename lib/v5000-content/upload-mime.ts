/** 업로드 MIME — 브라우저 type 비어 있을 때 확장자로 보정 (파일/자료 탭) */

const EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
  txt: 'text/plain',
  csv: 'text/csv',
  zip: 'application/zip',
  mp4: 'video/mp4',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  rtf: 'application/rtf',
  hwp: 'application/x-hwp',
  hwpx: 'application/hwp+zip',
};

export const UPLOAD_ALLOWED_MIME = new Set<string>([
  ...Object.values(EXT_TO_MIME),
  'application/haansofthwp',
  'application/vnd.hancom.hwp',
  'application/vnd.hancom.hwpx',
]);

function extOf(filename: string): string {
  const i = filename.lastIndexOf('.');
  return i >= 0 ? filename.slice(i + 1).toLowerCase() : '';
}

/** File.type 이 비어 있거나 octet-stream 일 때 확장자로 보정 */
export function resolveUploadMime(file: File): string {
  const raw = file.type?.trim();
  if (raw && raw !== 'application/octet-stream') return raw;
  const fromExt = EXT_TO_MIME[extOf(file.name)];
  return fromExt ?? raw ?? 'application/octet-stream';
}

export function validateUploadMime(mime: string, filename: string): string {
  let resolved = mime;
  if (!UPLOAD_ALLOWED_MIME.has(resolved)) {
    const fromExt = EXT_TO_MIME[extOf(filename)];
    if (fromExt) resolved = fromExt;
  }
  if (!UPLOAD_ALLOWED_MIME.has(resolved)) {
    throw new Error('unsupported_type');
  }
  return resolved;
}
