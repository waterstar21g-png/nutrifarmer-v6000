import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { APP_VERSION } from '@/lib/app-version';

/** HTML·RSC — 캐시 금지 (모바일·PC 브라우저·CDN 옛 화면 방지) */
const NO_STORE =
  'private, no-cache, no-store, max-age=0, must-revalidate';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/_next/static')) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  response.headers.set('Cache-Control', NO_STORE);
  response.headers.set('CDN-Cache-Control', 'no-store');
  response.headers.set('Vercel-CDN-Cache-Control', 'no-store');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('X-App-Version', APP_VERSION);
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)',
  ],
};
