export enum TicketStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  REVIEWING = 'reviewing',
  SUPPLEMENT_NEEDED = 'supplement_needed',
  ESCALATED_REVIEW = 'escalated_review',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CLOSED = 'closed',
}

export enum TicketSource {
  WECHAT_GROUP = 'wechat_group',
  QQ_GROUP = 'qq_group',
  OFFLINE_ACTIVITY = 'offline_activity',
  REFERRAL = 'referral',
  ADVERTISEMENT = 'advertisement',
  OTHER = 'other',
}

export enum ReviewTag {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  NORMAL = 'normal',
  NEEDS_IMPROVEMENT = 'needs_improvement',
  PROBLEMATIC = 'problematic',
}

export enum TransactionType {
  PAYMENT = 'payment',
  REFUND = 'refund',
  COMMISSION = 'commission',
  DEDUCTION = 'deduction',
  BONUS = 'bonus',
}

export enum PlagiarismStatus {
  REPORTED = 'reported',
  INVESTIGATING = 'investigating',
  CONFIRMED = 'confirmed',
  DISMISSED = 'dismissed',
  APPEALED = 'appealed',
  RESOLVED = 'resolved',
}

export enum PlagiarismSeverity {
  MINOR = 'minor',
  MODERATE = 'moderate',
  SEVERE = 'severe',
  CRITICAL = 'critical',
}

export enum MemberLevel {
  BASIC = 'basic',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond',
}

export interface EnumLabel {
  value: string
  label: string
}

export const ticketStatusLabels: EnumLabel[] = [
  { value: TicketStatus.DRAFT, label: '草稿' },
  { value: TicketStatus.PENDING_REVIEW, label: '待审核' },
  { value: TicketStatus.REVIEWING, label: '审核中' },
  { value: TicketStatus.SUPPLEMENT_NEEDED, label: '待补资料' },
  { value: TicketStatus.ESCALATED_REVIEW, label: '升级复核' },
  { value: TicketStatus.PROCESSING, label: '处理中' },
  { value: TicketStatus.COMPLETED, label: '已完成' },
  { value: TicketStatus.CLOSED, label: '已关闭' },
]

export const ticketSourceLabels: EnumLabel[] = [
  { value: TicketSource.WECHAT_GROUP, label: '微信群' },
  { value: TicketSource.QQ_GROUP, label: 'QQ群' },
  { value: TicketSource.OFFLINE_ACTIVITY, label: '线下活动' },
  { value: TicketSource.REFERRAL, label: '推荐' },
  { value: TicketSource.ADVERTISEMENT, label: '广告' },
  { value: TicketSource.OTHER, label: '其他' },
]

export const reviewTagLabels: EnumLabel[] = [
  { value: ReviewTag.EXCELLENT, label: '优秀' },
  { value: ReviewTag.GOOD, label: '良好' },
  { value: ReviewTag.NORMAL, label: '一般' },
  { value: ReviewTag.NEEDS_IMPROVEMENT, label: '需改进' },
  { value: ReviewTag.PROBLEMATIC, label: '有问题' },
]

export const transactionTypeLabels: EnumLabel[] = [
  { value: TransactionType.PAYMENT, label: '支付' },
  { value: TransactionType.REFUND, label: '退款' },
  { value: TransactionType.COMMISSION, label: '佣金' },
  { value: TransactionType.DEDUCTION, label: '扣款' },
  { value: TransactionType.BONUS, label: '奖励' },
]

export const plagiarismStatusLabels: EnumLabel[] = [
  { value: PlagiarismStatus.REPORTED, label: '已举报' },
  { value: PlagiarismStatus.INVESTIGATING, label: '调查中' },
  { value: PlagiarismStatus.CONFIRMED, label: '已确认' },
  { value: PlagiarismStatus.DISMISSED, label: '已驳回' },
  { value: PlagiarismStatus.APPEALED, label: '已申诉' },
  { value: PlagiarismStatus.RESOLVED, label: '已解决' },
]

export const plagiarismSeverityLabels: EnumLabel[] = [
  { value: PlagiarismSeverity.MINOR, label: '轻微' },
  { value: PlagiarismSeverity.MODERATE, label: '一般' },
  { value: PlagiarismSeverity.SEVERE, label: '严重' },
  { value: PlagiarismSeverity.CRITICAL, label: '极其严重' },
]

