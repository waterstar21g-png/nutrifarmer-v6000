/** 아이템스카우트 키워드 분석 결과 (앱 표시용 정규화 타입) */

export interface PriceListing {
  rank: number;
  productName: string;
  price: number;
  mallName: string;
  url?: string;
}

export interface ViewTrendPoint {
  date: string;
  views: number;
}

export interface ProductScoutResult {
  keyword: string;
  productName: string;
  category?: string;
  /** 경쟁 강도 (0~100, 높을수록 치열) */
  competitionIntensity: number;
  competitionLabel: string;
  /** 최근 1주간 조회수 */
  weeklyViews: number;
  /** 경쟁 상품수 */
  competingProducts: number;
  /** 1주 판매량 */
  weeklySales: number;
  /** 시중판매 최저가격 목록 */
  lowestPrices: PriceListing[];
  /** 조회 추세 (최근 7일) */
  viewTrend: ViewTrendPoint[];
  source: 'itemscout' | 'demo';
  analyzedAt: string;
}

export interface ProductVisionResult {
  productName: string;
  keyword: string;
  category: string;
  description: string;
  confidence: number;
}
