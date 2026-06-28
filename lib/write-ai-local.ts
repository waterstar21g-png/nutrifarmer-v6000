/** 로컬 AI 시뮬레이션 — 우측 본문·좌측 대화 로그용 텍스트 생성 */

export type AiCmdId =
  | 'prompt'
  | 'complete'
  | 'edit'
  | 'rewrite'
  | 'title'
  | 'summary'
  | 'easy'
  | 'author';

export function generateAiBody(cmdId: AiCmdId, prompt: string, context: string): string {
  const ctx = context.trim();
  const p = prompt.trim();
  const seed = ctx || p;

  const result = (() => {
    switch (cmdId) {
    case 'complete': {
      const title = seed.slice(0, 36) || '오늘의 이야기';
      const body = seed || '전하고 싶은 이야기를 적어 주세요.';
      return [
        `## ${title}`,
        '',
        body,
        '',
        '---',
        '',
        '이 글은 입력하신 소재를 바탕으로 흐름을 갖춘 초안입니다. 우측 [본문]에서 자유롭게 다듬어 주세요.',
      ].join('\n');
    }
    case 'edit':
      return ctx
        ? polishText(ctx)
        : '교정할 본문을 우측 [본문]에 입력한 뒤 [수정]을 눌러 주세요.';
    case 'rewrite':
      return ctx
        ? rewriteText(ctx)
        : (p || '다시 쓸 본문이 없습니다. 우측 [본문]에 글을 입력해 주세요.');
    case 'title': {
      const base = ctx.slice(0, 20) || '오늘의 기록';
      return [
        '제목 제안:',
        `1. ${base}`,
        '2. 잊지 못할 그 순간',
        '3. 삶의 작은 조각들',
        '4. 마음에 남는 하루',
        '5. 기록으로 남긴 이야기',
      ].join('\n');
    }
    case 'summary':
      return ctx
        ? `요약:\n${ctx.split(/\n+/).filter(Boolean).slice(0, 3).join('\n')}`
        : '요약할 본문을 우측 [본문]에 입력해 주세요.';
    case 'easy':
      return ctx
        ? simplifyText(ctx)
        : (p || '쉽게 바꿀 내용을 입력해 주세요.');
    case 'author':
      return ctx
        ? authorStyle(ctx)
        : (p || '본문을 입력하면 작가 톤으로 다듬어 드립니다.');
    case 'prompt':
    default:
      return ctx
        ? applyPromptToContext(p, ctx)
        : draftFromPrompt(p);
    }
  })();

  return dedupeRepeatedSentences(result);
}

function polishText(text: string): string {
  return text
    .split(/\n+/)
    .map(line => line.trim().replace(/\s{2,}/g, ' '))
    .filter(Boolean)
    .join('\n\n');
}

function rewriteText(text: string): string {
  const lines = text.split(/\n+/).filter(Boolean);
  if (lines.length === 0) return text;
  return lines
    .map((line, i) => (i === 0 ? `처음으로, ${line}` : line))
    .join('\n\n');
}

function simplifyText(text: string): string {
  return text
    .replace(/습니다/g, '해요')
    .replace(/됩니다/g, '돼요')
    .replace(/하였/g, '했')
    .trim();
}

function authorStyle(text: string): string {
  const first = text.split(/\n+/).filter(Boolean)[0] ?? text;
  return `${first}\n\n시간이 흐르며 겹겹이 쌓인 기억 속에서, 우리는 자신만의 문장을 찾아갑니다.\n\n${text}`;
}

function applyPromptToContext(prompt: string, context: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes('요약')) return context.split(/\n+/).slice(0, 3).join('\n');
  if (lower.includes('제목')) return generateAiBody('title', prompt, context);
  if (lower.includes('쉽게')) return simplifyText(context);
  if (lower.includes('작가')) return authorStyle(context);
  if (lower.includes('다시')) return rewriteText(context);
  if (lower.includes('교정') || lower.includes('다듬')) return polishText(context);
  if (lower.includes('완성') || lower.includes('작성')) return generateAiBody('complete', prompt, context);
  return context.slice(0, 800);
}

function draftFromPrompt(prompt: string): string {
  if (!prompt) return '명령을 입력해 주세요.';

  const topic = prompt.replace(/[.?!。！？]+$/g, '').trim();

  return [
    `「${topic}」에 대한 답변입니다.`,
    '',
    '※ 실제 AI 요약·창작은 OpenAI API 연결(OPENAI_API_KEY) 후 이용 가능합니다.',
    '',
    '현재는 로컬 모드입니다. 우측 [본문]에 직접 글을 쓰거나, API 설정 후 같은 명령을 다시 보내 주세요.',
  ].join('\n');
}

function dedupeRepeatedSentences(text: string): string {
  const seen = new Set<string>();

  return text
    .split('\n')
    .map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';

      const normalized = trimmed.replace(/\s+/g, ' ');
      if (seen.has(normalized)) return '';
      seen.add(normalized);
      return line;
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
