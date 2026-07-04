import type { Metadata } from 'next';
import { ProductScoutFlow } from '@/components/scout/ProductScoutFlow';

export const metadata: Metadata = {
  title: '상품 스카우트',
  description: '사진으로 상품을 인식하고 아이템스카우트 키워드 분석 데이터를 확인합니다.',
};

export default function ScoutPage() {
  return <ProductScoutFlow />;
}
