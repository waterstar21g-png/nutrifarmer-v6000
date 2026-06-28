/** AI 명령문 관리 팝업 창 이름 */
export const AI_COMMANDS_WINDOW_NAME = 'nf-v5000-ai-commands';

export function aiCommandsPopupFeatures(): string {
  const width = Math.min(720, Math.round(screen.availWidth * 0.55));
  const height = Math.min(860, Math.round(screen.availHeight * 0.88));
  const left = Math.max(0, Math.round((screen.availWidth - width) / 2));
  const top = Math.max(0, Math.round((screen.availHeight - height) / 2));
  return [
    `width=${width}`,
    `height=${height}`,
    `left=${left}`,
    `top=${top}`,
    'resizable=yes',
    'scrollbars=yes',
  ].join(',');
}

/** 「2차 AI명령」 — 명령문 조회/변경 전용 창 */
export function openAiCommandsWindow(): void {
  if (typeof window === 'undefined') return;

  const existing = window.open('', AI_COMMANDS_WINDOW_NAME);
  if (existing && !existing.closed) {
    try {
      if (existing.location.pathname.endsWith('/write/ai-commands')) {
        existing.focus();
        return;
      }
    } catch {
      /* cross-origin — reopen */
    }
  }

  const win = window.open('/write/ai-commands', AI_COMMANDS_WINDOW_NAME, aiCommandsPopupFeatures());
  if (win) {
    win.focus();
    return;
  }

  window.location.href = '/write/ai-commands';
}
