export enum OrderSource {
  PHONE = 'PHONE',
  APP = 'APP',
  WECHAT = 'WECHAT',
  WALK_IN = 'WALK_IN',
  MAINTENANCE_TEAM = 'MAINTENANCE_TEAM',
}

export enum OrderStatus {
  CREATED = 'CREATED',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  PENDING_SUPPLEMENT = 'PENDING_SUPPLEMENT',
  UNDER_REVIEW = 'UNDER_REVIEW',
  CLOSED = 'CLOSED',
}

export enum DelayReason {
  TRAFFIC = 'TRAFFIC',
  MATERIAL_SHORTAGE = 'MATERIAL_SHORTAGE',
  PREVIOUS_TASK_OVERRUN = 'PREVIOUS_TASK_OVERRUN',
  PERSONNEL_ISSUE = 'PERSONNEL_ISSUE',
  WEATHER = 'WEATHER',
  OTHER = 'OTHER',
}

export enum ReviewTag {
  ON_TIME = 'ON_TIME',
  DELAYED = 'DELAYED',
  HIGH_QUALITY = 'HIGH_QUALITY',
  NEEDS_IMPROVEMENT = 'NEEDS_IMPROVEMENT',
  CUSTOMER_COMPLAINT = 'CUSTOMER_COMPLAINT',
  EXCELLENT_SERVICE = 'EXCELLENT_SERVICE',
}

export interface RepairPerson {
  id: string;
  name: string;
  phone: string;
  skill: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Material {
  id: string;
  name: string;
  sku: string;
  unit: string;
  price: number;
  stock: number;
  isCommon: boolean;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderMaterial {
  id: string;
  orderId: string;
  materialId: string;
  material: Material;
  quantity: number;
  usedAt: string | null;
  createdAt: string;
}

export interface DelayRecord {
  id: string;
  orderId: string;
  routeId?: string | null;
  route?: RoutePlan | null;
  reason: DelayReason;
  detail: string;
  duration: number;
  reportedAt: string;
  reporterId: string;
  createdAt: string;
}

export interface RoutePlan {
  id: string;
  orderId: string;
  sequence: number;
  fromLocation: string;
  toLocation: string;
  planDeparture: string;
  planArrival: string;
  actualDeparture: string | null;
  actualArrival: string | null;
  distanceKm: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface SignoffProof {
  id: string;
  orderId: string;
  signature: string | null;
  photoUrls: string[];
  remark: string | null;
  signedBy: string;
  signedAt: string;
  createdAt: string;
}

export interface StatusLog {
  id: string;
  orderId: string;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  operatorId: string;
  remark: string | null;
  createdAt: string;
}

export interface RepairOrder {
  id: string;
  orderNo: string;
  source: OrderSource;
  apartmentNo: string;
  tenantName: string;
  tenantPhone: string;
  faultType: string;
  faultDesc: string;
  status: OrderStatus;
  priority: number;
  assignPersonId: string | null;
  assignPerson: RepairPerson | null;
  planStartTime: string | null;
  planEndTime: string | null;
  actualStartTime: string | null;
  actualEndTime: string | null;
  isOnTime: boolean | null;
  delayRecords: DelayRecord[];
  routePlans: RoutePlan[];
  signoffProof: SignoffProof | null;
  statusLogs: StatusLog[];
  materials: OrderMaterial[];
  reviewTags: ReviewTag[];
  closeRemark: string | null;
  closeTime: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface StatisticsOverview {
  totalOrders: number;
  completedOrders: number;
  onTimeOrders: number;
  delayedOrders: number;
  pendingCount: number;
  inProgressCount: number;
  onTimeRate: number;
  delayRate: number;
}

export interface SourceStats {
  source: OrderSource;
  count: number;
  closed: number;
  onTime: number;
  onTimeRate: number;
}

export interface PersonStats {
  personId: string;
  personName: string;
  total: number;
  completed: number;
  onTime: number;
  delayed: number;
  onTimeRate: number;
}

export interface ReviewTagStats {
  tag: ReviewTag;
  count: number;
}

export interface DelayReasonStats {
  reason: DelayReason;
  count: number;
  totalDuration: number;
  avgDuration: number;
}

export interface DailyTrendStats {
  date: string;
  total: number;
  completed: number;
  onTime: number;
  onTimeRate: number;
}
