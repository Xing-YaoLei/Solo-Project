export enum VerificationStatus {
  Pending = 'Pending',
  Assigned = 'Assigned',
  InProgress = 'InProgress',
  Confirmed = 'Confirmed',
  Supplemented = 'Supplemented',
  Closed = 'Closed',
  Cancelled = 'Cancelled',
  Damaged = 'Damaged',
  Overdue = 'Overdue',
}

export enum VerificationStage {
  Entry = 'Entry',
  Action = 'Action',
  Review = 'Review',
}

export enum DamageSeverity {
  Minor = 'Minor',
  Moderate = 'Moderate',
  Major = 'Major',
  Critical = 'Critical',
}

export enum ResponsibleParty {
  Rider = 'Rider',
  Sender = 'Sender',
  Receiver = 'Receiver',
  Platform = 'Platform',
  Undetermined = 'Undetermined',
}

export enum RiderStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  OnBreak = 'OnBreak',
  Offline = 'Offline',
}

export enum DamageRange {
  SingleItem = 'SingleItem',
  PartialPackage = 'PartialPackage',
  EntirePackage = 'EntirePackage',
  MultiplePackages = 'MultiplePackages',
}

export enum OrderStatus {
  Pending = 'Pending',
  Assigned = 'Assigned',
  PickedUp = 'PickedUp',
  InTransit = 'InTransit',
  Delivered = 'Delivered',
  Cancelled = 'Cancelled',
}

export enum PhotoType {
  Verification = 'Verification',
  Damage = 'Damage',
  Delivery = 'Delivery',
  Other = 'Other',
}

