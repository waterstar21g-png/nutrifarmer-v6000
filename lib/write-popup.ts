import { POST_LOGIN_REDIRECT } from '@/lib/v5000-auth/config';
import { WRITE_WINDOW_NAME } from '@/lib/auth-navigation';

/** HOME 숨김 후 재사용 허용 시간 (5분) */
export const WRITE_POPUP_REUSE_MS = 5 * 60 * 1000;

const LS_WRITE_HIDDEN_AT = 'nf-write-hidden-at';

export interface WritePopupBounds {
  width: number;
  height: number;
  left: number;
  top: number;
}

const HIDDEN_BOUNDS: WritePopupBounds = {
  left: -24000,
  top: -24000,
  width: 240,
  height: 120,
};

declare global {
  interface Window {
    __nfWritePopup?: Window | null;
    __nfWriteBounds?: WritePopupBounds;
    __nfWriteHiddenAt?: number;
  }
}

export function defaultWritePopupBounds(): WritePopupBounds {
  const width = Math.min(1400, Math.round(screen.availWidth * 0.92));
  const height = Math.min(900, Math.round(screen.availHeight * 0.92));
  const left = Math.max(0, Math.round((screen.availWidth - width) / 2));
  const top = Math.max(0, Math.round((screen.availHeight - height) / 2));
  return { width, height, left, top };
}

export function writePopupFeatures(bounds: WritePopupBounds): string {
  return [
    `width=${bounds.width}`,
    `height=${bounds.height}`,
    `left=${bounds.left}`,
    `top=${bounds.top}`,
    'resizable=yes',
    'scrollbars=yes',
  ].join(',');
}

export function captureWritePopupBounds(popup: Window = window): WritePopupBounds {
  return {
    width: popup.outerWidth,
    height: popup.outerHeight,
    left: popup.screenX,
    top: popup.screenY,
  };
}

