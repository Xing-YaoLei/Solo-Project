export type UserRole = 'manager' | 'staff';

export type LossStatus = 'draft' | 'pending_review' | 'reviewed' | 'pending_approval' | 'approved' | 'rejected' | 'following' | 'closed';

export type LossCategory = 'raw_material' | 'finished_product' | 'packaging' | 'equipment' | 'other';

export type ReviewResult = 'confirmed' | 'needs_follow_up' | 'disputed';

export type ApprovalResult = 'approved' | 'rejected';

export type AbnormalType = 'high_loss_rate' | 'frequent_loss' | 'large_amount' | 'suspicious_pattern';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  store_id?: number;
  store_name?: string;
  is_active: boolean;
  created_at: string;
}

export interface Store {
  id: number;
  code: string;
  name: string;
  address?: string;
  city?: string;
  manager_id?: number;
  manager_name?: string;
  monthly_sales_target: number;
  is_active: boolean;
  created_at: string;
  current_month_loss: number;
  current_month_loss_rate: number;
}

export interface LossReport {
  id: number;
  report_no: string;
  title: string;
  category: LossCategory;
  loss_date: string;
  cost_amount: number;
  sale_amount: number;
  quantity: number;
  unit: string;
  description?: string;
  status: LossStatus;
  is_abnormal: boolean;
  abnormal_type?: AbnormalType;
  loss_rate: number;
  store_id: number;
  store_name: string;
  created_by: number;
  creator_name: string;
  responsible_staff_id?: number;
  responsible_staff_name?: string;
  created_at: string;
  updated_at?: string;
}

export interface LossReportDetail extends LossReport {
  reviews: Review[];
  approvals: Approval[];
  communications: Communication[];
}

export interface Review {
  id: number;
  review_opinion: string;
  result: ReviewResult;
  verified_amount?: number;
  cost_verified: boolean;
  store_verified: boolean;
  follow_up_days: number;
  review_time: string;
  loss_report_id: number;
  reviewer_id: number;
  reviewer_name: string;
}

export interface Approval {
  id: number;
  approval_opinion: string;
  result: ApprovalResult;
  approval_time: string;
  loss_report_id: number;
  approver_id: number;
  approver_name: string;
}

export interface Communication {
  id: number;
  message: string;
  message_type: string;
  loss_report_id: number;
  sender_id: number;
  sender_name: string;
  sender_role: string;
  reply_to_id?: number;
  created_at: string;
}

export interface LossTrendItem {
  date: string;
  loss_amount: number;
  loss_rate: number;
  report_count: number;
}

export interface StoreLossRank {
  store_id: number;
  store_name: string;
  loss_amount: number;
  loss_rate: number;
  rank: number;
}

export interface DashboardStats {
  today_loss_amount: number;
  today_report_count: number;
  pending_review_count: number;
  pending_approval_count: number;
  abnormal_count: number;
  month_loss_rate: number;
  month_loss_amount: number;
  loss_trend: LossTrendItem[];
  store_ranking: StoreLossRank[];
}

export const LossStatusMap: Record<LossStatus, string> = {
  draft: '草稿',
  pending_review: '待复核',
  reviewed: '已复核',
  pending_approval: '待审批',
  approved: '已通过',
  rejected: '已驳回',
  following: '跟进中',
  closed: '已关闭',
};

export const LossStatusColorMap: Record<LossStatus, string> = {
  draft: 'default',
  pending_review: 'warning',
  reviewed: 'processing',
  pending_approval: 'orange',
  approved: 'success',
  rejected: 'error',
  following: 'blue',
  closed: 'default',
};

export const LossCategoryMap: Record<LossCategory, string> = {
  raw_material: '原材料',
  finished_product: '成品',
  packaging: '包装材料',
  equipment: '设备',
  other: '其他',
};

export const ReviewResultMap: Record<ReviewResult, string> = {
  confirmed: '确认无误',
  needs_follow_up: '需要跟进',
  disputed: '存在争议',
};

export const ApprovalResultMap: Record<ApprovalResult, string> = {
  approved: '同意',
  rejected: '驳回',
};

export const AbnormalTypeMap: Record<AbnormalType, string> = {
  high_loss_rate: '高损耗率',
  frequent_loss: '高频报损',
  large_amount: '大额报损',
  suspicious_pattern: '可疑模式',
};

export const UserRoleMap: Record<UserRole, string> = {
  manager: '管理层',
  staff: '一线人员',
};
