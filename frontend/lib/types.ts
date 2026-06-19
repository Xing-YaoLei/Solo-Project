export type UserRole = 'ADVISOR' | 'TECHNICIAN' | 'PARTS_CLERK' | 'MANAGER';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: {
    id: string;
    name: string;
    code: UserRole;
  };
  permissions: string[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export type WorkOrderStatus = 'PENDING' | 'IN_PROGRESS' | 'WAITING_PARTS' | 'QUALITY_CHECK' | 'COMPLETED' | 'CANCELLED';

export interface WorkOrder {
  id: string;
  orderNumber: string;
  vehicleId: string;
  vehicle?: Vehicle;
  advisorId: string;
  advisor?: { id: string; name: string; username?: string; phone?: string };
  technicianId?: string;
  technician?: { id: string; name: string; username?: string; phone?: string };
  status: WorkOrderStatus;
  mileageIn?: number;
  mileageOut?: number;
  complaint?: string;
  diagnosis?: string;
  quoteAmount: number;
  actualAmount: number;
  startTime?: string;
  endTime?: string;
  remarks?: string;
  items?: WorkOrderItem[];
  partRequests?: PartRequest[];
  qualityChecks?: QualityCheck[];
  logs?: WorkOrderLog[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkOrderItem {
  id: string;
  workOrderId: string;
  itemName: string;
  itemType: string;
  laborHours: number;
  laborAmount: number;
  partAmount: number;
  totalAmount: number;
  remarks?: string;
  sortOrder: number;
  parts?: WorkOrderItemPart[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkOrderItemPart {
  id: string;
  workOrderItemId: string;
  partId: string;
  part?: Part;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  brand: string;
  model: string;
  vin?: string;
  year?: number;
  color?: string;
  mileage: number;
  engineNumber?: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail?: string;
  ownerAddress?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Part {
  id: string;
  partNumber: string;
  name: string;
  category?: string;
  specification?: string;
  unit: string;
  stock: number;
  minStock: number;
  unitPrice: number;
  supplier?: string;
  supplierPhone?: string;
  location?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export type PartRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCURING' | 'COMPLETED';
export type PartRequestSource = 'INVENTORY' | 'PROCUREMENT' | 'TRANSFER';

export interface PartRequest {
  id: string;
  requestNumber: string;
  workOrderId: string;
  workOrder?: { id: string; orderNumber: string; vehicle?: Vehicle };
  partId: string;
  part?: Part;
  quantity: number;
  status: PartRequestStatus;
  source?: PartRequestSource;
  beforeMaterial?: string;
  afterMaterial?: string;
  handlerId?: string;
  handledAt?: string;
  handlingNotes?: string;
  requesterId?: string;
  histories?: PartRequestHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface PartRequestHistory {
  id: string;
  partRequestId: string;
  oldStatus: string;
  newStatus: string;
  beforeMaterial?: string;
  afterMaterial?: string;
  source?: string;
  conclusion?: string;
  handlerId?: string;
  handlingNotes?: string;
  changedAt: string;
}

export type QualityCheckResult = 'PASSED' | 'FAILED' | 'NEEDS_REWORK';

export interface QualityCheck {
  id: string;
  workOrderId: string;
  workOrder?: WorkOrder;
  inspectorId: string;
  inspector?: { id: string; name: string };
  result: QualityCheckResult;
  photos: string[];
  remarks?: string;
  checkDate: string;
  createdAt: string;
  updatedAt: string;
}

export type MaintenanceType = 'OIL_CHANGE' | 'TIRE_ROTATION' | 'BRAKE_SERVICE' | 'TRANSMISSION_SERVICE' | 'COOLANT_SERVICE' | 'BATTERY_CHECK' | 'TIMING_BELT' | 'GENERAL_INSPECTION' | 'CUSTOM';

export interface MaintenanceReminder {
  id: string;
  vehicleId: string;
  vehicle?: Vehicle;
  type: MaintenanceType;
  description?: string;
  lastMileage?: number;
  lastDate?: string;
  nextMileage?: number;
  nextDate?: string;
  isCompleted: boolean;
  responsibleId?: string;
  responsible?: { id: string; name: string };
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export type WorkOrderLogType = 'CREATED' | 'STATUS_CHANGED' | 'ASSIGNED' | 'UPDATED' | 'PART_REQUESTED' | 'QUALITY_CHECK' | 'COMPLETED' | 'CANCELLED';

export interface WorkOrderLog {
  id: string;
  workOrderId: string;
  operatorId: string;
  operator?: { id: string; name: string };
  type: WorkOrderLogType;
  content: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
}

export interface DashboardStats {
  total: number;
  inProgress: number;
  waitingParts: number;
  completed: number;
  todayRevenue: number;
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

export interface BatchUpdateRequest {
  ids: string[];
  status?: string;
  technicianId?: string;
  operatorId?: string;
}

export interface StatisticsOverview {
  totalOrders: number;
  completedOrders: number;
  inProgressOrders: number;
  reworkRate: number;
  totalRevenue: number;
  averageOrderValue: number;
}

export interface RevenueTrendItem {
  date: string;
  revenue: number;
  orderCount: number;
}

export interface ReworkRateData {
  totalCompletedVehicles: number;
  reworkVehicleCount: number;
  reworkRate: number;
  reworkVehicles: string[];
}

export interface TechnicianWorkload {
  technicianId: string;
  technicianName: string;
  totalOrders: number;
  completedOrders: number;
  totalLaborHours: number;
}

export interface ServiceItemStat {
  itemName: string;
  itemType: string;
  count: number;
  totalLaborHours: number;
  totalLaborAmount: number;
  totalPartAmount: number;
  totalAmount: number;
}

export interface PartUsageStat {
  partId: string;
  partName: string;
  partNumber: string;
  category?: string;
  unit?: string;
  totalQuantity: number;
  totalAmount: number;
  usageCount: number;
}

export interface KanbanStats {
  pending: number;
  approved: number;
  rejected: number;
  procuring: number;
  completed: number;
  timeout: number;
  total: number;
}
