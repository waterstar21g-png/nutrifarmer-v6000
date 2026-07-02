import type { Metadata } from 'next';
import { WritePageGate } from '@/components/m7/WritePageGate';

export const metadata: Metadata = {
  title: '글쓰기',
  description: '모바일 글쓰기 — V6.1',
};

export default function MobileWritePage() {
  return <WritePageGate />;
}
