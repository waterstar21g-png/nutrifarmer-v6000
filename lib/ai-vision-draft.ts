import { SHOWCASE_CATS } from '@/lib/site-data';

export const VISION_DRAFT_CATEGORIES = SHOWCASE_CATS.map(c => ({
  slug: c.slug,
  name: c.name,
}));

const VALID_SLUGS = new Set(SHOWCASE_CATS.map(c => c.slug));

export interface VisionDraftInput {
  imageUrls: string[];
  hint?: string;
  userIntent?: string;
  mergeMode?: 'single' | 'multi';
}

export interface VisionDraftResult {
  categorySlug: string;
  title: string;
  excerpt: string;
  body: string;
}

function buildVisionSystemPrompt(): string {
  const cats = VISION_DRAFT_CATEGORIES.map(c => `${c.slug}(${c.name})`).join(', ');
  return `당신은 "탁월한 찬사" 개인 블로그의 한국어 글쓰기 조력자입니다.
사진을 보고 JSON만 반환하세요 (마크다운 코드블록 금지). 키: categorySlug, title, excerpt, body

카테고리: categorySlug는 반드시 다음 중 하나 — ${cats}
title: 간결한 한국어 제목, 80자 이내
excerpt: 1~2문장 요약, plain text
body: <p> 단락 HTML만. <img>/<figure> 금지 (사진은 별도 첨부)
mergeMode multi: 여러 사진을 하나의 이야기로 엮기

[작성 기준 — 필수]
1. AI 티·기계적 문체·뻔한 AI 문장 절대 금지. 일상에서 사람이 쓰는 자연스러운 단어와 문체.
2. 말하듯 자연스러운 구어체 우선. 딱딱한 설명문 금지.
3. 어린이·아이 사진이면 "~다/~까" 대신 "~요", "귀여워", "착하지" 등 아이에게 어울리는 따뜻한 말투.
4. 유머·유쾌함·정다움·신비함·향수·친밀감을 담고, 지금 이 순간 다시 느끼는 사랑과 감성을 표현.
5. 흑백·오래된·먼 과거 사진이면 그 시절의 아름다움과 지금의 성장을 비교하고, 그때만의 감수성을 살릴 것.
6. 따뜻하고 애틋한 가족의 사랑과 그리움을 담을 것.
7. 수필·산문·문어체는 격식이 필요한 사진(공식 행사·전문 글 등)에만 사용.
8. 작가적 교정력과 감수성, 과거·현재·미래를 아우르는 통찰을 담백하고 간결하게 압축 표현.`;
}

function resolveUserIntent(input: VisionDraftInput): string | undefined {
  const raw = (input.userIntent ?? input.hint)?.trim();
  return raw || undefined;
}

function buildVisionUserContent(input: VisionDraftInput): Array<
  { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }
> {
  const parts: Array<
    { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }
  > = [];
  const hint = resolveUserIntent(input);
  if (hint) {
    parts.push({
      type: 'text',
      text: `[사용자 의도 — 글의 핵심 방향으로 반드시 반영]\n${hint}`,
    });
  }
  parts.push({
    type: 'text',
    text: `mergeMode: ${input.mergeMode ?? 'single'}. Image count: ${input.imageUrls.length}.`,
  });
  for (const url of input.imageUrls) {
    parts.push({ type: 'image_url', image_url: { url } });
  }
  return parts;
}

function stripEmbeddedImages(html: string): string {
  return html
    .replace(/<figure[\s\S]*?<\/figure>\s*/gi, '')
    .replace(/<img[^>]*\/?>\s*/gi, '')
    .trim();
}

function buildFigureBlock(imageUrls: string[], title: string): string {
  return imageUrls
    .map(
      url =>
        `<figure><img src="${url}" alt="${title.replace(/"/g, '&quot;')}" style="max-width:100%;height:auto;border-radius:8px"/></figure>`,
    )
    .join('\n');
}

export async function generateVisionDraft(
  apiKey: string,
  input: VisionDraftInput,
): Promise<VisionDraftResult> {
  if (!input.imageUrls.length) {
    throw new Error('no_images');
  }

  const model = process.env.OPENAI_VISION_MODEL?.trim()
    || process.env.OPENAI_MODEL?.trim()
    || 'gpt-4o-mini';

  const userContent = buildVisionUserContent(input);

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.72,
      max_tokens: 2500,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: buildVisionSystemPrompt() },
        { role: 'user', content: userContent },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`upstream:${res.status}:${err.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = data.choices?.[0]?.message?.content?.trim() ?? '';
  if (!raw) throw new Error('empty_response');

  let parsed: VisionDraftResult;
  try {
    parsed = JSON.parse(raw) as VisionDraftResult;
  } catch {
    throw new Error('invalid_json_response');
  }

  if (!VALID_SLUGS.has(parsed.categorySlug)) {
    parsed.categorySlug = 'daily-life';
  }
  parsed.title = (parsed.title ?? '제목 없음').slice(0, 500);
  parsed.excerpt = (parsed.excerpt ?? '').slice(0, 500);
  parsed.body = parsed.body ?? '';

  const prose = stripEmbeddedImages(parsed.body);
  const figures = buildFigureBlock(input.imageUrls, parsed.title);
  parsed.body = prose ? `${figures}\n${prose}` : figures;

  return parsed;
}
