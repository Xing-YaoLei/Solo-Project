export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type DocumentType =
  | 'driving_license'
  | 'registration_cert'
  | 'purchase_tax'
  | 'insurance_policy'
  | 'invoice'
  | 'other';

export type TurnoverStage =
  | 'inbound'
  | 'preparation'
  | 'test_drive'
  | 'quoting'
  | 'deal'
  | 'transfer';

export interface Store {
  id: string;
  name: string;
  code: string;
  region: string;
  address: string;
  lng: number;
  lat: number;
  riskScore: number;
  inStockCount: number;
  alertCount: number;
}

export interface Vehicle {
  id: string;
  vin: string;
  plateNumber: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  storeId: string;
  inboundDate: string;
  stage: TurnoverStage;
  stockDays: number;
  documentCompletion: number;
  riskLevel: RiskLevel;
}

export interface DocumentItem {
  id: string;
  vehicleId: string;
  type: DocumentType;
  name: string;
  status: 'present' | 'missing' | 'pending' | 'expired';
  uploadedAt?: string;
  expireAt?: string;
  verified: boolean;
}

export interface Alert {
  id: string;
  vehicleId: string;
  vin: string;
  storeId: string;
  storeName: string;
  documentType?: DocumentType;
  ruleId: string;
  ruleName: string;
  level: RiskLevel;
  message: string;
  triggeredAt: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  resolved: boolean;
  resolvedAt?: string;
  stockDays: number;
}

export interface WarningThreshold {
  id: string;
  documentType: DocumentType;
  name: string;
  warningDays: number;
  criticalDays: number;
  escalationInterval: number;
  enabled: boolean;
  stageRequired?: TurnoverStage;
}

export interface RuleConfig {
  id: string;
  name: string;
  description: string;
  expression: string;
  level: RiskLevel;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MatrixBubble {
  stockAgeBucket: string;
  completionBucket: string;
  count: number;
  riskLevel: RiskLevel;
  vehicleIds: string[];
}

export interface PreparationTrendPoint {
  date: string;
  storeId: string;
  storeName: string;
  completionRate: number;
  avgDays: number;
  documentReadyRate: number;
}

export interface TestDriveDistributionPoint {
  weekStart: string;
  firstTime: number;
  secondTime: number;
  thirdPlus: number;
  conversionRate: number;
  withDocumentsRate: number;
}

export interface QuoteCandlePoint {
  date: string;
  vehicleId?: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
  dealPrice?: number;
}

export interface SyncDelayInfo {
  source: 'vehicle_source' | 'finance' | 'inspector';
  sourceName: string;
  lastSyncAt: string;
  delayHours: number;
  affectedFrom: string;
  affectedTo: string;
  isDelayed: boolean;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  syncDelayInfo?: SyncDelayInfo[];
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
