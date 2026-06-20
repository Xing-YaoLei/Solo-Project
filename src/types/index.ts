export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T | null;
}

export interface KPIData {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  yoyChange: number;
  momChange: number;
}

export interface TrendDataPoint {
  date: string;
  value: number;
  seriesName: string;
}

export interface SponsorshipRight {
  id: string;
  name: string;
  sponsor: string;
  totalQuantity: number;
  usedQuantity: number;
  usageRate: number;
  category: string;
}

export interface TicketType {
  id: string;
  name: string;
  price: number;
  benefits: string[];
  salesVolume: number;
  revenue: number;
  verificationRate: number;
}

export interface OrderData {
  orderId: string;
  ticketTypeId: string;
  ticketTypeName: string;
  buyerName: string;
  buyerPhone: string;
  amount: number;
  status: string;
  createTime: string;
  verifyTime: string | null;
  seatId: string | null;
  checkInCode: string | null;
}

export interface SeatData {
  seatId: string;
  row: string;
  col: number;
  area: string;
  status: 'available' | 'sold' | 'reserved' | 'used';
  price: number;
  orderId: string | null;
}

export interface AreaData {
  areaId: string;
  areaName: string;
  totalSeats: number;
  soldSeats: number;
  avgPrice: number;
  revenue: number;
}

export interface VerificationData {
  dimension: string;
  dimensionValue: string;
  totalTickets: number;
  verifiedTickets: number;
  verificationRate: number;
  avgVerifyTime: number;
  caliberVersion: string;
}

export interface CaliberVersion {
  version: string;
  name: string;
  formula: string;
  description: string;
  effectiveDate: string;
  changeReason: string;
}

export interface PaymentRecord {
  transactionId: string;
  amount: number;
  payTime: string;
  payMethod: string;
  status: string;
}

export interface CheckInRecord {
  checkInCode: string;
  scanTime: string;
  scanner: string;
  location: string;
  status: string;
}

export interface GateRecord {
  recordId: string;
  gateCode: string;
  passTime: string;
  direction: 'in' | 'out';
  deviceId: string;
}

export interface RefundDispute {
  disputeId: string;
  orderId: string;
  buyerName: string;
  amount: number;
  reason: string;
  status: 'pending' | 'processing' | 'resolved' | 'rejected';
  createTime: string;
  checkInCode: string | null;
  hasGateRecord: boolean;
  hasPaymentRecord: boolean;
}

export interface SampleDetail {
  orderId: string;
  paymentRecord: PaymentRecord | null;
  checkInRecord: CheckInRecord | null;
  gateRecord: GateRecord | null;
}

export interface SyncBatch {
  batchId: string;
  source: 'ticket_platform' | 'gate_record' | 'payment_flow';
  status: 'pending' | 'running' | 'success' | 'failed';
  totalRecords: number;
  processedRecords: number;
  startTime: string;
  endTime: string | null;
  errorMessage: string | null;
  syncDate: string;
}

export interface SyncTask {
  taskId: string;
  name: string;
  source: string;
  cronExpression: string;
  lastRunTime: string | null;
  nextRunTime: string;
  status: 'active' | 'paused' | 'error';
}

export interface CheckInCodeCaliber {
  version: string;
  name: string;
  formula: string;
  description: string;
  effectiveDate: string;
}
