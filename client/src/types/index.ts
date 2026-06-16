export interface ApiResult<T = any> {
  success: boolean
  message: string
  data: T
  code: number
}

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  pageIndex: number
  pageSize: number
  totalPages: number
}

export interface PagedQuery {
  pageIndex?: number
  pageSize?: number
  keyword?: string
  sortField?: string
  sortOrder?: string
}

export enum UserRole {
  Cashier = 0,
  Pharmacist = 1,
  StoreManager = 2,
  Headquarters = 3,
}

export const UserRoleNames: Record<UserRole, string> = {
  [UserRole.Cashier]: '收银员',
  [UserRole.Pharmacist]: '药师',
  [UserRole.StoreManager]: '店长',
  [UserRole.Headquarters]: '总部运营',
}

export interface User {
  id: number
  username: string
  realName: string
  role: UserRole
  roleName: string
  storeId?: number
  storeName?: string
  phone: string
  isActive: boolean
  createdAt: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  expireAt: string
  user: User
}

export enum PrescriptionStatus {
  Pending = 0,
  Reviewing = 1,
  Approved = 2,
  Rejected = 3,
  Unclear = 4,
  SupplementRequired = 5,
  Completed = 6,
}

export const PrescriptionStatusNames: Record<PrescriptionStatus, string> = {
  [PrescriptionStatus.Pending]: '待提交',
  [PrescriptionStatus.Reviewing]: '审核中',
  [PrescriptionStatus.Approved]: '审核通过',
  [PrescriptionStatus.Rejected]: '审核拒绝',
  [PrescriptionStatus.Unclear]: '处方不清',
  [PrescriptionStatus.SupplementRequired]: '需补充资料',
  [PrescriptionStatus.Completed]: '已完成',
}

export const PrescriptionStatusColors: Record<PrescriptionStatus, string> = {
  [PrescriptionStatus.Pending]: 'default',
  [PrescriptionStatus.Reviewing]: 'processing',
  [PrescriptionStatus.Approved]: 'success',
  [PrescriptionStatus.Rejected]: 'error',
  [PrescriptionStatus.Unclear]: 'warning',
  [PrescriptionStatus.SupplementRequired]: 'orange',
  [PrescriptionStatus.Completed]: 'success',
}

export interface PrescriptionItem {
  id: number
  drugName: string
  specification: string
  dosage: string
  frequency: string
  quantity: number
  unit: string
  price: number
  remark?: string
}

export interface PrescriptionItemCreate {
  drugName: string
  specification: string
  dosage: string
  frequency: string
  quantity: number
  unit: string
  price: number
  remark?: string
}

export interface Prescription {
  id: number
  prescriptionNo: string
  patientName: string
  patientPhone: string
  age: number
  gender: string
  diagnosis: string
  doctorName: string
  hospital: string
  prescriptionDate: string
  storeId: number
  storeName?: string
  status: PrescriptionStatus
  statusName: string
  remark?: string
  cashierId?: number
  cashierName?: string
  pharmacistId?: number
  pharmacistName?: string
  submittedAt?: string
  reviewedAt?: string
  createdAt: string
  itemCount: number
  attachmentCount: number
  hasUnclearRecord: boolean
}

export interface PrescriptionDetail extends Prescription {
  items: PrescriptionItem[]
  attachments: Attachment[]
  auditLogs: AuditLog[]
  supplementNotes: SupplementNote[]
  pharmacistOpinions: PharmacistOpinion[]
  followUp?: FollowUp
  restockOrders: RestockOrder[]
  insuranceRecords: InsuranceRecord[]
}

export interface PrescriptionCreate {
  patientName: string
  patientPhone: string
  patientIdCard: string
  age: number
  gender: string
  diagnosis: string
  doctorName: string
  hospital: string
  prescriptionDate: string
  storeId: number
  remark?: string
  items: PrescriptionItemCreate[]
}

export interface PrescriptionUpdate {
  patientName: string
  patientPhone: string
  patientIdCard: string
  age: number
  gender: string
  diagnosis: string
  doctorName: string
  hospital: string
  prescriptionDate: string
  remark?: string
  items: PrescriptionItemCreate[]
}

export interface PrescriptionQuery extends PagedQuery {
  status?: PrescriptionStatus
  storeId?: number
  startDate?: string
  endDate?: string
  patientName?: string
  pharmacistId?: number
  hasUnclearRecord?: boolean
  followUpCompleted?: boolean
}

