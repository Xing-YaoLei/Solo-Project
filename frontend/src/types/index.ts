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

export enum PickupStatus {
  PendingPickup = 'PendingPickup',
  PickedUp = 'PickedUp',
  OverdueUncollected = 'OverdueUncollected',
}

export interface ProductTag {
  id: number;
  tagCode: string;
  productName: string;
  category?: string | null;
  storageTempMin?: number | null;
  storageTempMax?: number | null;
  shelfLifeHours?: number | null;
  unit?: string | null;
  unitPrice: number;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export interface SettlementSheetItem {
  id: number;
  settlementSheetId: number;
  productTagId: number;
  productTagName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  caliberNote?: string | null;
}

export interface SettlementSheet {
  id: number;
  sheetNo: string;
  groupBatchId: number;
  batchNo: string;
  leaderTierId: number;
  leaderTierName: string;
  totalAmount: number;
  itemCount: number;
  status: SettlementStatus;
  caliberDescription?: string | null;
  items: SettlementSheetItem[];
  settledAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface GroupBatch {
  id: number;
  batchNo: string;
  batchName: string;
  leaderName: string;
  leaderPhone?: string | null;
  leaderTierId: number;
  leaderTierName: string;
  startTime: string;
  endTime: string;
  deliveryTime?: string | null;
  status: BatchStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface ArrivalListItem {
  id: number;
  arrivalListId: number;
  productTagId: number;
  productTagName: string;
  expectedQuantity: number;
  actualQuantity?: number | null;
  temperature?: number | null;
  condition?: string | null;
  remark?: string | null;
  pickupStatus?: PickupStatus | null;
  pickupTime?: string | null;
}

export interface ArrivalList {
  id: number;
  listNo: string;
  groupBatchId: number;
  batchNo: string;
  arrivalTime: string;
  receiver?: string | null;
  status: ArrivalStatus;
  notes?: string | null;
  items: ArrivalListItem[];
  createdAt: string;
  updatedAt?: string | null;
}

export interface LeaderTier {
  id: number;
  tierName: string;
  tierCode: string;
  minOrderAmount: number;
  commissionRate: number;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export interface StatusChangeLog {
  id: number;
  entityId: number;
  entityType: string;
  fromStatus?: string | null;
  toStatus: string;
  changedBy?: string | null;
  changedAt: string;
  remark?: string | null;
}

export interface ExceptionOrder {
  id: number;
  exceptionNo: string;
  groupBatchId: number;
  batchNo: string;
  arrivalListId?: number | null;
  productTagId?: number | null;
  productTagName?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  exceptionType: ExceptionType;
  severity: ExceptionSeverity;
  impactDescription?: string | null;
  responsibility?: string | null;
  resolution: ExceptionResolution;
  resolutionNotes?: string | null;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  statusHistory: StatusChangeLog[];
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}
