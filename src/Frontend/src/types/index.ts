export enum MoveOutStatus {
  Pending = 0,
  Scheduled = 1,
  Inspecting = 2,
  AwaitingPayment = 3,
  OverdueRent = 4,
  Completed = 5,
  Cancelled = 6,
}

export enum InspectionItemStatus {
  NotChecked = 0,
  Normal = 1,
  MinorDamage = 2,
  MajorDamage = 3,
  Missing = 4,
}

export enum PaymentType {
  Rent = 0,
  Utility = 1,
  DepositRefund = 2,
  DamageCompensation = 3,
  LateFee = 4,
  Other = 5,
}

export enum PaymentMethod {
  BankTransfer = 0,
  Alipay = 1,
  WeChatPay = 2,
  Cash = 3,
  Card = 4,
}

export enum TodoStatus {
  Pending = 0,
  InProgress = 1,
  Completed = 2,
  Overdue = 3,
  Cancelled = 4,
}

export enum TodoPriority {
  Low = 0,
  Medium = 1,
  High = 2,
  Urgent = 3,
}

export enum RoleType {
  Inspector = 0,
  PropertyManager = 1,
  FinancialStaff = 2,
  CustomerService = 3,
  MaintenanceStaff = 4,
  Supervisor = 5,
  Administrator = 99,
}

export enum TimelineEventType {
  Created = 0,
  StatusChanged = 1,
  NoteAdded = 2,
  AttachmentUploaded = 3,
  HandlerAssigned = 4,
  HandlerChanged = 5,
  InspectionDone = 6,
  PaymentRecorded = 7,
  UtilityRecorded = 8,
  ComplaintTagged = 9,
  OverdueRecorded = 10,
  ResponsibilityAdjusted = 11,
  CustomAction = 99,
}

export enum ResponsibilityParty {
  Tenant = 0,
  Landlord = 1,
  PropertyManagement = 2,
  ThirdParty = 3,
  NaturalWear = 4,
}

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
}

export interface PagedQuery {
  pageNumber?: number
  pageSize?: number
  sortBy?: string
  sortDirection?: string
  searchKeyword?: string
}

export interface MoveOutOrderListDto {
  id: string
  orderNumber: string
  apartmentNumber: string
  building: string
  tenantName: string
  tenantPhone: string
  moveOutDate: string
  actualMoveOutDate?: string | null
  status: MoveOutStatus
  assignedHandlerName?: string | null
  createdAt: string
  totalDeduction?: number | null
  finalRefund?: number | null
  hasOverdueRent: boolean
  pendingTodos: number
}

export interface SourceRecordDto {
  id: string
  sourceType: string
  sourceId: string
  sourceName: string
  originalData?: string | null
  remarks?: string | null
  createdAt: string
}

export interface MoveOutOrderDetailDto {
  id: string
  orderNumber: string
  apartmentId: string
  apartmentNumber: string
  building: string
  floor: string
  address: string
  tenantId: string
  tenantName: string
  tenantPhone: string
  tenantEmail?: string | null
  leaseStartDate?: string | null
  leaseEndDate?: string | null
  monthlyRent: number
  deposit: number
  moveOutDate: string
  actualMoveOutDate?: string | null
  inspectionDate?: string | null
  status: MoveOutStatus
  assignedHandlerId?: string | null
  assignedHandlerName?: string | null
  assignedHandlerPhone?: string | null
  coHandlerId?: string | null
  coHandlerName?: string | null
  reason?: string | null
  totalDeduction?: number | null
  finalRefund?: number | null
  reviewResult?: string | null
  completedAt?: string | null
  createdAt: string
  createdBy: string
  sourceRecords: SourceRecordDto[]
}

export interface MoveOutOrderQueryDto extends PagedQuery {
  status?: MoveOutStatus | null
  assignedHandlerId?: string | null
  moveOutDateFrom?: string | null
  moveOutDateTo?: string | null
  building?: string | null
  hasOverdueRent?: boolean | null
}

export interface CreateMoveOutOrderDto {
  apartmentId: string
  tenantId: string
  moveOutDate: string
  assignedHandlerId?: string | null
  coHandlerId?: string | null
  reason?: string | null
  sourceRecords: CreateSourceRecordDto[]
}

export interface CreateSourceRecordDto {
  sourceType: string
  sourceId: string
  sourceName: string
  originalData?: string | null
  remarks?: string | null
}

