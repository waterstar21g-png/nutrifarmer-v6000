import type { Metadata, Viewport } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import './globals.css';
import { MobileShell } from '@/components/m6/MobileShell';
import { AppVersionGuard } from '@/components/m6/AppVersionGuard';
import { appVersionLabel } from '@/lib/app-version';

const notoSans = Noto_Sans_KR({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--m6-font',
  preload: false,
});

export const metadata: Metadata = {
  title: { default: '탁월한 찬사 · 모바일', template: '%s — 탁월한 찬사' },
  description: '모바일 전용 — 일상·가족·성장 기록',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'http://localhost:6000',
  ),
  appleWebApp: { capable: true, title: '탁월한 찬사' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0f2744',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const version = appVersionLabel();
  return (
    <html lang="ko" className={notoSans.variable}>
      <head>
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <meta name="app-version" content={version} />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=document.querySelector('meta[name="app-version"]');var n=m&&m.getAttribute('content');if(!n)return;var k='nf-v6000-app-version';var norm=function(v){return v?String(v).replace(/^V/i,'').trim():'';};var p=localStorage.getItem(k);if(p&&norm(p)!==norm(n)){localStorage.setItem(k,n);location.reload();return;}localStorage.setItem(k,n);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="m6-body">
        <AppVersionGuard />
        <MobileShell serverVersion={version}>{children}</MobileShell>
      </body>
    </html>
  );
}
