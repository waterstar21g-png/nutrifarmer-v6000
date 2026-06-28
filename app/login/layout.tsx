import type { ReactNode } from 'react';

/** /login 전용 — SiteHeader·SiteFooter 제외 */
export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