export interface UpdateMoveOutOrderDto {
  moveOutDate?: string | null
  actualMoveOutDate?: string | null
  inspectionDate?: string | null
  status?: MoveOutStatus | null
  assignedHandlerId?: string | null
  coHandlerId?: string | null
  reason?: string | null
  reviewResult?: string | null
}

export interface TodoTaskDto {
  id: string
  taskNo: string
  moveOutOrderId?: string | null
  orderNumber?: string | null
  apartmentNumber?: string | null
  title: string
  description?: string | null
  status: TodoStatus
  priority: TodoPriority
  category?: string | null
  assignedToId: string
  assignedToName?: string | null
  createdByName?: string | null
  dueDate: string
  startedAt?: string | null
  completedAt?: string | null
  result?: string | null
  attachmentUrls?: string[] | null
  createdAt: string
}

export interface CreateTodoTaskDto {
  moveOutOrderId?: string | null
  title: string
  description?: string | null
  priority?: TodoPriority
  category?: string | null
  assignedToId: string
  dueDate: string
  attachmentUrls?: string[] | null
}

export interface UpdateTodoTaskDto {
  status?: TodoStatus | null
  description?: string | null
  dueDate?: string | null
  result?: string | null
  attachmentUrls?: string[] | null
}

export interface TodoQueryDto extends PagedQuery {
  status?: TodoStatus | null
  priority?: TodoPriority | null
  assignedToId?: string | null
  dueDateFrom?: string | null
  dueDateTo?: string | null
  searchKeyword?: string | null
}

export interface StaffDto {
  id: string
  name: string
  employeeId: string
  phone: string
  email?: string | null
  role: RoleType
  department: string
  isActive: boolean
}

export interface TimelineEventDto {
  id: string
  eventType: TimelineEventType
  title: string
  description?: string | null
  previousValue?: string | null
  newValue?: string | null
  notes?: string | null
  attachmentUrls?: string[] | null
  actorId?: string | null
  actorName?: string | null
  eventTime: string
  referenceId?: string | null
  referenceType?: string | null
}

export interface CreateTimelineNoteDto {
  moveOutOrderId: string
  notes: string
  attachmentUrls?: string[] | null
}

export interface RepairDurationAnalysisDto {
  category: string
  totalRepairs: number
  averageDurationHours: number
  minDurationHours: number
  maxDurationHours: number
  totalActualCost: number
  averageActualCost: number
}

export interface RepairRecordDto {
  id: string
  moveOutOrderId: string
  orderNumber?: string | null
  apartmentNumber?: string | null
  inspectionRecordId?: string | null
  repairItem: string
  category: string
  description: string
  estimatedCost: number
  actualCost: number
  reportedAt?: string | null
  startedAt?: string | null
  completedAt?: string | null
  durationHours?: number | null
  assignedToName?: string | null
  responsibility: ResponsibilityParty
  status?: string | null
  remarks?: string | null
  photoUrls?: string[] | null
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  code?: number
}

export interface UtilityReadingDto {
  id: string
  moveOutOrderId: string
  utilityType: string
  previousReading: number
  currentReading: number
  unit?: string | null
  usageAmount?: number | null
  unitPrice?: number | null
  totalAmount?: number | null
  readingDate: string
  remarks?: string | null
  createdBy?: string | null
  createdAt: string
}

export interface UtilitySummaryDto {
  totalCount: number
  totalAmount: number
  waterCount: number
  waterAmount: number
  electricCount: number
  electricAmount: number
  gasCount: number
  gasAmount: number
  otherCount: number
  otherAmount: number
}

export interface CreateUtilityReadingDto {
  moveOutOrderId: string
  utilityType: string
  previousReading: number
  currentReading: number
  unit?: string | null
  usageAmount?: number | null
  unitPrice?: number | null
  totalAmount?: number | null
  readingDate: string
  remarks?: string | null
}

export interface InspectionItemDto {
  id: string
  moveOutOrderId: string
  category: string
  itemName: string
  location?: string | null
  status: InspectionItemStatus
  description?: string | null
  estimatedCost?: number | null
  responsibility?: ResponsibilityParty | null
  photoUrls?: string[] | null
  inspectedBy?: string | null
  inspectedAt?: string | null
  createdAt: string
}

export interface InspectionRecordDto {
  id: string
  moveOutOrderId: string
  recordNumber: string
  inspectorName?: string | null
  inspectionDate: string
  overallCondition?: string | null
  totalEstimatedCost?: number | null
  items: InspectionItemDto[]
  remarks?: string | null
  attachments?: string[] | null
  createdAt: string
}

