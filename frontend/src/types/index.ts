export enum BatchStatus {
  Draft = 'Draft',
  Open = 'Open',
  Closed = 'Closed',
  Delivering = 'Delivering',
  Delivered = 'Delivered',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export enum ArrivalStatus {
  Pending = 'Pending',
  PartialArrival = 'PartialArrival',
  Arrived = 'Arrived',
  Inspected = 'Inspected',
  Exception = 'Exception',
}

export enum SettlementStatus {
  Pending = 'Pending',
  Calculating = 'Calculating',
  Confirmed = 'Confirmed',
  Settled = 'Settled',
  Disputed = 'Disputed',
}

export enum ExceptionSeverity {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical',
}

export enum ExceptionResolution {
  Pending = 'Pending',
  Refunded = 'Refunded',
  Reshipped = 'Reshipped',
  Discarded = 'Discarded',
  Compromised = 'Compromised',
}

export enum ExceptionType {
  Uncollected = 'Uncollected',
  Damaged = 'Damaged',
  TemperatureAbnormal = 'TemperatureAbnormal',
  QuantityMismatch = 'QuantityMismatch',
}

export interface ProductTag {
  id: number;
  tagCode: string;
  productName: string;
  category: string;
  storageTempMin: number;
  storageTempMax: number;
  shelfLifeHours: number;
  unit: string;
  unitPrice: number;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SettlementSheetItem {
  id: number;
  settlementSheetId: number;
  productTagId: number;
  productTagName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  caliberNote: string;
}

export interface SettlementSheet {
  id: number;
  sheetNo: string;
  groupBatchId: number;
  batchNo: string;
  leaderTierName: string;
  totalAmount: number;
  itemCount: number;
  status: SettlementStatus;
  caliberDescription: string;
  items: SettlementSheetItem[];
  createdAt: string;
  updatedAt: string;
}

export interface GroupBatch {
  id: number;
  batchNo: string;
  batchName: string;
  leaderName: string;
  leaderTierId: number;
  leaderTierName: string;
  startTime: string;
  endTime: string;
  deliveryTime: string;
  status: BatchStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ArrivalListItem {
  id: number;
  arrivalListId: number;
  productTagId: number;
  productTagName: string;
  expectedQuantity: number;
  actualQuantity: number;
  temperature: number;
  condition: string;
  remark: string;
}

export interface ArrivalList {
  id: number;
  listNo: string;
  groupBatchId: number;
  batchNo: string;
  arrivalTime: string;
  receiver: string;
  status: ArrivalStatus;
  items: ArrivalListItem[];
  createdAt: string;
  updatedAt: string;
}

export interface LeaderTier {
  id: number;
  tierName: string;
  tierCode: string;
  minOrderAmount: number;
  commissionRate: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StatusChangeLog {
  id: number;
  entityId: number;
  entityType: string;
  fromStatus: string;
  toStatus: string;
  changedBy: string;
  changedAt: string;
  remark: string;
}

export interface ExceptionOrder {
  id: number;
  exceptionNo: string;
  groupBatchId: number;
  batchNo: string;
  exceptionType: ExceptionType;
  severity: ExceptionSeverity;
  impactDescription: string;
  responsibility: string;
  resolution: ExceptionResolution;
  resolutionNotes: string;
  resolvedBy: string;
  resolvedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}
