export type AppointmentStatus =
  | 'Pending'
  | 'InService'
  | 'PartsShortage'
  | 'DataIncomplete'
  | 'ReviewRequired'
  | 'Completed'
  | 'Closed';

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  Pending: '待进厂',
  InService: '维修中',
  PartsShortage: '配件缺货',
  DataIncomplete: '资料待补',
  ReviewRequired: '升级复核',
  Completed: '已完成',
  Closed: '已关闭',
};

export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  Pending: '#faad14',
  InService: '#1890ff',
  PartsShortage: '#f5222d',
  DataIncomplete: '#722ed1',
  ReviewRequired: '#fa8c16',
  Completed: '#52c41a',
  Closed: '#8c8c8c',
};

export type AppointmentSource = 'WalkIn' | 'Phone' | 'Online';

export const SOURCE_LABELS: Record<AppointmentSource, string> = {
  WalkIn: '到店',
  Phone: '电话',
  Online: '线上',
};

export type QuoteStatus = 'Draft' | 'Confirmed' | 'Rejected';

export type QuoteItemType = 'Labor' | 'Parts';

export type PhotoType = 'CheckIn' | 'InService' | 'Completed';

export type PartsShortageStatus = 'Pending' | 'Arrived' | 'Resolved' | 'Cancelled';

export interface VehicleInfo {
  id: number;
  plateNumber: string;
  vinNumber: string;
  brand: string;
  model: string;
  color?: string;
  mileage: number;
  ownerName: string;
  ownerPhone: string;
  registerDate?: string;
  lastMaintenanceDate?: string;
  repairCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuoteItem {
  id: number;
  name: string;
  type: QuoteItemType;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  remarks?: string;
}

export interface Quote {
  id: number;
  appointmentId: number;
  appointmentNo: string;
  laborCost: number;
  partsCost: number;
  totalAmount: number;
  status: QuoteStatus;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
  quoteItems: QuoteItem[];
}

export interface PhotoRecord {
  id: number;
  appointmentId: number;
  photoUrl: string;
  photoType: PhotoType;
  uploadTime: string;
  uploader?: string;
  remarks?: string;
}

export interface PartsShortageRecord {
  id: number;
  appointmentId: number;
  appointmentNo: string;
  partsId: number;
  partName: string;
  partCode?: string;
  shortageQuantity: number;
  expectedArrivalTime?: string;
  actualArrivalTime?: string;
  status: PartsShortageStatus;
  handler?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceRecord {
  id: number;
  appointmentId: number;
  serviceItem: string;
  technician?: string;
  startTime?: string;
  endTime?: string;
  conclusion?: string;
  createdAt: string;
}

export interface HistoryRecord {
  id: number;
  appointmentNo: string;
  date: string;
  serviceType: string;
  description: string;
  amount: number;
  handler?: string;
  status: AppointmentStatus;
}

export interface Appointment {
  id: number;
  appointmentNo: string;
  vehicleId: number;
  vehicle?: VehicleInfo;
  appointmentTime: string;
  checkInTime?: string;
  completionTime?: string;
  closeTime?: string;
  source: AppointmentSource;
  personInCharge?: string;
  status: AppointmentStatus;
  faultDescription?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentDetail extends Appointment {
  quote?: Quote;
  photos: PhotoRecord[];
  partsShortages: PartsShortageRecord[];
  serviceRecords: ServiceRecord[];
  historyRecords: HistoryRecord[];
}

export interface AppointmentListItem {
  id: number;
  appointmentNo: string;
  vehicleId: number;
  plateNumber: string;
  ownerName: string;
  brand?: string;
  model?: string;
  appointmentTime: string;
  checkInTime?: string;
  source: AppointmentSource;
  personInCharge?: string;
  status: AppointmentStatus;
  faultDescription?: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
}

export interface RepairReturnItem {
  id: number;
  orderNo: string;
  plateNumber: string;
  reworkReason: string;
  date: string;
}

export interface RepairReturnStats {
  rate: number;
  total: number;
  rework: number;
  list: RepairReturnItem[];
}

export interface SourceDistributionItem {
  source: AppointmentSource;
  sourceName: string;
  count: number;
  percentage: number;
}

export interface HandlerRankingItem {
  name: string;
  count: number;
  amount: number;
}

export interface ConclusionDistributionItem {
  name: string;
  value: number;
  percentage: number;
}

export interface StatisticsOverview {
  repairRate: RepairReturnStats;
  sourceDistribution: SourceDistributionItem[];
  handlerRanking: HandlerRankingItem[];
  conclusionDistribution: ConclusionDistributionItem[];
  startDate: string;
  endDate: string;
}

export interface PartsInfo {
  id: number;
  partNumber: string;
  name: string;
  specification?: string;
  stockQuantity: number;
  safetyStock: number;
  unitPrice: number;
  supplier?: string;
  createdAt: string;
  updatedAt: string;
  isLowStock: boolean;
}