export interface InspectionSummaryDto {
  totalRecords: number
  totalItems: number
  normalCount: number
  minorDamageCount: number
  majorDamageCount: number
  missingCount: number
  notCheckedCount: number
  totalEstimatedCost: number
}

export interface CreateInspectionRecordDto {
  moveOutOrderId: string
  inspectorId?: string | null
  inspectionDate: string
  overallCondition?: string | null
  remarks?: string | null
  items: CreateInspectionItemDto[]
}

export interface CreateInspectionItemDto {
  category: string
  itemName: string
  location?: string | null
  status: InspectionItemStatus
  description?: string | null
  estimatedCost?: number | null
  responsibility?: ResponsibilityParty | null
  photoUrls?: string[] | null
}

export interface PaymentRecordDto {
  id: string
  moveOutOrderId: string
  paymentNumber: string
  paymentType: PaymentType
  paymentMethod: PaymentMethod
  amount: number
  payerName?: string | null
  payeeName?: string | null
  transactionNo?: string | null
  paymentDate: string
  remarks?: string | null
  attachments?: string[] | null
  createdBy?: string | null
  createdAt: string
}

export interface PaymentSummaryDto {
  totalCount: number
  totalAmount: number
  rentAmount: number
  utilityAmount: number
  depositRefundAmount: number
  damageCompensationAmount: number
  lateFeeAmount: number
  otherAmount: number
}

export interface CreatePaymentRecordDto {
  moveOutOrderId: string
  paymentType: PaymentType
  paymentMethod: PaymentMethod
  amount: number
  payerName?: string | null
  payeeName?: string | null
  transactionNo?: string | null
  paymentDate: string
  remarks?: string | null
  attachments?: string[] | null
}

export interface ComplaintTagDto {
  id: string
  moveOutOrderId: string
  tagType: string
  description: string
  severity: number
  taggedBy?: string | null
  taggedAt: string
  resolved?: boolean
  resolvedAt?: string | null
  resolutionNotes?: string | null
  remarks?: string | null
}

export interface ComplaintSummaryDto {
  totalCount: number
  unresolvedCount: number
  resolvedCount: number
  highSeverityCount: number
  mediumSeverityCount: number
  lowSeverityCount: number
}

export interface CreateComplaintTagDto {
  moveOutOrderId: string
  tagType: string
  description: string
  severity: number
  remarks?: string | null
}

export enum PartyType {
  Tenant = 0,
  Landlord = 1,
  PropertyManagement = 2,
  Neighbor = 3,
  ThirdPartyService = 4,
  Other = 99,
}

export enum ApprovalStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
}

export interface AffectedPartyDto {
  id: string
  overdueId: string
  partyType: PartyType
  partyName: string
  role: string
  contactInfo: string
  impactDescription: string
  hasSupplement: boolean
  supplementNote?: string | null
  supplementedBy?: string | null
  supplementedAt?: string | null
}

export interface ResponsibilityAdjustmentDto {
  id: string
  overdueId: string
  originalResponsibility: ResponsibilityParty
  newResponsibility: ResponsibilityParty
  adjustReason: string
  adjustedById: string
  adjustedByName: string
  adjustedAt: string
  approverId?: string | null
  approverName?: string | null
  approvalStatus: ApprovalStatus
  approvalNote?: string | null
  approvedAt?: string | null
}

export interface RentOverdueRecordDto {
  id: string
  orderId: string
  orderNumber: string
  tenantName: string
  overdueAmount: number
  overdueDays: number
  dueDate: string
  reportedAt: string
  isResolved: boolean
  affectedParties: AffectedPartyDto[]
  responsibilityAdjustments: ResponsibilityAdjustmentDto[]
}

export interface RentOverdueQueryDto extends PagedQuery {
  isResolved?: boolean | null
  reportedAtFrom?: string | null
  reportedAtTo?: string | null
}

export interface CreateRentOverdueRecordDto {
  orderId: string
  overdueAmount: number
  dueDate: string
  affectedParties: CreateAffectedPartyDto[]
}

export interface CreateAffectedPartyDto {
  partyType: PartyType
  partyName: string
  role: string
  contactInfo: string
  impactDescription: string
}

export interface SupplementAffectedPartyDto {
  supplementNote: string
}

export interface AdjustResponsibilityDto {
  originalResponsibility: ResponsibilityParty
  newResponsibility: ResponsibilityParty
  adjustReason: string
}
