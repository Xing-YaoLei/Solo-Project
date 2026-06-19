export type UserRole = 'advisor' | 'technician' | 'partsClerk' | 'manager';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export type WorkOrderStatus = 'pending' | 'inProgress' | 'completed' | 'cancelled';

export interface WorkOrder {
  id: string;
  orderNumber: string;
  vehicleId: string;
  vehicle?: Vehicle;
  customerId: string;
  customerName: string;
  customerPhone: string;
  advisorId: string;
  advisor?: User;
  technicianId?: string;
  technician?: User;
  status: WorkOrderStatus;
  description: string;
  serviceType: string;
  estimatedHours?: number;
  actualHours?: number;
  partsCost?: number;
  laborCost?: number;
  totalCost?: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface Vehicle {
  id: string;
  licensePlate: string;
  vin?: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  mileage?: number;
  customerId: string;
  customerName: string;
  customerPhone: string;
  lastServiceDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Part {
  id: string;
  partNumber: string;
  name: string;
  description?: string;
  category: string;
  brand?: string;
  price: number;
  cost?: number;
  stockQuantity: number;
  minStockLevel: number;
  unit: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export type PartRequestStatus = 'pending' | 'approved' | 'rejected' | 'fulfilled' | 'cancelled';

export interface PartRequest {
  id: string;
  requestNumber: string;
  workOrderId: string;
  workOrder?: WorkOrder;
  partId: string;
  part?: Part;
  requestedBy: string;
  requestedByUser?: User;
  approvedBy?: string;
  approvedByUser?: User;
  quantity: number;
  status: PartRequestStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  fulfilledAt?: string;
}

export type QualityCheckStatus = 'passed' | 'failed' | 'pending';

export interface QualityCheck {
  id: string;
  workOrderId: string;
  workOrder?: WorkOrder;
  checkedBy: string;
  checkedByUser?: User;
  inspectorId?: string;
  inspector?: User;
  status: QualityCheckStatus;
  result?: 'PASSED' | 'FAILED' | 'NEEDS_REWORK';
  items: QualityCheckItem[];
  overallRating?: number;
  notes?: string;
  photos?: string[];
  remarks?: string;
  checkDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QualityCheckItem {
  id: string;
  name: string;
  description?: string;
  status: QualityCheckStatus;
  notes?: string;
}

export type ReminderType = 'maintenance' | 'service' | 'inspection' | 'custom';

export type ReminderStatus = 'active' | 'completed' | 'cancelled';

export interface MaintenanceReminder {
  id: string;
  vehicleId: string;
  vehicle?: Vehicle;
  customerId: string;
  customerName: string;
  type: ReminderType;
  title: string;
  description?: string;
  reminderDate: string;
  mileageThreshold?: number;
  currentMileage?: number;
  status: ReminderStatus;
  workOrderId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface DashboardStats {
  totalWorkOrders: number;
  pendingWorkOrders: number;
  inProgressWorkOrders: number;
  completedWorkOrders: number;
  totalRevenue: number;
  totalVehicles: number;
  lowStockParts: number;
  pendingPartRequests: number;
  upcomingReminders: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, string[]>;
}

export interface ServiceItem {
  id: string;
  workOrderId: string;
  name: string;
  description?: string;
  hours: number;
  rate: number;
  amount: number;
  technicianId?: string;
  technician?: User;
  createdAt: string;
  updatedAt: string;
}

export interface PartUsage {
  id: string;
  workOrderId: string;
  partId: string;
  part?: Part;
  quantity: number;
  unitPrice: number;
  amount: number;
  partRequestId?: string;
  createdAt: string;
}

export type OperationType =
  | 'created'
  | 'statusChanged'
  | 'technicianAssigned'
  | 'partRequested'
  | 'partApproved'
  | 'partRejected'
  | 'partFulfilled'
  | 'qualityCheckAdded'
  | 'updated'
  | 'deleted';

export interface OperationLog {
  id: string;
  workOrderId?: string;
  partRequestId?: string;
  operatorId: string;
  operator?: User;
  operationType: OperationType;
  description: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
}

export interface RejectReason {
  reason: string;
  rejectedBy: string;
  rejectedAt: string;
}

export interface PartRequestWithDetails extends PartRequest {
  part?: Part;
  workOrder?: WorkOrder;
  requestedByUser?: User;
  approvedByUser?: User;
  rejectReason?: RejectReason;
  isOverdue?: boolean;
  source?: 'inventory' | 'purchase' | 'transfer';
}

export interface QualityCheckWithDetails extends QualityCheck {
  checkedByUser?: User;
  photos?: string[];
  workOrder?: WorkOrder;
}

export interface TechnicianWorkload {
  technicianId: string;
  technicianName: string;
  completedOrders: number;
  totalHours: number;
  totalRevenue: number;
}

export interface ServiceTypeStat {
  type: string;
  count: number;
  revenue: number;
}

export interface RevenueTrendItem {
  date: string;
  revenue: number;
  orders: number;
}

export interface ReworkTrendItem {
  date: string;
  reworkRate: number;
  totalOrders: number;
  reworkOrders: number;
}

export interface StatisticsOverview {
  totalOrders: number;
  completedOrders: number;
  inProgressOrders: number;
  reworkRate: number;
  totalRevenue: number;
  averageOrderValue: number;
}

export interface ReworkOrder {
  id: string;
  orderNumber: string;
  vehicleLicensePlate: string;
  customerName: string;
  originalOrderNumber: string;
  reworkReason: string;
  status: WorkOrderStatus;
  createdAt: string;
}

export interface BatchUpdateRequest {
  ids: string[];
  status?: string;
  technicianId?: string;
}
