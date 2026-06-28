import type { AiCmdId } from '@/lib/write-ai-local';
import { getCommandPrompt, type AiCommandKey } from '@/lib/write-ai-commands';

const BASE =
  '당신은 한국어 개인 블로그 글쓰기 도우미입니다. ' +
  '요청에 맞는 실제 내용을 작성하세요. ' +
  '메타 안내문만 반복하지 마세요.';

export function buildAiSystemPrompt(cmdId: AiCmdId): string {
  switch (cmdId) {
    case 'title':
      return `${BASE} 제목만 30자 이내로 출력하세요. 따옴표·번호·설명 없이 제목 한 줄만.`;
    case 'summary':
      return `${BASE} 요약만 50자 이내로 출력하세요. 설명·머리말 없이 요약 한 줄만.`;
    case 'edit':
      return `${BASE} 교정·다듬은 본문 전체를 HTML 없이 순수 텍스트만 출력하세요.`;
    case 'complete':
    case 'rewrite':
    case 'author':
      return `${BASE} 완성된 본문 전체를 HTML 없이 순수 텍스트만 출력하세요.`;
    case 'prompt':
    default:
      return `${BASE} 사용자 명령에 직접 답하고, 본문 초안이 필요하면 본문만 출력하세요.`;
  }
}

export function resolveAiUserPrompt(cmdId: AiCmdId, prompt: string): string {
  const p = prompt.trim();
  if (p) return p;
  if (cmdId !== 'prompt' && cmdId !== 'easy' && isCommandKey(cmdId)) {
    return getCommandPrompt(cmdId);
  }
  return p;
}

function isCommandKey(cmdId: AiCmdId): cmdId is AiCommandKey {
  return cmdId !== 'prompt' && cmdId !== 'easy';
}

export function buildAiUserMessage(cmdId: AiCmdId, prompt: string, context: string): string {
  const command = resolveAiUserPrompt(cmdId, prompt);
  const ctx = context.trim();

  if (ctx) {
    return `--- AI 명령 ---\n${command || cmdId}\n\n--- 우측 본문 (참고) ---\n${ctx}`;
  }
  return command || '블로그 글 초안을 작성해 주세요.';
}
