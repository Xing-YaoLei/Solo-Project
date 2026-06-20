export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  success: boolean;
  timestamp?: number;
}

export interface PageInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PageResponse<T> {
  items: T[];
  pageInfo: PageInfo;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export type CompareMode = 'none' | 'yoy' | 'mom';

export interface KPIOverview {
  totalTickets: number;
  totalTicketsChange: number;
  soldRate: number;
  soldRateChange: number;
  checkinRate: number;
  checkinRateChange: number;
  sponsorshipCompletionRate: number;
  sponsorshipCompletionRateChange: number;
  refundRate: number;
  refundRateChange: number;
}

export interface KPITrendPoint {
  date: string;
  fulfillmentRate: number;
  anomalyWarning: number;
}

export type PipelineStatusKey =
  | 'pending'
  | 'synced'
  | 'verified'
  | 'completed'
  | 'failed';

export interface PipelineStatus {
  taskCode: string;
  taskName: string;
  sourceType: string;
  lastSyncTime?: string;
  lastSyncCount: number;
  status: string;
  delaySeconds: number;
}

export interface SyncLog {
  id: string;
  taskCode: string;
  level: string;
  message: string;
  detail?: string;
  createdAt: string;
}

export interface SeatHeatmapItem {
  areaCode: string;
  areaName: string;
  totalSeats: number;
  soldSeats: number;
  salesRate: number;
  salesRateYoy?: number;
  salesRateMom?: number;
  polygonGeom?: string;
}

export interface CheckinTrendPoint {
  date: string;
  generatedCount: number;
  checkedCount: number;
  generatedYoy?: number;
  generatedMom?: number;
  checkedYoy?: number;
  checkedMom?: number;
}

export interface SponsorshipItem {
  id: string;
  sponsorId: string;
  sponsorName: string;
  sponsorLevel: string;
  benefitType: string;
  contractQty: number;
  fulfilledQty: number;
  completionRate: number;
  status: string;
  deadline: string;
  riskTag?: string;
}

export interface FulfillmentRecord {
  id: string;
  fulfilledAt: string;
  quantity: number;
  recipient: string;
  remark?: string;
}

export interface SponsorshipDetail {
  id: string;
  sponsorId: string;
  sponsorName: string;
  sponsorLevel: string;
  sponsorContact: string;
  benefitType: string;
  contractQty: number;
  fulfilledQty: number;
  completionRate: number;
  status: string;
  deadline: string;
  fulfillmentRecords: FulfillmentRecord[];
}

export interface VerificationEfficiency {
  gateNo: string;
  totalCheckins: number;
  avgProcessingSeconds: number;
  efficiencyScore: number;
  group: string;
}

export interface VerificationDatePoint {
  date: string;
  checkinCount: number;
  checkinRate: number;
}

export interface VerificationAreaItem {
  areaCode: string;
  areaName: string;
  checkinCount: number;
  checkinRate: number;
}

export interface VerificationDefinitionRule {
  title: string;
  formula: string;
  dataSource: string;
  exceptionRules: string[];
  example: string;
}

export interface TicketRankItem {
  ruleId: string;
  ruleName: string;
  ticketType: string;
  price: number;
  soldCount: number;
  soldRatio: number;
  rank: number;
  purchaseLimit?: string;
  restrictionConditions?: string;
  applicableAreas?: string;
}

export interface RefundDistributionPoint {
  date: string;
  refundCount: number;
  refundAmount: number;
  disputedCount: number;
  disputedPoints: DisputedPointMeta[];
}

export interface DisputedPointMeta {
  id: string;
  refundId: string;
  reason: string;
  isDisputed: boolean;
  amount: number;
}

export interface RefundSample {
  id: string;
  paymentId: string;
  registrationId: string;
  registrantName: string;
  registrantPhone: string;
  ticketType: string;
  originalAmount: number;
  refundAmount: number;
  reason: string;
  isDisputed: boolean;
  disputeNote?: string;
  refundedAt: string;
  orderNo: string;
  paymentChannel: string;
  paidAt: string;
  gateRecord?: GateRecord;
  operationLogs: OperationLog[];
  processed?: boolean;
}

export interface GateRecord {
  gateNo?: string;
  checkinTime?: string;
  deviceId?: string;
  status?: string;
}

export interface OperationLog {
  stage: string;
  time: string;
  operator?: string;
  note?: string;
}

export interface RefundSummary {
  totalCount: number;
  totalAmount: number;
  disputedCount: number;
  disputedResolutionRate: number;
}
