export enum BookingStatus {
  Pending = 0,
  Confirmed = 1,
  Rescheduled = 2,
  Cancelled = 3,
  Arrived = 4,
  NoShow = 5,
}

export const BookingStatusText: Record<BookingStatus, string> = {
  [BookingStatus.Pending]: '待确认',
  [BookingStatus.Confirmed]: '已确认',
  [BookingStatus.Rescheduled]: '已改约',
  [BookingStatus.Cancelled]: '已取消',
  [BookingStatus.Arrived]: '已到场',
  [BookingStatus.NoShow]: '未到场',
}

export enum ConflictType {
  TimeSlotOverlap = 0,
  CapacityExceeded = 1,
  VisitorDuplicate = 2,
  BlacklistVisitor = 3,
  CustomRule = 4,
}

export const ConflictTypeText: Record<ConflictType, string> = {
  [ConflictType.TimeSlotOverlap]: '时段重叠',
  [ConflictType.CapacityExceeded]: '容量超限',
  [ConflictType.VisitorDuplicate]: '访客重复',
  [ConflictType.BlacklistVisitor]: '黑名单访客',
  [ConflictType.CustomRule]: '自定义规则',
}

export enum ConflictStatus {
  Detected = 0,
  Notified = 1,
  Processing = 2,
  Resolved = 3,
  Ignored = 4,
}

export const ConflictStatusText: Record<ConflictStatus, string> = {
  [ConflictStatus.Detected]: '已检测',
  [ConflictStatus.Notified]: '已通知',
  [ConflictStatus.Processing]: '处理中',
  [ConflictStatus.Resolved]: '已解决',
  [ConflictStatus.Ignored]: '已忽略',
}

export enum NotificationChannel {
  System = 0,
  Email = 1,
  SMS = 2,
  WeChat = 3,
  DingTalk = 4,
}

export const NotificationChannelText: Record<NotificationChannel, string> = {
  [NotificationChannel.System]: '系统通知',
  [NotificationChannel.Email]: '邮件',
  [NotificationChannel.SMS]: '短信',
  [NotificationChannel.WeChat]: '微信',
  [NotificationChannel.DingTalk]: '钉钉',
}

export interface BookingRecord {
  id: string
  bookingNo: string
  scenicSpotId: string
  scenicSpotName: string
  timeSlotId: string
  slotDate: string
  slotStartTime: string
  slotEndTime: string
  slotDisplay: string
  ticketTypeId: string
  ticketTypeName: string
  visitorId: string
  visitorName: string
  idCardNumber: string
  phoneNumber?: string
  status: BookingStatus
  statusText: string
  quantity: number
  totalAmount: number
  remarks?: string
  arrivalTime?: string
  arrivalOperator?: string
  createdAt: string
  createdBy?: string
  rescheduleRecords?: RescheduleRecordBrief[]
  conflicts?: ConflictLogBrief[]
  hasConflict: boolean
}

export interface RescheduleRecordBrief {
  id: string
  bookingId: string
  originalSlotDisplay: string
  newSlotDisplay: string
  reason?: string
  operator?: string
  createdAt: string
}

export interface ConflictLogBrief {
  id: string
  conflictType: ConflictType
  conflictTypeText: string
  status: ConflictStatus
  statusText: string
  reason: string
  responsiblePerson?: string
  createdAt: string
}

export interface ConflictLog {
  id: string
  conflictType: ConflictType
  conflictTypeText: string
  status: ConflictStatus
  statusText: string
  bookingId?: string
  bookingNo?: string
  relatedBookingId?: string
  relatedBookingNo?: string
  timeSlotId?: string
  timeSlotDisplay?: string
  reason: string
  resolveAction?: string
  responsiblePerson?: string
  processedBy?: string
  notifiedAt?: string
  processedAt?: string
  closedAt?: string
  createdAt: string
  createdBy?: string
  notifications?: Notification[]
}

export interface Notification {
  id: string
  channel: NotificationChannel
  channelText: string
  title: string
  content: string
  recipient?: string
  conflictLogId?: string
  isRead: boolean
  readAt?: string
  isSent: boolean
  sentAt?: string
  retryCount: number
  createdAt: string
}

export interface ReminderList {
  id: string
  name: string
  description?: string
  scenicSpotId?: string
  scenicSpotName?: string
  isActive: boolean
  createdBy?: string
  createdAt: string
  updatedBy?: string
  updatedAt?: string
  items: ReminderListItem[]
  changeLogs?: ReminderListChangeLog[]
}

export interface ReminderListItem {
  id: string
  reminderListId: string
  personName: string
  phoneNumber?: string
  email?: string
  idCardNumber?: string
  role?: string
  sortOrder: number
  receiveConflictNotifications: boolean
  receiveDailySummary: boolean
  receiveMonthlyReport: boolean
  isActive: boolean
  createdAt: string
  updatedAt?: string
}

export interface ReminderListChangeLog {
  id: string
  reminderListId: string
  reminderListItemId?: string
  changeType: string
  fieldName: string
  oldValue?: string
  newValue?: string
  oldValues?: Record<string, any> | null
  newValues?: Record<string, any> | null
  changeReason?: string
  changedBy: string
  changedAt: string
}

export interface ScenicSpot {
  id: string
  name: string
  description?: string
  address?: string
  openingTime: string
  closingTime: string
  maxDailyCapacity: number
  isActive: boolean
  createdAt: string
}

export interface TimeSlot {
  id: string
  scenicSpotId: string
  date: string
  startTime: string
  endTime: string
  capacity: number
  bookedCount: number
  isActive: boolean
  availableCount: number
  isFull: boolean
}

export interface TicketType {
  id: string
  scenicSpotId: string
  name: string
  description?: string
  price: number
  sortOrder: number
  isActive: boolean
}

export interface Visitor {
  id: string
  name: string
  idCardNumber: string
  phoneNumber?: string
  email?: string
  gender: number
  age?: number
  remarks?: string
  isBlacklisted: boolean
  blacklistReason?: string
}

export interface MonthlyStatistics {
  year: number
  month: number
  monthDisplay: string
  totalBookings: number
  confirmedBookings: number
  arrivedCount: number
  noShowCount: number
  cancelledCount: number
  rescheduledCount: number
  arrivalRate: number
  noShowRate: number
  cancellationRate: number
  totalVisitors: number
  totalRevenue: number
  conflictCount: number
  resolvedConflictCount: number
  dailyData: DailyStatistics[]
  spotData: ScenicSpotStatistics[]
}

export interface DailyStatistics {
  date: string
  dateDisplay: string
  totalBookings: number
  arrivedCount: number
  noShowCount: number
  cancelledCount: number
  arrivalRate: number
  totalVisitors: number
  revenue: number
}

export interface ScenicSpotStatistics {
  scenicSpotId: string
  scenicSpotName: string
  totalBookings: number
  arrivedCount: number
  noShowCount: number
  arrivalRate: number
  totalVisitors: number
  revenue: number
}

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  pageIndex: number
  pageSize: number
  totalPages: number
}

export interface BookingQuery {
  scenicSpotId?: string
  startDate?: string
  endDate?: string
  status?: BookingStatus
  searchKeyword?: string
  hasConflict?: boolean
  pageIndex: number
  pageSize: number
}
