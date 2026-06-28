'use client';

import { Suspense } from 'react';
import { LoginHub } from '@/components/auth/LoginHub';

export function LoginPageClient() {
  return (
    <Suspense fallback={
      <div className="nf-auth-scene">
        <div className="nf-auth-card nf-auth-card--login">
          <p className="nf-auth-lead">로딩 중…</p>
        </div>
      </div>
    }>
      <LoginHub />
    </Suspense>
  );
}
