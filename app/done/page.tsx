import type { Metadata } from 'next';
import { Suspense } from 'react';
import { DoneClient } from '@/components/m7/DoneClient';

export const metadata: Metadata = {
  title: '게시 완료',
  description: 'V7000 게시 결과',
};

export default function DonePage() {
  return (
    <Suspense fallback={<p className="m7-loading">로딩…</p>}>
      <DoneClient />
    </Suspense>
  );
}