export interface Order {
  id: string;
  orderNumber: string;
  pickupAddress: string;
  deliveryAddress: string;
  senderName: string;
  senderPhone: string;
  receiverName: string;
  receiverPhone: string;
  packageDescription?: string;
  riderId?: string;
  status: OrderStatus;
  scheduledPickupTime?: string;
  actualPickupTime?: string;
  actualDeliveryTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Rider {
  id: string;
  name: string;
  phone: string;
  employeeNo?: string;
  avatarUrl?: string;
  vehicleNumber?: string;
  status: RiderStatus;
  currentLocation?: string;
  rating: number;
  totalDeliveries: number;
  totalVerifications: number;
  damageIncidents: number;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationPhoto {
  id: string;
  verificationRecordId: string;
  photoUrl: string;
  photoType: PhotoType;
  isDamagePhoto: boolean;
  uploadedBy?: string;
  uploadedAt: string;
  remark?: string;
}

export interface VerificationAttachment {
  id: string;
  verificationRecordId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  contentType?: string;
  uploadedBy?: string;
  uploadedAt: string;
}

export interface DamageReport {
  id: string;
  verificationRecordId: string;
  damageRange: DamageRange;
  severity: DamageSeverity;
  damageDescription: string;
  affectedItems: string[];
  initialResponsibility: ResponsibleParty;
  finalResponsibility?: ResponsibleParty;
  responsibilityAdjustedBy?: string;
  responsibilityAdjustedAt?: string;
  supplementaryNotes?: string;
  supplementaryBy?: string;
  supplementaryAt?: string;
  reportedBy?: string;
  reportedAt: string;
}

export interface ReviewRecord {
  id: string;
  verificationRecordId: string;
  reviewer: string;
  reviewedAt: string;
  findings: string;
  actionsTaken?: string;
  conclusion: string;
  followUpRequired: boolean;
  followUpNote?: string;
}

export interface TimePoint {
  id: string;
  verificationRecordId: string;
  pointType: string;
  pointTime: string;
  operatorId?: string;
  operatorName?: string;
  description?: string;
}

export interface VerificationRecord {
  id: string;
  orderId: string;
  recordNo: string;
  stage: VerificationStage;
  status: VerificationStatus;
  assignedTo?: string;
  handlerId?: string;
  handlerName?: string;
  remark?: string;
  ratingTags: string[];
  riderTrajectory?: string;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  supplementedAt?: string;
  closedAt?: string;
  order?: Order;
  rider?: Rider;
  riderId?: string;
  photos: VerificationPhoto[];
  attachments: VerificationAttachment[];
  damageReports: DamageReport[];
  reviews: ReviewRecord[];
  timePoints: TimePoint[];
}

export interface ReviewDto {
  reviewer: string;
  findings: string;
  actionsTaken?: string;
  conclusion: string;
  followUpRequired: boolean;
  followUpNote?: string;
}

export interface RiderActivity {
  riderId: string;
  riderName: string;
  status: RiderStatus;
  totalDeliveries: number;
  totalVerifications: number;
  damageIncidents: number;
  rating: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface ConfirmationDto {
  handlerId?: string;
  handlerName?: string;
  remark?: string;
}

export interface SupplementDto {
  remark?: string;
  ratingTags?: string[];
  files?: File[];
}

export interface CloseDto {
  handlerId?: string;
  handlerName?: string;
  closingRemark?: string;
}

export interface DamageReportDto {
  damageRange: DamageRange;
  severity: DamageSeverity;
  damageDescription: string;
  affectedItems: string[];
  initialResponsibility: ResponsibleParty;
  reportedBy?: string;
}

export interface ResponsibilityAdjustmentDto {
  finalResponsibility: ResponsibleParty;
  adjustmentReason?: string;
  adjustedBy?: string;
  supplementaryNotes?: string;
}

export interface VerificationRecordQuery {
  keyword?: string;
  status?: VerificationStatus;
  stage?: VerificationStage;
  riderId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export const STATUS_LABEL_MAP: Record<VerificationStatus, string> = {
  [VerificationStatus.Pending]: '待确认',
  [VerificationStatus.Assigned]: '待确认',
  [VerificationStatus.InProgress]: '进行中',
  [VerificationStatus.Confirmed]: '已确认',
  [VerificationStatus.Supplemented]: '需补充',
  [VerificationStatus.Closed]: '已关闭',
  [VerificationStatus.Cancelled]: '已取消',
  [VerificationStatus.Damaged]: '损坏',
  [VerificationStatus.Overdue]: '逾期',
};

export const STAGE_LABEL_MAP: Record<VerificationStage, string> = {
  [VerificationStage.Entry]: '录入',
  [VerificationStage.Action]: '动作',
  [VerificationStage.Review]: '复盘',
};

export const DAMAGE_RANGE_LABEL_MAP: Record<DamageRange, string> = {
  [DamageRange.SingleItem]: '单件',
  [DamageRange.PartialPackage]: '部分包裹',
  [DamageRange.EntirePackage]: '整包',
  [DamageRange.MultiplePackages]: '多包裹',
};

export const DAMAGE_SEVERITY_LABEL_MAP: Record<DamageSeverity, string> = {
  [DamageSeverity.Minor]: '轻微',
  [DamageSeverity.Moderate]: '中等',
  [DamageSeverity.Major]: '严重',
  [DamageSeverity.Critical]: '致命',
};

export const RESPONSIBLE_PARTY_LABEL_MAP: Record<ResponsibleParty, string> = {
  [ResponsibleParty.Rider]: '骑手',
  [ResponsibleParty.Sender]: '寄件人',
  [ResponsibleParty.Receiver]: '收件人',
  [ResponsibleParty.Platform]: '平台',
  [ResponsibleParty.Undetermined]: '待定',
};

export const STATUS_COLOR_MAP: Record<VerificationStatus, string> = {
  [VerificationStatus.Pending]: 'orange',
  [VerificationStatus.Assigned]: 'orange',
  [VerificationStatus.InProgress]: 'blue',
  [VerificationStatus.Confirmed]: 'green',
  [VerificationStatus.Supplemented]: 'gold',
  [VerificationStatus.Closed]: 'default',
  [VerificationStatus.Cancelled]: 'default',
  [VerificationStatus.Damaged]: 'red',
  [VerificationStatus.Overdue]: 'volcano',
};

export const DAMAGE_SEVERITY_COLOR_MAP: Record<DamageSeverity, string> = {
  [DamageSeverity.Minor]: 'blue',
  [DamageSeverity.Moderate]: 'orange',
  [DamageSeverity.Major]: 'red',
  [DamageSeverity.Critical]: '#8b0000',
};
