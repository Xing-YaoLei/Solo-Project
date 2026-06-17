import dayjs from 'dayjs'
import {
  MoveOutStatus,
  TodoStatus,
  TodoPriority,
  RoleType,
  TimelineEventType,
  ResponsibilityParty,
  InspectionItemStatus,
  PaymentType,
  PaymentMethod,
  PartyType,
  ApprovalStatus,
} from '@/types'

export const formatDate = (date: string | Date | null | undefined, format: string = 'YYYY-MM-DD HH:mm:ss'): string => {
  if (!date) return '-'
  return dayjs(date).format(format)
}

export const formatDateOnly = (date: string | Date | null | undefined): string => {
  return formatDate(date, 'YYYY-MM-DD')
}

export const formatDateTime = (date: string | Date | null | undefined): string => {
  return formatDate(date, 'YYYY-MM-DD HH:mm')
}

export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '-'
  return `¥${value.toFixed(2)}`
}

export const formatHours = (hours: number | null | undefined): string => {
  if (hours === null || hours === undefined) return '-'
  if (hours < 1) {
    return `${Math.round(hours * 60)} 分钟`
  }
  if (hours < 24) {
    return `${hours.toFixed(1)} 小时`
  }
  const days = Math.floor(hours / 24)
  const remainingHours = Math.round(hours % 24)
  return remainingHours > 0 ? `${days} 天 ${remainingHours} 小时` : `${days} 天`
}

export const formatPercentage = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '-'
  return `${(value * 100).toFixed(1)}%`
}

export const moveOutStatusMap: Record<MoveOutStatus, { text: string; color: string }> = {
  [MoveOutStatus.Pending]: { text: '待处理', color: 'default' },
  [MoveOutStatus.Scheduled]: { text: '已排期', color: 'processing' },
  [MoveOutStatus.Inspecting]: { text: '验房中', color: 'processing' },
  [MoveOutStatus.AwaitingPayment]: { text: '待结算', color: 'warning' },
  [MoveOutStatus.OverdueRent]: { text: '租金逾期', color: 'error' },
  [MoveOutStatus.Completed]: { text: '已完成', color: 'success' },
  [MoveOutStatus.Cancelled]: { text: '已取消', color: 'default' },
}

export const todoStatusMap: Record<TodoStatus, { text: string; color: string }> = {
  [TodoStatus.Pending]: { text: '待处理', color: 'default' },
  [TodoStatus.InProgress]: { text: '进行中', color: 'processing' },
  [TodoStatus.Completed]: { text: '已完成', color: 'success' },
  [TodoStatus.Overdue]: { text: '已逾期', color: 'error' },
  [TodoStatus.Cancelled]: { text: '已取消', color: 'default' },
}

export const todoPriorityMap: Record<TodoPriority, { text: string; color: string }> = {
  [TodoPriority.Low]: { text: '低', color: 'default' },
  [TodoPriority.Medium]: { text: '中', color: 'processing' },
  [TodoPriority.High]: { text: '高', color: 'warning' },
  [TodoPriority.Urgent]: { text: '紧急', color: 'error' },
}

export const roleTypeMap: Record<RoleType, string> = {
  [RoleType.Inspector]: '验房员',
  [RoleType.PropertyManager]: '物业经理',
  [RoleType.FinancialStaff]: '财务人员',
  [RoleType.CustomerService]: '客服',
  [RoleType.MaintenanceStaff]: '维修人员',
  [RoleType.Supervisor]: '主管',
  [RoleType.Administrator]: '管理员',
}

export const timelineEventTypeMap: Record<TimelineEventType, { text: string; color: string; icon: string }> = {
  [TimelineEventType.Created]: { text: '创建', color: 'blue', icon: 'plus' },
  [TimelineEventType.StatusChanged]: { text: '状态变更', color: 'cyan', icon: 'swap' },
  [TimelineEventType.NoteAdded]: { text: '添加备注', color: 'purple', icon: 'edit' },
  [TimelineEventType.AttachmentUploaded]: { text: '上传附件', color: 'geekblue', icon: 'paper-clip' },
  [TimelineEventType.HandlerAssigned]: { text: '分配处理人', color: 'green', icon: 'user-add' },
  [TimelineEventType.HandlerChanged]: { text: '更换处理人', color: 'lime', icon: 'user-switch' },
  [TimelineEventType.InspectionDone]: { text: '完成验房', color: 'gold', icon: 'check-circle' },
  [TimelineEventType.PaymentRecorded]: { text: '记录缴费', color: 'orange', icon: 'dollar' },
  [TimelineEventType.UtilityRecorded]: { text: '记录水电', color: 'volcano', icon: 'thunderbolt' },
  [TimelineEventType.ComplaintTagged]: { text: '标记投诉', color: 'red', icon: 'warning' },
  [TimelineEventType.OverdueRecorded]: { text: '记录逾期', color: 'magenta', icon: 'clock-circle' },
  [TimelineEventType.ResponsibilityAdjusted]: { text: '责任调整', color: 'pink', icon: 'adjust' },
  [TimelineEventType.CustomAction]: { text: '自定义操作', color: 'grey', icon: 'ellipsis' },
}

