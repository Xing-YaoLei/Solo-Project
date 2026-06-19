export type UserRole = 'admin' | 'manager' | 'supervisor' | 'investor';

export interface CleaningPunctuality {
  onTimeCount: number;
  delayedCount: number;
  totalCount: number;
  punctualityRate: number;
  timeRange: { start: Date; end: Date };
  calculationRule: string;
}

export interface CheckinRecord {
  id: string;
  date: string;
  hotelId: string;
  hotelName: string;
  idType: 'id_card' | 'passport' | 'other';
  totalCount: number;
  anomalyCount: number;
  anomalyRate: number;
  anomalyType: string[];
}

export interface DepositRecord {
  id: string;
  orderId: string;
  guestName: string;
  hotelName: string;
  totalAmount: number;
  status: 'collected' | 'refunded' | 'deducted' | 'pending';
  collectedAmount: number;
  refundedAmount: number;
  deductedAmount: number;
  deductionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerMessage {
  id: string;
  sender: 'guest' | 'staff' | 'system';
  content: string;
  timestamp: string;
  attachments?: string | string[];
}

export interface ComplaintEvidence {
  id: string;
  orderId: string;
  guestName: string;
  hotelName: string;
  complaintType: string;
  severity: 'low' | 'medium' | 'high';
  messages: CustomerMessage[];
  relatedRecords: {
    doorLockRecords: string[];
    cleaningRecords: string[];
  };
  createdAt: string;
  resolvedAt?: string;
  status: 'open' | 'processing' | 'resolved';
}

export interface ReviewTag {
  id: string;
  tagName: string;
  count: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  isAnomaly: boolean;
  anomalyReason?: string;
  trend: 'up' | 'down' | 'stable';
  relatedReviews: string[];
}

export interface DoorLockRecord {
  id: string;
  hotelId: string;
  roomNumber: string;
  eventType: 'checkin' | 'checkout' | 'cleaning' | 'unauthorized';
  timestamp: string;
  operator: string;
  success: boolean;
}

export interface OTAOrder {
  id: string;
  orderNumber: string;
  platform: string;
  hotelName: string;
  guestName: string;
  checkinDate: string;
  checkoutDate: string;
  roomType: string;
  totalAmount: number;
  depositAmount: number;
  status: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  createdAt: string;
}

export interface ShareLink {
  id: string;
  token: string;
  role: UserRole;
  createdBy: string;
  expiresAt?: string;
  password?: string;
  dataScope: {
    hotelIds?: string[];
    timeRange?: { start: string; end: string };
  };
  createdAt: string;
  lastAccessedAt?: string;
  accessCount: number;
}

export interface DataScope {
  role: UserRole;
  hotelIds?: string[];
  timeRange: { start: string; end: string };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  metadata: {
    lastRefreshedAt: string;
    dataScope: DataScope;
    punctualityRate: number;
    calculationRule: string;
  };
}

export interface DashboardMetrics {
  totalOrders: number;
  cleaningPunctualityRate: number;
  complaintRate: number;
  depositAnomalyRate: number;
  reviewAverageScore: number;
  activeHotels: number;
  occupancyRate: number;
  revenueGrowth: number;
}

export interface DashboardSummary {
  metrics: DashboardMetrics;
  punctuality: CleaningPunctuality;
  checkinTrend: CheckinRecord[];
  depositBreakdown: {
    total: number;
    refunded: number;
    deducted: number;
    pending: number;
  };
  recentComplaints: ComplaintEvidence[];
  anomalyTags: ReviewTag[];
}
