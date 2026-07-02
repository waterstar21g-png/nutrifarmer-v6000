import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { APP_VERSION } from '@/lib/app-version';

/** 로그인·API — 캐시 금지 */
const NO_STORE =
  'private, no-cache, no-store, max-age=0, must-revalidate';

/** 공개 글 목록·단일글 — CDN/엣지 5분 캐시 (Neon 전송량 절감) */
const PUBLIC_PAGE_CACHE =
  'public, s-maxage=300, stale-while-revalidate=600';

function isPrivatePath(pathname: string): boolean {
  if (pathname.startsWith('/api/')) return true;
  if (pathname.startsWith('/login')) return true;
  if (pathname === '/account' || pathname.startsWith('/account/')) return true;
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/_next/static')) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const cacheControl = isPrivatePath(pathname) ? NO_STORE : PUBLIC_PAGE_CACHE;
  response.headers.set('Cache-Control', cacheControl);
  if (isPrivatePath(pathname)) {
    response.headers.set('CDN-Cache-Control', 'no-store');
    response.headers.set('Vercel-CDN-Cache-Control', 'no-store');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }
  response.headers.set('X-App-Version', APP_VERSION);
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)',
  ],
};
