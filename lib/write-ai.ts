import { generateAiBody, type AiCmdId } from '@/lib/write-ai-local';

export type AiSource = 'openai' | 'local';

const LOCAL_NOTICE =
  '⚠️ OpenAI API가 연결되지 않았습니다. `.env.local` 또는 Vercel에 `OPENAI_API_KEY`를 설정해 주세요.\n' +
  '설정 후 개발 서버 재시작(로컬) 또는 재배포(운영)가 필요합니다.\n\n';

export async function runWriteAi(
  cmdId: AiCmdId,
  prompt: string,
  context: string,
): Promise<{ text: string; source: AiSource }> {
  try {
    const res = await fetch('/api/v5000/ai/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ cmdId, prompt, context }),
    });
    const data = (await res.json()) as { ok?: boolean; text?: string; code?: string; message?: string };

    if (res.status === 401) {
      throw new Error('LOGIN_REQUIRED');
    }

    if (data.ok && data.text) {
      return { text: data.text, source: 'openai' };
    }

    if (data.code === 'no_api_key') {
      return {
        text: LOCAL_NOTICE + generateAiBody(cmdId, prompt, context),
        source: 'local',
      };
    }

    if (data.code === 'upstream_error' || data.code === 'network_error') {
      return {
        text: `⚠️ AI 서버 연결 오류 (${data.code}). 잠시 후 다시 시도해 주세요.\n\n` +
          generateAiBody(cmdId, prompt, context),
        source: 'local',
      };
    }
  } catch (e) {
    if (e instanceof Error && e.message === 'LOGIN_REQUIRED') throw e;
    /* fall through */
  }

  return {
    text: LOCAL_NOTICE + generateAiBody(cmdId, prompt, context),
    source: 'local',
  };
}
