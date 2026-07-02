'use client';

import type { PhotoFlowMode } from '@/lib/v7000-config';
import { photoReturnPath } from '@/lib/v7000-flow-draft';
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
