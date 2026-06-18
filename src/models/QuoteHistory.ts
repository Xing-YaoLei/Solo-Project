export interface QuoteRecord {
  id: string;
  timestamp: string;
  appraiser: string;
  appraisedValue: number;
  marketReferenceValue: number;
  mileageAdjustment: number;
  conditionAdjustment: number;
  colorAdjustment: number;
  marketTrendAdjustment: number;
  finalQuote: number;
  valuationMethod: '重置成本法' | '现行市价法' | '收益现值法' | '综合评估法';
  remarks?: string;
}

export interface QuoteHistory {
  vehicleId: string;
  initialQuoteDate: string;
  quoteRecords: QuoteRecord[];
  priceTrend: '上涨' | '下跌' | '稳定' | '波动';
  averageQuote: number;
  highestQuote: number;
  lowestQuote: number;
  finalNegotiatedPrice: number;
  buyerOfferHistory: number[];
  sellerAskHistory: number[];
}
