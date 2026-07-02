'use client';

import { WriteGate } from '@/components/auth/WriteGate';
import { MobileWriteFlow } from './MobileWriteFlow';

export function WritePageGate() {
  return (
    <WriteGate redirectTo="/write">
      <MobileWriteFlow />
    </WriteGate>
  );
}
