import { NextResponse } from 'next/server';
import { findPublishedPostById } from '@/lib/v5000-content/posts';
import { extractPreviewImageSrc } from '@/lib/v5000-content/preview-image';
import { resolveMediaUrl } from '@/lib/v5000-content/media-mirror';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

/** 목록 썸네일 — data: URL·대용량 인라인 이미지를 직접 스트리밍 (RSC 페이로드 회피) */
export async function GET(_req: Request, { params }: Props) {
  const id = parseInt((await params).id, 10);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ ok: false, message: 'invalid id' }, { status: 400 });
  }

  const post = await findPublishedPostById(id).catch(() => null);
  if (!post) {
    return NextResponse.json({ ok: false, message: 'not found' }, { status: 404 });
  }

  const src = extractPreviewImageSrc(post.body);
  if (!src) {
    return new Response(null, { status: 404 });
  }

  if (src.startsWith('data:')) {
    const comma = src.indexOf(',');
    if (comma < 0) return new Response(null, { status: 404 });
    const header = src.slice(0, comma);
    const mime = header.match(/^data:([^;,]+)/i)?.[1]?.trim() || 'image/png';
    try {
      const buf = Buffer.from(src.slice(comma + 1), 'base64');
      return new Response(buf, {
        headers: {
          'Content-Type': mime,
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        },
      });
    } catch {
      return new Response(null, { status: 404 });
    }
  }

  const resolved = await resolveMediaUrl(src);
  if (resolved.startsWith('http')) {
    return NextResponse.redirect(resolved, 302);
  }

  return new Response(null, { status: 404 });
}