export const responsibilityPartyMap: Record<ResponsibilityParty, string> = {
  [ResponsibilityParty.Tenant]: '租客',
  [ResponsibilityParty.Landlord]: '房东',
  [ResponsibilityParty.PropertyManagement]: '物业',
  [ResponsibilityParty.ThirdParty]: '第三方',
  [ResponsibilityParty.NaturalWear]: '自然损耗',
}

export const inspectionItemStatusMap: Record<InspectionItemStatus, { text: string; color: string }> = {
  [InspectionItemStatus.NotChecked]: { text: '未检查', color: 'default' },
  [InspectionItemStatus.Normal]: { text: '正常', color: 'success' },
  [InspectionItemStatus.MinorDamage]: { text: '轻微损坏', color: 'warning' },
  [InspectionItemStatus.MajorDamage]: { text: '严重损坏', color: 'error' },
  [InspectionItemStatus.Missing]: { text: '缺失', color: 'error' },
}

export const paymentTypeMap: Record<PaymentType, string> = {
  [PaymentType.Rent]: '租金',
  [PaymentType.Utility]: '水电费',
  [PaymentType.DepositRefund]: '押金退还',
  [PaymentType.DamageCompensation]: '损坏赔偿',
  [PaymentType.LateFee]: '滞纳金',
  [PaymentType.Other]: '其他',
}

export const paymentMethodMap: Record<PaymentMethod, string> = {
  [PaymentMethod.BankTransfer]: '银行转账',
  [PaymentMethod.Alipay]: '支付宝',
  [PaymentMethod.WeChatPay]: '微信支付',
  [PaymentMethod.Cash]: '现金',
  [PaymentMethod.Card]: '银行卡',
}

export const partyTypeMap: Record<PartyType, string> = {
  [PartyType.Tenant]: '租客',
  [PartyType.Landlord]: '房东',
  [PartyType.PropertyManagement]: '物业',
  [PartyType.Neighbor]: '邻居',
  [PartyType.ThirdPartyService]: '第三方服务商',
  [PartyType.Other]: '其他',
}

export const approvalStatusMap: Record<ApprovalStatus, { text: string; color: string }> = {
  [ApprovalStatus.Pending]: { text: '待审批', color: 'warning' },
  [ApprovalStatus.Approved]: { text: '已通过', color: 'success' },
  [ApprovalStatus.Rejected]: { text: '已拒绝', color: 'error' },
}

export const formatMoveOutStatus = (status: MoveOutStatus): { text: string; color: string } => {
  return moveOutStatusMap[status] || { text: '未知', color: 'default' }
}

export const formatTodoStatus = (status: TodoStatus): { text: string; color: string } => {
  return todoStatusMap[status] || { text: '未知', color: 'default' }
}

export const formatTodoPriority = (priority: TodoPriority): { text: string; color: string } => {
  return todoPriorityMap[priority] || { text: '未知', color: 'default' }
}

export const formatRoleType = (role: RoleType): string => {
  return roleTypeMap[role] || '未知'
}

export const formatTimelineEventType = (
  eventType: TimelineEventType
): { text: string; color: string; icon: string } => {
  return timelineEventTypeMap[eventType] || { text: '未知', color: 'grey', icon: 'question' }
}

export const formatResponsibilityParty = (party: ResponsibilityParty): string => {
  return responsibilityPartyMap[party] || '未知'
}

export const formatInspectionItemStatus = (status: InspectionItemStatus): { text: string; color: string } => {
  return inspectionItemStatusMap[status] || { text: '未知', color: 'default' }
}

export const formatPaymentType = (type: PaymentType): string => {
  return paymentTypeMap[type] || '未知'
}

export const formatPaymentMethod = (method: PaymentMethod): string => {
  return paymentMethodMap[method] || '未知'
}

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const getRelativeTime = (date: string | Date): string => {
  const now = dayjs()
  const target = dayjs(date)
  const diffMinutes = now.diff(target, 'minute')
  const diffHours = now.diff(target, 'hour')
  const diffDays = now.diff(target, 'day')

  if (diffMinutes < 1) return '刚刚'
  if (diffMinutes < 60) return `${diffMinutes} 分钟前`
  if (diffHours < 24) return `${diffHours} 小时前`
  if (diffDays < 7) return `${diffDays} 天前`
  return formatDateOnly(date)
}

export const maskPhone = (phone: string): string => {
  if (!phone || phone.length < 11) return phone || '-'
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

export const formatPartyType = (type: PartyType): string => {
  return partyTypeMap[type] || '未知'
}

export const formatApprovalStatus = (status: ApprovalStatus): { text: string; color: string } => {
  return approvalStatusMap[status] || { text: '未知', color: 'default' }
}
