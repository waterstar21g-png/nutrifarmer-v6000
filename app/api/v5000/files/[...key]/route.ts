import { NextResponse } from 'next/server';
import { getR2Object, isR2Configured } from '@/lib/v5000-content/r2';

export const dynamic = 'force-dynamic';

type RouteCtx = { params: Promise<{ key: string[] }> };

export async function GET(_req: Request, ctx: RouteCtx) {
  if (!isR2Configured()) {
    return new NextResponse('Not found', { status: 404 });
  }

  const segments = (await ctx.params).key;
  if (!segments?.length) {
    return new NextResponse('Not found', { status: 404 });
  }

  const objectKey = segments.map(decodeURIComponent).join('/');

  try {
    const obj = await getR2Object(objectKey);
    if (!obj.body) {
      return new NextResponse('Not found', { status: 404 });
    }

    const bytes = await obj.body.transformToByteArray();
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        'Content-Type': obj.contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err) {
    console.error('[v5000-files]', objectKey, err);
    return new NextResponse('Not found', { status: 404 });
  }
}
