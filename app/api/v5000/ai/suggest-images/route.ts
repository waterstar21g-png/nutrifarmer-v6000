import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/v5000-content/api';
import {
  collectSuggestedImages,
  extractLocalKeywords,
  type SuggestedImage,
} from '@/lib/write-image-suggest';

export const dynamic = 'force-dynamic';

async function extractKeywordsWithAi(
  title: string,
  excerpt: string,
  body: string,
): Promise<string[] | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';
  const context = [title && `제목: ${title}`, excerpt && `요약: ${excerpt}`, body && `본문:\n${body.slice(0, 1200)}`]
    .filter(Boolean)
    .join('\n\n');

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 200,
        messages: [
          {
            role: 'system',
            content:
              '블로그 본문에 어울리는 사진 검색어 4개를 JSON 배열로만 출력하세요. ' +
              'Wikimedia Commons 검색에 적합하도록 영어·한국어 혼용. ' +
              '예: ["autumn leaves","가족 산책","warm tea","sunset"]. 설명 없이 배열만.',
          },
          { role: 'user', content: context || '일상 블로그 글' },
        ],
      }),
      cache: 'no-store',
    });
    if (!res.ok) return null;

    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = data.choices?.[0]?.message?.content?.trim() ?? '';
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return null;

    const parsed = JSON.parse(match[0]) as unknown;
    if (!Array.isArray(parsed)) return null;

    const keywords = parsed
      .map(v => String(v).trim())
      .filter(Boolean)
      .slice(0, 4);
    return keywords.length ? keywords : null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  let body: { title?: string; excerpt?: string; body?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: '잘못된 요청입니다.' }, { status: 400 });
  }

  const title = (body.title ?? '').trim();
  const excerpt = (body.excerpt ?? '').trim();
  const text = (body.body ?? '').trim();

  if (!title && !excerpt && !text) {
    return NextResponse.json({ ok: false, message: '본문 또는 제목을 입력해 주세요.' }, { status: 400 });
  }

  const keywords =
    (await extractKeywordsWithAi(title, excerpt, text)) ??
    extractLocalKeywords(title, excerpt, text);

  const images: SuggestedImage[] = await collectSuggestedImages(keywords);

  if (images.length === 0) {
    return NextResponse.json(
      { ok: false, message: '추천 이미지를 찾지 못했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true, images, keywords });
}