export const memberLevelLabels: EnumLabel[] = [
  { value: MemberLevel.BASIC, label: '普通会员' },
  { value: MemberLevel.SILVER, label: '银卡会员' },
  { value: MemberLevel.GOLD, label: '金卡会员' },
  { value: MemberLevel.PLATINUM, label: '白金会员' },
  { value: MemberLevel.DIAMOND, label: '钻石会员' },
]

export interface StatusColorConfig {
  bg: string
  text: string
  border: string
}

export const ticketStatusColors: Record<string, StatusColorConfig> = {
  [TicketStatus.DRAFT]: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-200',
  },
  [TicketStatus.PENDING_REVIEW]: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
  },
  [TicketStatus.REVIEWING]: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-200',
  },
  [TicketStatus.SUPPLEMENT_NEEDED]: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-200',
  },
  [TicketStatus.ESCALATED_REVIEW]: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-200',
  },
  [TicketStatus.PROCESSING]: {
    bg: 'bg-cyan-100',
    text: 'text-cyan-800',
    border: 'border-cyan-200',
  },
  [TicketStatus.COMPLETED]: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200',
  },
  [TicketStatus.CLOSED]: {
    bg: 'bg-gray-100',
    text: 'text-gray-500',
    border: 'border-gray-200',
  },
}

export const plagiarismStatusColors: Record<string, StatusColorConfig> = {
  [PlagiarismStatus.REPORTED]: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
  },
  [PlagiarismStatus.INVESTIGATING]: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-200',
  },
  [PlagiarismStatus.CONFIRMED]: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200',
  },
  [PlagiarismStatus.DISMISSED]: {
    bg: 'bg-gray-100',
    text: 'text-gray-500',
    border: 'border-gray-200',
  },
  [PlagiarismStatus.APPEALED]: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-200',
  },
  [PlagiarismStatus.RESOLVED]: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200',
  },
}

export const memberLevelColors: Record<string, StatusColorConfig> = {
  [MemberLevel.BASIC]: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-200',
  },
  [MemberLevel.SILVER]: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
  },
  [MemberLevel.GOLD]: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-300',
  },
  [MemberLevel.PLATINUM]: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-300',
  },
  [MemberLevel.DIAMOND]: {
    bg: 'bg-gradient-to-r from-purple-100 to-pink-100',
    text: 'text-purple-800',
    border: 'border-purple-300',
  },
}

export const statusColorMaps: Record<string, Record<string, StatusColorConfig>> =
  {
    ticket: ticketStatusColors,
    plagiarism: plagiarismStatusColors,
    member_level: memberLevelColors,
  }

export const statusLabelMaps: Record<string, EnumLabel[]> = {
  ticket: ticketStatusLabels,
  plagiarism: plagiarismStatusLabels,
  member_level: memberLevelLabels,
}

export function getStatusLabel(
  status: string,
  type: 'ticket' | 'plagiarism' | 'member_level'
): string {
  const labels = statusLabelMaps[type]
  const found = labels.find((item) => item.value === status)
  return found ? found.label : status
}

export function getStatusColorConfig(
  status: string,
  type: 'ticket' | 'plagiarism' | 'member_level'
): StatusColorConfig {
  const colors = statusColorMaps[type]
  return (
    colors[status] || {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      border: 'border-gray-200',
    }
  )
}

export interface EnumsData {
  ticketStatus: EnumLabel[]
  ticketSource: EnumLabel[]
  reviewTag: EnumLabel[]
  transactionType: EnumLabel[]
  plagiarismStatus: EnumLabel[]
  plagiarismSeverity: EnumLabel[]
  memberLevel: EnumLabel[]
}

export const defaultEnums: EnumsData = {
  ticketStatus: ticketStatusLabels,
  ticketSource: ticketSourceLabels,
  reviewTag: reviewTagLabels,
  transactionType: transactionTypeLabels,
  plagiarismStatus: plagiarismStatusLabels,
  plagiarismSeverity: plagiarismSeverityLabels,
  memberLevel: memberLevelLabels,
}
