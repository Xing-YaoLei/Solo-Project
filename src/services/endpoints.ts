import { request } from './api';
import type {
  ApiResponse,
  Store,
  Alert,
  MatrixBubble,
  PreparationTrendPoint,
  TestDriveDistributionPoint,
  QuoteCandlePoint,
  SyncDelayInfo,
  RuleConfig,
  PaginationParams,
  PaginatedResponse,
  Vehicle,
} from '@shared/types';

interface DashboardSummary {
  totalVehicles: number;
  totalAlerts: number;
  highRiskCount: number;
  avgCompletion: number;
  avgStockDays: number;
  storeCount: number;
}

interface ReviewData {
  vehicle: Vehicle;
  documents: {
    type: string;
    name: string;
    status: string;
    uploadedAt?: string;
  }[];
  alerts: {
    id: string;
    level: string;
    message: string;
    triggeredAt: string;
    resolved: boolean;
  }[];
  preparationRecords: {
    itemName: string;
    category: string;
    cost: number;
    status: string;
    startedAt?: string;
    completedAt?: string;
  }[];
  testDriveRecords: {
    customerName: string;
    driveAt: string;
    rating: number;
    feedback?: string;
  }[];
  quoteRecords: {
    amount: number;
    source: string;
    quotedAt: string;
    isDeal: boolean;
    dealPrice?: number;
  }[];
}

export function fetchDashboardSummary(): Promise<ApiResponse<DashboardSummary>> {
  return request<DashboardSummary>({
    url: '/analytics/dashboard-summary',
  });
}

export function fetchStores(): Promise<ApiResponse<Store[]>> {
  return request<Store[]>({
    url: '/stores',
  });
}

interface FetchAlertsParams extends PaginationParams {
  level?: string;
  storeId?: string;
  resolved?: boolean;
  acknowledged?: boolean;
}

export function fetchAlerts(
  params: FetchAlertsParams
): Promise<ApiResponse<PaginatedResponse<Alert>>> {
  return request<PaginatedResponse<Alert>>({
    url: '/alerts',
    params: params as unknown as Record<string, unknown>,
  });
}

interface FetchRiskMatrixParams {
  storeId?: string;
  region?: string;
  days?: number;
}

export function fetchRiskMatrix(
  params: FetchRiskMatrixParams
): Promise<ApiResponse<MatrixBubble[]>> {
  return request<MatrixBubble[]>({
    url: '/analytics/risk-matrix',
    params: params as Record<string, unknown>,
  });
}

export function fetchPreparationTrend(
  days: number
): Promise<ApiResponse<PreparationTrendPoint[]>> {
  return request<PreparationTrendPoint[]>({
    url: '/analytics/preparation-trend',
    params: { days },
  });
}

export function fetchTestDriveDistribution(
  days: number
): Promise<ApiResponse<TestDriveDistributionPoint[]>> {
  return request<TestDriveDistributionPoint[]>({
    url: '/analytics/test-drive-distribution',
    params: { days },
  });
}

export function fetchQuoteCandles(
  days: number
): Promise<ApiResponse<QuoteCandlePoint[]>> {
  return request<QuoteCandlePoint[]>({
    url: '/analytics/quote-candles',
    params: { days },
  });
}

export function fetchSyncDelayInfo(): Promise<ApiResponse<SyncDelayInfo[]>> {
  return request<SyncDelayInfo[]>({
    url: '/sync/delay-info',
  });
}

export function fetchRules(): Promise<ApiResponse<RuleConfig[]>> {
  return request<RuleConfig[]>({
    url: '/rules',
  });
}

export function updateRule(
  rule: Partial<RuleConfig> & Pick<RuleConfig, 'id'>
): Promise<ApiResponse<RuleConfig>> {
  return request<RuleConfig>({
    url: `/rules/${rule.id}`,
    method: 'put',
    data: rule,
  });
}

export function fetchReviewData(vin: string): Promise<ApiResponse<ReviewData>> {
  return request<ReviewData>({
    url: `/review/${vin}`,
  });
}
