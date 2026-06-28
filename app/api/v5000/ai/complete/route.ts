import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/v5000-content/api';
import type { AiCmdId } from '@/lib/write-ai-local';
import { buildAiSystemPrompt, buildAiUserMessage } from '@/lib/write-ai-prompts';

export const dynamic = 'force-dynamic';

const VALID_CMDS = new Set<AiCmdId>([
  'prompt', 'complete', 'edit', 'rewrite', 'title', 'summary', 'easy', 'author',
]);

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ ok: false, code: 'no_api_key' }, { status: 503 });
  }

  let body: { cmdId?: string; prompt?: string; context?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, code: 'invalid_json' }, { status: 400 });
  }

  const cmdId = (body.cmdId ?? 'prompt') as AiCmdId;
  if (!VALID_CMDS.has(cmdId)) {
    return NextResponse.json({ ok: false, code: 'invalid_cmd' }, { status: 400 });
  }

  const prompt = (body.prompt ?? '').trim();
  const context = (body.context ?? '').trim();
  if (!prompt && !context) {
    return NextResponse.json({ ok: false, code: 'empty' }, { status: 400 });
  }

  const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        max_tokens: 2000,
        messages: [
          { role: 'system', content: buildAiSystemPrompt(cmdId) },
          { role: 'user', content: buildAiUserMessage(cmdId, prompt, context) },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[ai/complete]', res.status, err.slice(0, 400));
      return NextResponse.json({ ok: false, code: 'upstream_error' }, { status: 502 });
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content?.trim() ?? '';
    if (!text) {
      return NextResponse.json({ ok: false, code: 'empty_response' }, { status: 502 });
    }

    return NextResponse.json({ ok: true, text, source: 'openai' });
  } catch (e) {
    console.error('[ai/complete]', e);
    return NextResponse.json({ ok: false, code: 'network_error' }, { status: 502 });
  }
}
