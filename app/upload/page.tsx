import type { Metadata } from 'next';
import { WriteHubMenu } from '@/components/m7/WriteHubMenu';

export const metadata: Metadata = {
  title: '사진올리기',
  description: 'V6.1 모바일 사진 AI 글쓰기',
};

export default function UploadPage() {
  return <WriteHubMenu />;
}
