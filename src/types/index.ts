export type WorkOrderPriority = 'urgent' | 'high' | 'normal' | 'low';
export type WorkOrderStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'delayed' | 'rejected';
export type RouteStatus = 'planned' | 'in_progress' | 'completed' | 'delayed';
export type CheckInType = 'arrival' | 'departure' | 'break';
export type TodoType = 'delay' | 'rejection' | 'reassign';
export type TodoPriority = 'urgent' | 'high' | 'normal';
export type TodoStatus = 'pending' | 'processing' | 'resolved';
export type UserRoleType = 'tenant' | 'butler' | 'maintenance' | 'finance';
export type LoadingCategory = 'material' | 'tool';

export interface WorkOrder {
  id: string;
  title: string;
  description: string;
  tenantId: string;
  tenantName: string;
  tenantPhone: string;
  roomId: string;
  roomAddress: string;
  category: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  assignedTo: string;
  routeId: string;
  createdAt: string;
  scheduledAt: string;
  completedAt: string | null;
  photos: string[];
  cost: number | null;
  signatureUrl: string | null;
  receiptPhotos: string[];
  delayReason: string | null;
}

export interface Waypoint {
  orderId: string;
  lat: number;
  lng: number;
  address: string;
  estimatedArrival: string;
  actualArrival: string | null;
  sequence: number;
}

export interface RouteInfo {
  id: string;
  name: string;
  driverId: string;
  driverName: string;
  status: RouteStatus;
  workOrders: string[];
  waypoints: Waypoint[];
  estimatedDuration: number;
  actualDuration: number | null;
  loadingList: LoadingItem[];
  startedAt: string | null;
  completedAt: string | null;
}

export interface CheckIn {
  id: string;
  driverId: string;
  driverName: string;
  orderId: string;
  lat: number;
  lng: number;
  timestamp: string;
  type: CheckInType;
  photoUrl: string | null;
  online: boolean;
}

export interface TrajectoryPoint {
  lat: number;
  lng: number;
  timestamp: string;
  speed: number;
}

export interface LoadingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: LoadingCategory;
  checked: boolean;
}

export interface TodoItem {
  id: string;
  orderId: string;
  orderTitle: string;
  type: TodoType;
  priority: TodoPriority;
  reason: string;
  createdAt: string;
  assignedTo: string;
  assignedName: string;
  attachments: string[];
  status: TodoStatus;
}

export interface UserRole {
  id: string;
  name: string;
  role: UserRoleType;
  accessibleRoutes: string[];
  exportScope: string[];
  sensitiveFields: string[];
}

export interface ReportFilter {
  dimension: 'on_time_rate' | 'date' | 'responsible';
  dateRange: { start: string; end: string };
  responsibleId: string | null;
  groupBy: 'day' | 'week' | 'month';
}

export interface DailyMetric {
  date: string;
  total: number;
  onTime: number;
  delayed: number;
}

export interface ResponsibleMetric {
  id: string;
  name: string;
  total: number;
  onTime: number;
  onTimeRate: number;
}
