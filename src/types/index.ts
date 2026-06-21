import type { SeatStatus, OrderSource, PaymentMethod, OrderStatus, UserRole, AnomalyType } from '@prisma/client';

export interface OccupancyRateSpec {
  calculationMethod: string;
  formula: string;
  excludedSeats: string[];
  dataSources: string[];
  updateTime: Date;
}

export interface DashboardOverview {
  totalSeats: number;
  soldSeats: number;
  occupancyRate: number;
  lockedSeats: number;
  anomalyCount: number;
  lastRefreshedAt: Date;
  occupancyRateSpec: OccupancyRateSpec;
}

export interface SeatTrendDataPoint {
  date: string;
  timestamp: number;
  sold: number;
  locked: number;
  available: number;
  reserved: number;
  cumulativeSold: number;
}

export interface AreaHeatmapData {
  area: string;
  totalSeats: number;
  soldSeats: number;
  occupancyRate: number;
  rows: {
    row: string;
    total: number;
    sold: number;
    rate: number;
  }[];
}

export interface OrderComposition {
  bySource: { name: string; value: number; label: string }[];
  byPaymentMethod: { name: string; value: number; label: string }[];
  byTicketType: { name: string; value: number; label: string }[];
  byDate: { date: string; count: number; amount: number }[];
  totalAmount: number;
  totalOrders: number;
}

export interface TicketTypeDetail {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  discount: number;
  totalStock: number;
  soldCount: number;
  lockedCount: number;
  remainingCount: number;
  occupancyRate: number;
  maxPerOrder: number;
  saleStartTime: Date;
  saleEndTime: Date;
  description: string | null;
  restrictions: string[];
}

export interface LockRecordDetail {
  id: string;
  seatInfo: string;
  area: string;
  row: string;
  seatNumber: string;
  orderNo: string | null;
  operatorName: string;
  lockReason: string;
  lockDuration: number;
  lockedAt: Date;
  expiredAt: Date;
  releasedAt: Date | null;
  isAnomaly: boolean;
  anomalyType: AnomalyType | null;
  anomalyDescription: string | null;
  originalRecordUrl: string | null;
  status: 'active' | 'expired' | 'released';
}

export interface ShareLinkCreateRequest {
  role: UserRole;
  activityIds: string[];
  expiresInHours: number;
}

export interface ShareLinkResponse {
  token: string;
  url: string;
  expiresAt: Date;
  role: UserRole;
}

export interface ExportOptions {
  format: 'xlsx' | 'csv' | 'pdf';
  includeOccupancySpec: boolean;
  sections: string[];
}

export const SeatStatusLabels: Record<SeatStatus, string> = {
  available: '可售',
  locked: '锁座',
  sold: '已售',
  reserved: '预留',
};

export const OrderSourceLabels: Record<OrderSource, string> = {
  online: '线上购票',
  offline: '线下购票',
  partner: '渠道合作',
  staff: '内部员工',
};

export const PaymentMethodLabels: Record<PaymentMethod, string> = {
  alipay: '支付宝',
  wechat: '微信支付',
  card: '银行卡',
  cash: '现金',
  free: '赠票',
};

export const OrderStatusLabels: Record<OrderStatus, string> = {
  pending: '待支付',
  paid: '已支付',
  refunded: '已退款',
  cancelled: '已取消',
};

export const UserRoleLabels: Record<UserRole, string> = {
  admin: '系统管理员',
  manager: '运营经理',
  operator: '运营专员',
  finance: '财务人员',
};

export const AnomalyTypeLabels: Record<AnomalyType, string> = {
  timeout: '锁座超时',
  duplicate: '重复锁座',
  amount_mismatch: '金额异常',
  manual_override: '人工覆盖',
};

export const CHART_COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981',
  accent: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  pink: '#EC4899',
  cyan: '#06B6D4',
  neutral: '#64748B',
};

export const OCCUPANCY_RATE_SPEC: OccupancyRateSpec = {
  calculationMethod: '已售座位数 / (总座位数 - 预留座位数)',
  formula: 'soldSeats / (totalSeats - reservedSeats)',
  excludedSeats: ['VIP预留区A1-A20', '工作人员区B1-B50'],
  dataSources: ['报名表', '支付流水', '票务平台'],
  updateTime: new Date(),
};
