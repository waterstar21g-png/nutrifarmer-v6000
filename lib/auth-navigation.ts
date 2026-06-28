import { POST_LOGIN_REDIRECT } from '@/lib/v5000-auth/config';

/** 글쓰기 팝업 창 이름 (openWriteWindow) */
export const WRITE_WINDOW_NAME = 'nf-v5000-write';

/** 로그인 팝업 창 이름 — 전체화면(최대화) 크기 */
export const LOGIN_WINDOW_NAME = 'nf-v5000-login';

export function isWritePopup(): boolean {
  return typeof window !== 'undefined' && window.name === WRITE_WINDOW_NAME;
}

export function isLoginPopup(): boolean {
  return typeof window !== 'undefined' && window.name === LOGIN_WINDOW_NAME;
}

/** 브라우저 작업 영역 전체(최대화) 팝업 features */
export function maximizedPopupFeatures(): string {
  const width = Math.round(screen.availWidth);
  const height = Math.round(screen.availHeight);
  const left = 0;
  const top = 0;
  return [
    `width=${width}`,
    `height=${height}`,
    `left=${left}`,
    `top=${top}`,
    'resizable=yes',
    'scrollbars=yes',
  ].join(',');
}

/** 로그인·인증 페이지 — 전체화면 크기 팝업 */
export function openLoginWindow(path: string): Window | null {
  if (typeof window === 'undefined') return null;
  const win = window.open(path, LOGIN_WINDOW_NAME, maximizedPopupFeatures());
  if (win) win.focus();
  return win;
}

function focusOpener(opener: Window): boolean {
  try {
    if (opener.closed) return false;
    opener.focus();
    return true;
  } catch {
    return false;
  }
}

function navigateOpener(opener: Window, url: string): boolean {
  try {
    if (opener.closed) return false;
    opener.location.href = url;
    return true;
  } catch {
    return false;
  }
}

function clearOpenerWriteRef(): void {
  try {
    if (window.opener && !window.opener.closed) {
      window.opener.__nfWritePopup = null;
      window.opener.__nfWriteHiddenAt = undefined;
    }
    sessionStorage.removeItem('nf-write-hidden-at');
  } catch {
    /* ignore */
  }
}

function closeSelfOrNavigate(fallbackUrl: string): void {
  window.close();
  window.setTimeout(() => {
    if (!window.closed) window.location.href = fallbackUrl;
  }, 150);
}

/** 로그인·가입 성공 — 메인은 기존 창(opener)에, 팝업이면 닫기 */
export function navigateAfterLogin(target = POST_LOGIN_REDIRECT): void {
  if (typeof window === 'undefined') return;

  const opener = window.opener;
  if (opener && navigateOpener(opener, target)) {
    focusOpener(opener);
    closeSelfOrNavigate(target);
    return;
  }

  window.location.assign(target);
}

/** 로그인 창 [홈으로] — opener(메인)로 이동 후 팝업 닫기 */
export function navigateToHomeFromLogin(homePath = POST_LOGIN_REDIRECT): void {
  if (typeof window === 'undefined') return;

  const opener = window.opener;
  if (opener && navigateOpener(opener, homePath)) {
    focusOpener(opener);
    closeSelfOrNavigate(homePath);
    return;
  }

  window.location.assign(homePath);
}

/** 글쓰기 창 로그아웃 — 메인(opener)으로 이동 후 글쓰기 창 닫기 */
export function navigateAfterWriteLogout(homePath = POST_LOGIN_REDIRECT): void {
  if (typeof window === 'undefined') return;

  clearOpenerWriteRef();
  const opener = window.opener;
  if (opener && navigateOpener(opener, homePath)) {
    focusOpener(opener);
    closeSelfOrNavigate(homePath);
    return;
  }

  window.location.assign(homePath);
}

/** 글쓰기 팝업에서 인증 — 전체화면 로그인 팝업, 글쓰기 창 닫기 */
export function openAuthFromWritePopup(path: string): void {
  if (typeof window === 'undefined') return;

  clearOpenerWriteRef();
  if (openLoginWindow(path)) {
    closeSelfOrNavigate(path);
    return;
  }

  window.location.href = path;
}
