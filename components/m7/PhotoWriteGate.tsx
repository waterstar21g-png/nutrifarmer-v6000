'use client';

import type { PhotoFlowMode } from '@/lib/v6000-write-config';
import { photoReturnPath } from '@/lib/v6000-write-draft';
import { WriteGate } from '@/components/auth/WriteGate';
import { MobilePhotoWriteFlow } from './MobilePhotoWriteFlow';

interface Props {
  mode: PhotoFlowMode;
}

export function PhotoWriteGate({ mode }: Props) {
  return (
    <WriteGate redirectTo={photoReturnPath(mode)}>
      <MobilePhotoWriteFlow mode={mode} />
    </WriteGate>
  );
}
