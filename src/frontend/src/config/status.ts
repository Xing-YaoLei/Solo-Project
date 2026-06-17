import { DocumentType, DocumentStatus, AmountConsistencyStatus, PaymentStatus, UserRole } from '@/types'
import type { TagProps } from 'antd'

export const documentTypeLabels: Record<DocumentType, string> = {
  [DocumentType.SiteMeasurement]: '现场测量单',
  [DocumentType.Quotation]: '报价单',
  [DocumentType.ChangeOrder]: '变更单',
  [DocumentType.MaterialOrder]: '材料订单',
  [DocumentType.PaymentRequest]: '付款申请',
  [DocumentType.CompletionAcceptance]: '竣工验收单',
}

export const documentStatusLabels: Record<DocumentStatus, string> = {
  [DocumentStatus.Draft]: '草稿',
  [DocumentStatus.PendingReview]: '待审核',
  [DocumentStatus.PendingApproval]: '待审批',
  [DocumentStatus.Approved]: '已通过',
  [DocumentStatus.Rejected]: '已拒绝',
  [DocumentStatus.Revised]: '已修订',
  [DocumentStatus.Completed]: '已完成',
  [DocumentStatus.Cancelled]: '已取消',
}

export const documentStatusColors: Record<DocumentStatus, TagProps['color']> = {
  [DocumentStatus.Draft]: 'default',
  [DocumentStatus.PendingReview]: 'orange',
  [DocumentStatus.PendingApproval]: 'gold',
  [DocumentStatus.Approved]: 'green',
  [DocumentStatus.Rejected]: 'red',
  [DocumentStatus.Revised]: 'blue',
  [DocumentStatus.Completed]: 'cyan',
  [DocumentStatus.Cancelled]: 'gray',
}

export const amountConsistencyLabels: Record<AmountConsistencyStatus, string> = {
  [AmountConsistencyStatus.Consistent]: '金额一致',
  [AmountConsistencyStatus.Inconsistent]: '金额不一致',
  [AmountConsistencyStatus.PendingVerification]: '待核实',
  [AmountConsistencyStatus.Resolved]: '已解决',
}

export const amountConsistencyColors: Record<AmountConsistencyStatus, TagProps['color']> = {
  [AmountConsistencyStatus.Consistent]: 'green',
  [AmountConsistencyStatus.Inconsistent]: 'red',
  [AmountConsistencyStatus.PendingVerification]: 'orange',
  [AmountConsistencyStatus.Resolved]: 'blue',
}

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  [PaymentStatus.Pending]: '待支付',
  [PaymentStatus.Paid]: '已支付',
  [PaymentStatus.Partial]: '部分支付',
  [PaymentStatus.Overdue]: '逾期',
  [PaymentStatus.Refunded]: '已退款',
}

export const paymentStatusColors: Record<PaymentStatus, TagProps['color']> = {
  [PaymentStatus.Pending]: 'orange',
  [PaymentStatus.Paid]: 'green',
  [PaymentStatus.Partial]: 'gold',
  [PaymentStatus.Overdue]: 'red',
  [PaymentStatus.Refunded]: 'gray',
}

export const userRoleLabels: Record<UserRole, string> = {
  [UserRole.Owner]: '业主',
  [UserRole.Designer]: '设计师',
  [UserRole.Foreman]: '工长',
  [UserRole.Supervisor]: '监理',
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
  }).format(amount)
}
