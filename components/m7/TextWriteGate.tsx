'use client';

import { WriteGate } from '@/components/auth/WriteGate';
import { MobileTextToPhotoFlow } from './MobileTextToPhotoFlow';

export function TextWriteGate() {
  return (
    <WriteGate redirectTo="/text">
      <MobileTextToPhotoFlow />
    </WriteGate>
  );
}
