/** AI 버튼 명령문 — 기본값·localStorage 저장 */

export type AiCommandKey = 'complete' | 'edit' | 'rewrite' | 'title' | 'summary' | 'author';

export interface AiCommandDef {
  key: AiCommandKey;
  label: string;
  prompt: string;
}

export const AI_COMMANDS_UPDATED = 'nf-ai-commands-updated';

const LS_KEY = 'nf-write-ai-commands';

export const DEFAULT_AI_COMMANDS: Record<AiCommandKey, AiCommandDef> = {
  complete: {
    key: 'complete',
    label: '글쓰기 완성',
    prompt:
      '우측 본문 내용을 읽고 "국문과 대학원생 역할로" 세련되고 우아한 글로 최종 완성본을 생성해 줘.',
  },
  edit: {
    key: 'edit',
    label: '수정',
    prompt:
      '우측 본문 내용을 읽고 "문법 전문가 역할로" 오타, 수정할 사항, 매끄러운 문맥 전개, 단락 구분, 앞뒤 연결 관계를 논리적으로 구성해줘.',
  },
  rewrite: {
    key: 'rewrite',
    label: '다시쓰기',
    prompt:
      '"글쓰기 완성"과 "수정" 명령을 합쳐 재차 완성할 버전을 만들어줘.',
  },
  title: {
    key: 'title',
    label: '제목',
    prompt:
      '우측 본문 내용을 읽고 "국문학과 학생 역할"로 알맞은 제목을 30자 이내로 완성하고 이를 "제목" 필드에 넣어줘.',
  },
  summary: {
    key: 'summary',
    label: '요약',
    prompt:
      '우측 본문 내용을 읽고 "국문학과 학생 역할"로 50자 이내로 요약 해주고 이를 "우측 요약"란에 넣어줘.',
  },
  author: {
    key: 'author',
    label: '작가처럼',
    prompt:
      '우측 본문 내용을 읽고 "전문 작가 역할"로서 전문화되고, 세련되며, 읽기 쉽고, 깊이 있는 글을 완성 해줘.',
  },
};

export const AI_COMMAND_KEYS: AiCommandKey[] = [
  'complete', 'edit', 'rewrite', 'title', 'summary', 'author',
];

function mergeWithDefaults(raw: Partial<Record<AiCommandKey, AiCommandDef>>): Record<AiCommandKey, AiCommandDef> {
  const out = { ...DEFAULT_AI_COMMANDS };
  for (const key of AI_COMMAND_KEYS) {
    const item = raw[key];
    if (item?.prompt?.trim()) {
      out[key] = {
        key,
        label: item.label?.trim() || DEFAULT_AI_COMMANDS[key].label,
        prompt: item.prompt.trim(),
      };
    }
  }
  return out;
}

export function loadAiCommands(): Record<AiCommandKey, AiCommandDef> {
  if (typeof window === 'undefined') return { ...DEFAULT_AI_COMMANDS };
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { ...DEFAULT_AI_COMMANDS };
    return mergeWithDefaults(JSON.parse(raw) as Partial<Record<AiCommandKey, AiCommandDef>>);
  } catch {
    return { ...DEFAULT_AI_COMMANDS };
  }
}

export function saveAiCommands(commands: Record<AiCommandKey, AiCommandDef>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LS_KEY, JSON.stringify(commands));
  window.dispatchEvent(new CustomEvent(AI_COMMANDS_UPDATED));
}

export function resetAiCommands(): Record<AiCommandKey, AiCommandDef> {
  if (typeof window !== 'undefined') localStorage.removeItem(LS_KEY);
  const defaults = { ...DEFAULT_AI_COMMANDS };
  window.dispatchEvent(new CustomEvent(AI_COMMANDS_UPDATED));
  return defaults;
}

export function getCommandPrompt(key: AiCommandKey): string {
  return loadAiCommands()[key].prompt;
}

/** AI 응답에서 제목·요약 추출 */
export function extractTitleFromAi(text: string): string {
  const t = text.trim();
  const quoted = t.match(/[「『"]([^」』"]+)[」』"]/);
  if (quoted?.[1]) return quoted[1].trim().slice(0, 30);
  const line = t.split('\n').map(l => l.replace(/^#+\s*/, '').trim()).find(Boolean) ?? t;
  return line.replace(/^제목\s*[:：]\s*/i, '').slice(0, 30);
}

export function extractSummaryFromAi(text: string): string {
  const t = text.trim();
  const line = t.split('\n').map(l => l.trim()).find(Boolean) ?? t;
  return line.replace(/^요약\s*[:：]\s*/i, '').slice(0, 50);
}
