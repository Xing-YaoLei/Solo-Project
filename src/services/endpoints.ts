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
  WarningThreshold,
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
    url: '/stores/geo/map-data',
  });
}

interface FetchStoreListParams extends PaginationParams {
  region?: string;
}

export function fetchStoreList(
  params: FetchStoreListParams = {}
): Promise<ApiResponse<PaginatedResponse<Store>>> {
  const queryParams: Record<string, unknown> = {};
  if (params.page !== undefined) queryParams.page = params.page;
  if (params.pageSize !== undefined) queryParams.page_size = params.pageSize;
  if (params.region !== undefined) queryParams.region = params.region;
  return request<PaginatedResponse<Store>>({
    url: '/stores',
    params: queryParams,
  });
}

interface FetchAlertsParams extends PaginationParams {
  level?: string;
  storeId?: string;
  resolved?: boolean;
  acknowledged?: boolean;
}

export function fetchAlerts(
  params: FetchAlertsParams = {}
): Promise<ApiResponse<PaginatedResponse<Alert>>> {
  const queryParams: Record<string, unknown> = {};
  if (params.page !== undefined) queryParams.page = params.page;
  if (params.pageSize !== undefined) queryParams.page_size = params.pageSize;
  if (params.level !== undefined) queryParams.level = params.level;
  if (params.storeId !== undefined) queryParams.store_id = params.storeId;
  if (params.resolved !== undefined) queryParams.resolved = params.resolved;
  if (params.acknowledged !== undefined) queryParams.acknowledged = params.acknowledged;
  return request<PaginatedResponse<Alert>>({
    url: '/alerts',
    params: queryParams,
  });
}

interface FetchRiskMatrixParams {
  storeId?: string;
  region?: string;
  days?: number;
}

export function fetchRiskMatrix(
  params: FetchRiskMatrixParams = {}
): Promise<ApiResponse<MatrixBubble[]>> {
  const queryParams: Record<string, unknown> = {};
  if (params.storeId !== undefined) queryParams.store_id = params.storeId;
  if (params.region !== undefined) queryParams.region = params.region;
  if (params.days !== undefined) queryParams.days = params.days;
  return request<MatrixBubble[]>({
    url: '/analytics/risk-matrix',
    params: queryParams,
  });
}

export function fetchPreparationTrend(
  days: number,
  storeId?: string
): Promise<ApiResponse<PreparationTrendPoint[]>> {
  const queryParams: Record<string, unknown> = { days };
  if (storeId !== undefined) queryParams.store_id = storeId;
  return request<PreparationTrendPoint[]>({
    url: '/analytics/preparation-trend',
    params: queryParams,
  });
}

interface FetchTestDriveDistributionParams {
  days?: number;
  weeks?: number;
  storeId?: string;
}

export function fetchTestDriveDistribution(
  params: FetchTestDriveDistributionParams = {}
): Promise<ApiResponse<TestDriveDistributionPoint[]>> {
  const queryParams: Record<string, unknown> = {};
  if (params.days !== undefined) queryParams.days = params.days;
  if (params.weeks !== undefined) queryParams.weeks = params.weeks;
  if (params.storeId !== undefined) queryParams.store_id = params.storeId;
  return request<TestDriveDistributionPoint[]>({
    url: '/analytics/test-drive-distribution',
    params: queryParams,
  });
}

export function fetchQuoteCandles(
  days: number,
  storeId?: string,
  vehicleId?: string
): Promise<ApiResponse<QuoteCandlePoint[]>> {
  const queryParams: Record<string, unknown> = { days };
  if (storeId !== undefined) queryParams.store_id = storeId;
  if (vehicleId !== undefined) queryParams.vehicle_id = vehicleId;
  return request<QuoteCandlePoint[]>({
    url: '/analytics/quote-candles',
    params: queryParams,
  });
}

export function fetchSyncDelayInfo(): Promise<ApiResponse<SyncDelayInfo[]>> {
  return request<SyncDelayInfo[]>({
    url: '/analytics/sync-delay',
  });
}

interface FetchRulesParams extends PaginationParams {
  enabled?: boolean;
}

export function fetchRules(
  params: FetchRulesParams = {}
): Promise<ApiResponse<PaginatedResponse<RuleConfig>>> {
  const queryParams: Record<string, unknown> = {};
  if (params.page !== undefined) queryParams.page = params.page;
  if (params.pageSize !== undefined) queryParams.page_size = params.pageSize;
  if (params.enabled !== undefined) queryParams.enabled = params.enabled;
  return request<PaginatedResponse<RuleConfig>>({
    url: '/rules',
    params: queryParams,
  });
}

export function fetchWarningThresholds(): Promise<ApiResponse<WarningThreshold[]>> {
  return request<WarningThreshold[]>({
    url: '/rules/thresholds/full',
  });
}

export function updateWarningThreshold(
  threshold: Partial<WarningThreshold> & { id: string }
): Promise<ApiResponse<WarningThreshold>> {
  return request<WarningThreshold>({
    url: `/rules/thresholds/${threshold.id}`,
    method: 'put',
    data: threshold,
  });
}

export function toggleWarningThreshold(
  id: string,
  enabled: boolean
): Promise<ApiResponse<WarningThreshold>> {
  return request<WarningThreshold>({
    url: `/rules/thresholds/${id}/toggle`,
    method: 'patch',
    data: { enabled },
  });
}

interface CreateRuleData {
  name: string;
  description?: string;
  expression?: string;
  level?: string;
  enabled?: boolean;
}

export function createRule(
  data: CreateRuleData
): Promise<ApiResponse<RuleConfig>> {
  return request<RuleConfig>({
    url: '/rules',
    method: 'post',
    data,
  });
}

export function deleteRule(id: string): Promise<ApiResponse<void>> {
  return request<void>({
    url: `/rules/${id}`,
    method: 'delete',
  });
}

export function dryRunRule(
  ruleId: string,
  storeId?: string
): Promise<ApiResponse<{ matchedCount: number; matchedVehicles: string[] }>> {
  const queryParams: Record<string, unknown> = {};
  if (storeId !== undefined) queryParams.store_id = storeId;
  return request<{ matchedCount: number; matchedVehicles: string[] }>({
    url: `/rules/${ruleId}/dry-run`,
    method: 'post',
    params: queryParams,
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