function readHiddenAt(host: Window): number | null {
  if (host.__nfWriteHiddenAt) return host.__nfWriteHiddenAt;
  try {
    const raw = sessionStorage.getItem(LS_WRITE_HIDDEN_AT);
    if (raw) {
      const t = Number(raw);
      if (!Number.isNaN(t)) return t;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function saveHiddenAt(host: Window): void {
  const t = Date.now();
  host.__nfWriteHiddenAt = t;
  try {
    sessionStorage.setItem(LS_WRITE_HIDDEN_AT, String(t));
  } catch {
    /* ignore */
  }
}

export function clearWriteHiddenAt(host: Window = window): void {
  try {
    host.__nfWriteHiddenAt = undefined;
    sessionStorage.removeItem(LS_WRITE_HIDDEN_AT);
  } catch {
    /* ignore */
  }
}

/** 숨김 후 5분 이내인지 */
export function isWriteReuseValid(host: Window = window): boolean {
  const hiddenAt = readHiddenAt(host);
  if (hiddenAt === null) return false;
  return Date.now() - hiddenAt <= WRITE_POPUP_REUSE_MS;
}

export function registerWritePopupOnOpener(popup: Window, opener: Window): void {
  try {
    opener.__nfWritePopup = popup;
  } catch {
    /* ignore */
  }
}

export function clearWritePopupRef(host: Window): void {
  try {
    host.__nfWritePopup = null;
  } catch {
    /* ignore */
  }
}

export function clearWritePopupSession(host: Window = window): void {
  clearWritePopupRef(host);
  clearWriteHiddenAt(host);
}

export function getWritePopupRef(host: Window = window): Window | null {
  try {
    const ref = host.__nfWritePopup;
    if (ref && !ref.closed) return ref;
    host.__nfWritePopup = null;
  } catch {
    /* ignore */
  }
  return null;
}

/** 숨겨진 글쓰기 팝업 복구 (이름으로 참조) */
export function findNamedWritePopup(): Window | null {
  try {
    const win = window.open('', WRITE_WINDOW_NAME);
    if (!win || win.closed) return null;
    const path = win.location.pathname;
    if (path === '/write' || path.endsWith('/write')) return win;
    if (path === '/' || win.location.href === 'about:blank') {
      win.close();
    }
  } catch {
    /* ignore */
  }
  return null;
}

function expireWritePopup(host: Window, popup: Window): void {
  clearWritePopupSession(host);
  try {
    popup.close();
  } catch {
    /* ignore */
  }
}

export function hideWritePopup(popup: Window = window): void {
  try {
    const bounds = captureWritePopupBounds(popup);
    popup.__nfWriteBounds = bounds;
    if (popup.opener && !popup.opener.closed) {
      popup.opener.__nfWriteBounds = bounds;
      registerWritePopupOnOpener(popup, popup.opener);
      saveHiddenAt(popup.opener);
    }
    popup.moveTo(HIDDEN_BOUNDS.left, HIDDEN_BOUNDS.top);
    popup.resizeTo(HIDDEN_BOUNDS.width, HIDDEN_BOUNDS.height);
  } catch {
    /* ignore */
  }
}

export function showWritePopup(popup: Window): void {
  try {
    const host = popup.opener && !popup.opener.closed ? popup.opener : window;
    const bounds =
      host.__nfWriteBounds ??
      popup.__nfWriteBounds ??
      defaultWritePopupBounds();
    popup.moveTo(bounds.left, bounds.top);
    popup.resizeTo(bounds.width, bounds.height);
    popup.__nfWriteBounds = bounds;
    host.__nfWriteBounds = bounds;
    clearWriteHiddenAt(host);
    popup.focus();
  } catch {
    popup.focus();
  }
}

/** 메인 [글쓰기] — 5분 이내 숨김 창 복구 또는 신규 팝업(로그인) */
export function openWriteWindow(): void {
  if (typeof window === 'undefined') return;

  let existing = getWritePopupRef(window) ?? findNamedWritePopup();

  if (existing && !existing.closed) {
    if (!isWriteReuseValid(window)) {
      expireWritePopup(window, existing);
      existing = null;
    }
  }

  if (existing && !existing.closed) {
    registerWritePopupOnOpener(existing, window);
    window.__nfWritePopup = existing;
    showWritePopup(existing);
    return;
  }

  clearWritePopupSession(window);
  const bounds = defaultWritePopupBounds();
  const win = window.open('/write', WRITE_WINDOW_NAME, writePopupFeatures(bounds));
  if (win) {
    registerWritePopupOnOpener(win, window);
    window.__nfWriteBounds = bounds;
    win.focus();
    return;
  }

  window.location.href = '/write';
}

/** 게시글보기 URL 비교 — from·캐시방지 파라미터 제외 */
export function normalizePostViewPath(pathname: string, search = ''): string {
  const u = new URL(pathname + search, 'http://nf.local');
  u.searchParams.delete('from');
  u.searchParams.delete('_nfv');
  const qs = u.searchParams.toString();
  return u.pathname + (qs ? `?${qs}` : '');
}

/** 글쓰기 → 메인 창 단일글 페이지 (opener 이동 + 글쓰기 창 숨김) */
export function goToMainPostView(path: string): void {
  if (typeof window === 'undefined') return;

  const url = new URL(path, window.location.origin);
  url.searchParams.set('from', 'write');
  url.searchParams.delete('_nfv');
  const target = `${url.pathname}${url.search}`;
  const targetNorm = normalizePostViewPath(url.pathname, url.search);

  const opener = window.opener;

  if (opener && !opener.closed) {
    registerWritePopupOnOpener(window, opener);
    try {
      opener.postMessage({ type: 'nf-open-post', path: target }, window.location.origin);
    } catch {
      /* ignore */
    }
    try {
      opener.focus();
    } catch {
      /* ignore */
    }
    window.setTimeout(() => {
      try {
        if (opener.closed) return;
        const currentNorm = normalizePostViewPath(
          opener.location.pathname,
          opener.location.search,
        );
        if (currentNorm !== targetNorm) {
          opener.location.assign(target);
        }
      } catch {
        /* ignore — postMessage가 주 경로 */
      }
      hideWritePopup(window);
    }, 200);
    return;
  }

  window.location.assign(target);
}

/** 글쓰기 HOME — 메인으로 포커스, 글쓰기 창은 숨김(5분 타이머 시작) */
export function goToMainHome(): void {
  if (typeof window === 'undefined') return;

  const opener = window.opener;
  if (opener && !opener.closed) {
    registerWritePopupOnOpener(window, opener);
    hideWritePopup(window);
    try {
      if (opener.location.pathname !== '/') {
        opener.location.href = POST_LOGIN_REDIRECT;
      }
    } catch {
      opener.location.href = POST_LOGIN_REDIRECT;
    }
    opener.focus();
    return;
  }

  window.location.href = POST_LOGIN_REDIRECT;
}

/** 글쓰기 팝업 로드 시 opener에 자신 등록 */
export function bindWritePopupToOpener(): void {
  if (typeof window === 'undefined') return;
  if (window.name !== WRITE_WINDOW_NAME) return;
  const opener = window.opener;
  if (opener && !opener.closed) {
    registerWritePopupOnOpener(window, opener);
    window.__nfWriteBounds = captureWritePopupBounds();
    opener.__nfWriteBounds = window.__nfWriteBounds;
  }
}
