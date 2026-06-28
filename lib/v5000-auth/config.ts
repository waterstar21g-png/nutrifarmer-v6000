/** V5000 Native Auth — config (무 WordPress) */

function envSiteUrl(): string {
  const direct = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (direct) return direct;
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return vercel.startsWith('http') ? vercel : `https://${vercel}`;
  return 'https://nutrifarmer-v5000.vercel.app';
}

export const SITE_URL = envSiteUrl();

export const SESSION_COOKIE = 'nf-v5000-session';

export const AUTH_API_BASE = '/api/v5000/auth';

export const MIN_PASSWORD_LENGTH = 4;

export const RESET_CODE_TTL_MS = 30 * 60 * 1000;

export const RESET_MAX_ATTEMPTS = 5;

export const AUTH_ID_LABEL = 'ID : 이름 · 별명 · 이메일';

export const LOGIN_HEADING = '함께 성장하고 기록하고 만들어요';
export const LOGIN_LEAD = '이름 · 별명 · 이메일 중 하나로 로그인하세요.';

export const REGISTER_HEADING = '회원가입';
export const REGISTER_LEAD = '별명·ID와 이메일로 가입한 뒤 바로 글쓰기를 시작해 보세요.';

export const FIND_HEADING = '로그인 정보가 기억나지 않으세요?';
export const FIND_LEAD = '가입 이메일을 입력하면 이름·별명·ID 안내 메일을 보내드립니다.';

export const LOST_HEADING = '비밀번호를 잊으셨나요?';
export const LOST_LEAD = '이름 · 별명 · 이메일을 입력하면 6자리 확인 코드를 보내드립니다.';

export const VERIFY_HEADING = '확인 코드를 입력해요';
export const VERIFY_LEAD = '메일로 받은 6자리 확인 코드를 입력하세요.';

export const RESET_HEADING = '새 비밀번호를 설정해요';
export const RESET_LEAD = '새 비밀번호를 입력하고 저장해 주세요.';

export const LOGIN_ERRORS: Record<string, string> = {
  empty: '필수 항목을 모두 입력해 주세요.',
  empty_login: 'ID(이름·별명·이메일)를 입력해 주세요.',
  empty_password: '비밀번호를 입력해 주세요.',
  empty_nickname: '로그인 ID(별명)를 입력해 주세요.',
  weak_nickname_ko: '한글 별명은 2자 이상 입력해 주세요.',
  weak_nickname_en: '영문·숫자 ID는 6자 이상 입력해 주세요.',
  weak_nickname: '별명은 2자 이상 입력해 주세요.',
  login_id_taken: '이미 사용 중인 로그인 ID입니다.',
  email_exists: '이미 가입된 이메일입니다. 로그인하거나 비밀번호 찾기를 이용해 주세요.',
  email_limit: '이 이메일로는 최대 4명까지 가입할 수 있습니다. 로그인 ID로 구분해 로그인해 주세요.',
  not_found: '등록된 이름·별명·이메일을 찾을 수 없습니다.',
  ambiguous: '여러 계정이 검색되었습니다. 로그인할 ID를 선택해 주세요.',
  user_not_found: '사용자 ID가 없습니다. 확인 바랍니다 !',
  incorrect_password: '비밀번호가 올바르지 않습니다.',
  must_reset_password:
    '비밀번호 재설정이 필요합니다. 비밀번호 찾기에서 새 비밀번호를 설정해 주세요.',
  invalid_email: '올바른 이메일 주소 형식이 아닙니다.',
  invalid_code: '확인 코드가 올바르지 않습니다. 메일의 6자리 코드를 다시 입력해 주세요.',
  code_expired: '확인 코드가 만료되었습니다. 비밀번호 찾기에서 다시 요청해 주세요.',
  mismatch: '비밀번호가 서로 일치하지 않습니다.',
  weak: '비밀번호는 4자 이상으로 설정해 주세요.',
  mail_failed: '메일 발송에 실패했습니다. 잠시 후 다시 시도하거나 관리자에게 문의해 주세요.',
  rate_limited: '요청이 너무 많습니다. 15분 후 다시 시도해 주세요.',
  session_expired: '로그인 세션이 만료되었습니다. 다시 로그인해 주세요.',
  database_unconfigured: '데이터베이스가 설정되지 않았습니다. 관리자에게 문의해 주세요.',
  database_error: '데이터베이스 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
};

export function loginErrorMessage(code?: string): string {
  if (!code) return '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.';
  return LOGIN_ERRORS[code] ?? '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.';
}

/** UI 표시용 회원 등급 (게시글 수 + admin 역할) */
export type MemberGrade = 'admin' | 'regular' | 'star';

export function userMemberGrade(
  role: string | null | undefined,
  publishedPostCount = 0,
): MemberGrade {
  if (role === 'admin') return 'admin';
  if (publishedPostCount >= 2) return 'regular';
  return 'star';
}

export function userMemberGradeLabel(
  role: string | null | undefined,
  publishedPostCount = 0,
): string {
  const grade = userMemberGrade(role, publishedPostCount);
  if (grade === 'admin') return '관리자';
  if (grade === 'regular') return '일반회원';
  return '샛별회원';
}

/** 로그인·가입 성공 후 기본 이동 경로 (redirect_to 없을 때) */
export const POST_LOGIN_REDIRECT = '/';

export function postLoginRedirectPath(): string {
  return POST_LOGIN_REDIRECT;
}

/** 로그인 페이지 URL의 redirect_to (미로그인 시 복귀용) */
export function resolveRedirectPath(raw?: string | null): string {
  if (!raw) return POST_LOGIN_REDIRECT;
  try {
    if (raw.startsWith('/')) return raw.split('?')[0] || POST_LOGIN_REDIRECT;
    const url = new URL(raw);
    const site = new URL(SITE_URL);
    if (url.origin === site.origin) return url.pathname || POST_LOGIN_REDIRECT;
  } catch {
    /* ignore */
  }
  return POST_LOGIN_REDIRECT;
}

export const SESSION_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};