export interface PrescriptionReview {
  isApproved: boolean
  opinion: string
  remark?: string
}

export interface PrescriptionBatchReview {
  ids: number[]
  isApproved: boolean
  opinion: string
}

export interface PrescriptionStatusChange {
  status: PrescriptionStatus
  remark?: string
}

export enum AttachmentType {
  PrescriptionPhoto = 0,
  SupplementDocument = 1,
  RestockOrder = 2,
  InsuranceRecord = 3,
  Other = 4,
}

export const AttachmentTypeNames: Record<AttachmentType, string> = {
  [AttachmentType.PrescriptionPhoto]: '处方照片',
  [AttachmentType.SupplementDocument]: '补充资料',
  [AttachmentType.RestockOrder]: '补货单',
  [AttachmentType.InsuranceRecord]: '医保流水',
  [AttachmentType.Other]: '其他',
}

export interface Attachment {
  id: number
  type: AttachmentType
  typeName: string
  fileName: string
  originalFileName: string
  filePath: string
  fileSize: number
  contentType: string
  uploadedBy: number
  uploaderName?: string
  createdAt: string
}

export interface AuditLog {
  id: number
  prescriptionId: number
  operatorId: number
  operatorName?: string
  oldStatusName: string
  newStatusName: string
  action: string
  remark?: string
  createdAt: string
}

export interface SupplementNote {
  id: number
  prescriptionId: number
  operatorId: number
  operatorName?: string
  content: string
  source: string
  createdAt: string
}

export interface SupplementNoteCreate {
  content: string
  source: string
}

export interface PharmacistOpinion {
  id: number
  prescriptionId: number
  pharmacistId: number
  pharmacistName?: string
  opinion: string
  isApproved: boolean
  createdAt: string
}

export interface FollowUp {
  id: number
  prescriptionId: number
  operatorId: number
  operatorName?: string
  content: string
  result: string
  isCompleted: boolean
  completedAt?: string
  remark?: string
  createdAt: string
}

export interface FollowUpCreate {
  content: string
  result: string
  isCompleted: boolean
  remark?: string
}

export interface FollowUpUpdate {
  content: string
  result: string
  isCompleted: boolean
  remark?: string
}

export interface RestockOrder {
  id: number
  orderNo: string
  storeId: number
  storeName?: string
  prescriptionId?: number
  prescriptionNo?: string
  orderDate: string
  totalAmount: number
  itemCount: number
  status: string
  remark?: string
  operatorId?: number
  operatorName?: string
  createdAt: string
}

export interface RestockOrderDetail extends RestockOrder {
  items: RestockOrderItem[]
}

export interface RestockOrderItem {
  id: number
  drugName: string
  specification: string
  quantity: number
  unit: string
  price: number
  amount: number
  batchNo: string
  expireDate?: string
}

export interface RestockOrderQuery extends PagedQuery {
  storeId?: number
  status?: string
  startDate?: string
  endDate?: string
  prescriptionId?: number
}

export interface InsuranceRecord {
  id: number
  recordNo: string
  storeId: number
  storeName?: string
  prescriptionId?: number
  prescriptionNo?: string
  patientName: string
  idCard: string
  insuranceCardNo: string
  tradeDate: string
  totalAmount: number
  insurancePay: number
  selfPay: number
  tradeType: string
  status: string
  remark?: string
  createdAt: string
}

export interface InsuranceRecordQuery extends PagedQuery {
  storeId?: number
  status?: string
  startDate?: string
  endDate?: string
  prescriptionId?: number
  patientName?: string
}

export interface Store {
  id: number
  name: string
  code: string
  address: string
  phone: string
  isActive: boolean
  createdAt: string
}

export interface StatisticsDto {
  totalPrescriptions: number
  pendingCount: number
  reviewingCount: number
  approvedCount: number
  rejectedCount: number
  unclearCount: number
  supplementRequiredCount: number
  completedCount: number
  followUpCompletedCount: number
  totalAmount: number
}

export interface PrescriptionStatisticsDto {
  date: string
  totalCount: number
  approvedCount: number
  rejectedCount: number
  unclearCount: number
}

export interface StoreStatisticsDto {
  storeId: number
  storeName: string
  totalCount: number
  approvedCount: number
  approvalRate: number
  followUpCompletedCount: number
}

export interface StatisticsQuery {
  storeId?: number
  startDate?: string
  endDate?: string
  groupBy?: string
}
