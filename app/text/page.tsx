import type { Metadata } from 'next';
import { MobileTextToPhotoFlow } from '@/components/m7/MobileTextToPhotoFlow';

export const metadata: Metadata = {
  title: '글 → 사진',
  description: 'V6.1 글에 맞는 이미지 추천',
};

export default function TextWritePage() {
  return <MobileTextToPhotoFlow />;
}
