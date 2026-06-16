import { RiskLevel, AppointmentStatus, FollowUpStatus, BillingStatus, MemberLevel, TreatmentStatus, FollowUpType, Gender } from '../types';

export const getRiskLevelText = (level: RiskLevel): string => {
  switch (level) {
    case RiskLevel.Low: return '低风险';
    case RiskLevel.Medium: return '中风险';
    case RiskLevel.High: return '高风险';
    case RiskLevel.Critical: return '极高风险';
    default: return '未知';
  }
};

export const getRiskLevelClass = (level: RiskLevel): string => {
  switch (level) {
    case RiskLevel.Low: return 'risk-low';
    case RiskLevel.Medium: return 'risk-medium';
    case RiskLevel.High: return 'risk-high';
    case RiskLevel.Critical: return 'risk-critical';
    default: return '';
  }
};

export const getRiskBadgeClass = (level: RiskLevel): string => {
  switch (level) {
    case RiskLevel.Low: return 'risk-badge-low';
    case RiskLevel.Medium: return 'risk-badge-medium';
    case RiskLevel.High: return 'risk-badge-high';
    case RiskLevel.Critical: return 'risk-badge-critical';
    default: return '';
  }
};

export const getAppointmentStatusText = (status: AppointmentStatus): string => {
  switch (status) {
    case AppointmentStatus.Scheduled: return '已预约';
    case AppointmentStatus.Confirmed: return '已确认';
    case AppointmentStatus.InProgress: return '进行中';
    case AppointmentStatus.Completed: return '已完成';
    case AppointmentStatus.Cancelled: return '已取消';
    case AppointmentStatus.NoShow: return '爽约';
    default: return '未知';
  }
};

export const getAppointmentStatusColor = (status: AppointmentStatus): string => {
  switch (status) {
    case AppointmentStatus.Scheduled: return 'blue';
    case AppointmentStatus.Confirmed: return 'cyan';
    case AppointmentStatus.InProgress: return 'processing';
    case AppointmentStatus.Completed: return 'success';
    case AppointmentStatus.Cancelled: return 'default';
    case AppointmentStatus.NoShow: return 'error';
    default: return 'default';
  }
};

export const getFollowUpStatusText = (status: FollowUpStatus): string => {
  switch (status) {
    case FollowUpStatus.Pending: return '待处理';
    case FollowUpStatus.InProgress: return '进行中';
    case FollowUpStatus.Completed: return '已完成';
    case FollowUpStatus.Cancelled: return '已取消';
    default: return '未知';
  }
};

export const getFollowUpTypeText = (type: FollowUpType): string => {
  switch (type) {
    case FollowUpType.Phone: return '电话';
    case FollowUpType.SMS: return '短信';
    case FollowUpType.WeChat: return '微信';
    case FollowUpType.Email: return '邮件';
    case FollowUpType.InPerson: return '面诊';
    default: return '未知';
  }
};

export const getBillingStatusText = (status: BillingStatus): string => {
  switch (status) {
    case BillingStatus.Unpaid: return '未缴费';
    case BillingStatus.PartialPaid: return '部分缴费';
    case BillingStatus.Paid: return '已缴费';
    case BillingStatus.Refunded: return '已退款';
    default: return '未知';
  }
};

export const getMemberLevelText = (level: MemberLevel): string => {
  switch (level) {
    case MemberLevel.Regular: return '普通会员';
    case MemberLevel.Silver: return '银卡会员';
    case MemberLevel.Gold: return '金卡会员';
    case MemberLevel.Platinum: return '白金会员';
    default: return '未知';
  }
};

export const getTreatmentStatusText = (status: TreatmentStatus): string => {
  switch (status) {
    case TreatmentStatus.Planned: return '计划中';
    case TreatmentStatus.InProgress: return '进行中';
    case TreatmentStatus.Completed: return '已完成';
    case TreatmentStatus.Suspended: return '已暂停';
    default: return '未知';
  }
};

export const getGenderText = (gender: Gender): string => {
  switch (gender) {
    case Gender.Male: return '男';
    case Gender.Female: return '女';
    case Gender.Other: return '其他';
    default: return '未知';
  }
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN');
};

export const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN');
};

export const formatTime = (timeStr: string): string => {
  if (!timeStr) return '';
  return timeStr.substring(0, 5);
};

export const formatCurrency = (amount: number): string => {
  return `¥${amount.toFixed(2)}`;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
