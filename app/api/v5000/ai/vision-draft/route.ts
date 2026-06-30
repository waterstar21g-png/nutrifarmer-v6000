import { NextRequest, NextResponse } from 'next/server';
import { generateVisionDraft } from '@/lib/ai-vision-draft';
import { requireSession } from '@/lib/v5000-content/api';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ ok: false, code: 'no_api_key' }, { status: 503 });
  }

  let body: { imageUrls?: string[]; hint?: string; userIntent?: string; mergeMode?: 'single' | 'multi' };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, code: 'invalid_json' }, { status: 400 });
  }

  const imageUrls = (body.imageUrls ?? []).filter(u => typeof u === 'string' && u.startsWith('http'));
  if (!imageUrls.length) {
    return NextResponse.json({ ok: false, code: 'no_images' }, { status: 400 });
  }
  if (imageUrls.length > 8) {
    return NextResponse.json({ ok: false, code: 'too_many_images' }, { status: 400 });
  }

  try {
    const draft = await generateVisionDraft(apiKey, {
      imageUrls,
      hint: body.hint,
      userIntent: body.userIntent ?? body.hint,
      mergeMode: body.mergeMode ?? (imageUrls.length > 1 ? 'multi' : 'single'),
    });
    return NextResponse.json({ ok: true, draft, source: 'openai-vision' });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'vision_failed';
    console.error('[ai/vision-draft]', msg);
    return NextResponse.json({ ok: false, code: 'vision_failed', message: msg }, { status: 502 });
  }
}
