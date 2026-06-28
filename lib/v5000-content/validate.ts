import { isValidCategorySlug } from './categories';

export type PostValidateResult = { ok: true } | { ok: false; code: string };

export function validatePostInput(input: {
  title?: string;
  body?: string;
  excerpt?: string;
  categorySlug?: string;
  status?: string;
}): PostValidateResult {
  if (!input.categorySlug?.trim()) {
    return { ok: false, code: 'missing_category' };
  }
  if (!isValidCategorySlug(input.categorySlug.trim())) {
    return { ok: false, code: 'invalid_category' };
  }
  if (input.status && input.status !== 'draft' && input.status !== 'publish') {
    return { ok: false, code: 'invalid_status' };
  }
  return { ok: true };
}

export const POST_ERRORS: Record<string, string> = {
  missing_category: '카테고리를 선택해 주세요.',
  invalid_category: '유효하지 않은 카테고리입니다.',
  invalid_status: '상태 값이 올바르지 않습니다.',
  not_found: '글을 찾을 수 없습니다.',
  forbidden: '이 글을 수정할 권한이 없습니다.',
  unauthorized: '로그인이 필요합니다.',
  r2_unconfigured: '파일 업로드 저장소가 설정되지 않았습니다. URL로 이미지를 삽입해 주세요.',
  file_too_large: '파일 크기는 15MB 이하여야 합니다.',
  unsupported_type: '지원하지 않는 파일 형식입니다. PDF, DOC/DOCX, HWP, XLS/XLSX, ZIP, TXT, MP4 등을 사용해 주세요.',
  missing_file: '업로드할 파일을 선택해 주세요.',
  upload_failed: '파일 업로드에 실패했습니다. 잠시 후 다시 시도해 주세요.',
};

export function postErrorMessage(code?: string): string {
  if (!code) return '요청을 처리하지 못했습니다.';
  return POST_ERRORS[code] ?? '요청을 처리하지 못했습니다.';
}
