'use client';

import { WriteGate } from '@/components/auth/WriteGate';
import { WriteHubMenu } from './WriteHubMenu';

export function UploadPageGate() {
  return (
    <WriteGate redirectTo="/upload">
      <WriteHubMenu />
    </WriteGate>
  );
}
