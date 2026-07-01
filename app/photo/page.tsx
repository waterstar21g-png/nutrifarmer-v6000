import type { Metadata } from 'next';
import { MobilePhotoWriteFlow } from '@/components/m7/MobilePhotoWriteFlow';
import type { PhotoFlowMode } from '@/lib/v6000-write-config';

export const metadata: Metadata = {
  title: '사진 → 글',
  description: 'V6.1 사진 AI 글쓰기',
};

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

function parseMode(raw?: string): PhotoFlowMode {
  if (raw === 'continuous' || raw === 'multi') return raw;
  return 'single';
}

export default async function PhotoWritePage({ searchParams }: Props) {
  const { mode: raw } = await searchParams;
  return <MobilePhotoWriteFlow mode={parseMode(raw)} />;
}
