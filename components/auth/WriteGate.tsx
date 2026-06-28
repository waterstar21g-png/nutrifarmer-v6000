'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { openAuthFromWritePopup } from '@/lib/auth-navigation';

interface Props {
  children: React.ReactNode;
  redirectTo?: string;
}

export function WriteGate({ children, redirectTo = '/write' }: Props) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loginPath = `/login?redirect_to=${encodeURIComponent(redirectTo)}`;
    const lostPath = `/login?panel=lost&redirect_to=${encodeURIComponent(redirectTo)}`;

    fetch('/api/v5000/auth/me')
      .then(r => r.json())
      .then(data => {
        if (!data.loggedIn) {
          if (typeof window !== 'undefined' && window.opener) {
            openAuthFromWritePopup(loginPath);
            return;
          }
          router.replace(loginPath);
          return;
        }
        if (data.user?.mustResetPassword) {
          if (typeof window !== 'undefined' && window.opener) {
            openAuthFromWritePopup(lostPath);
            return;
          }
          router.replace(lostPath);
          return;
        }
        setReady(true);
      })
      .catch(() => {
        if (typeof window !== 'undefined' && window.opener) {
          openAuthFromWritePopup(loginPath);
          return;
        }
        router.replace(loginPath);
      });
  }, [router, redirectTo]);

  if (!ready) {
    return (
      <div className="nfw-app nfw-app--loading">
        <div className="nfw-loading">로그인 확인 중…</div>
      </div>
    );
  }

  return <>{children}</>;
}
