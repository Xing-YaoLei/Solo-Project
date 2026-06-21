import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type {
  UserRole,
  CaseStatus,
  InvoiceStatus,
  InvoiceSource,
  PaymentStatus,
  ApprovalStatus,
} from '@/types';

export const formatCurrency = (
  amount: number,
  currency: string = 'CNY',
  minimumFractionDigits: number = 2
): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency,
    minimumFractionDigits,
  }).format(amount);
};

export const formatNumber = (
  value: number,
  minimumFractionDigits: number = 0,
  maximumFractionDigits: number = 2
): string => {
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);
};

export const formatPercent = (
  value: number,
  decimals: number = 2
): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

export const formatDate = (
  date: string | Date,
  pattern: string = 'yyyy-MM-dd'
): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, pattern, { locale: zhCN });
};

export const formatDateTime = (
  date: string | Date,
  pattern: string = 'yyyy-MM-dd HH:mm:ss'
): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, pattern, { locale: zhCN });
};

export const formatTime = (
  date: string | Date,
  pattern: string = 'HH:mm:ss'
): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, pattern, { locale: zhCN });
};

export const formatRelativeTime = (
  date: string | Date,
  addSuffix: boolean = true
): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix, locale: zhCN });
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const ROLE_LABELS: Record<UserRole, string> = {
  partner: '合伙人',
  lawyer: '律师',
  assistant: '助理',
  client: '客户',
};

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  active: '进行中',
  pending: '待处理',
  closed: '已结案',
  cancelled: '已取消',
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  pending: '待支付',
  paid: '已支付',
  overdue: '已逾期',
  cancelled: '已取消',
};

export const INVOICE_SOURCE_LABELS: Record<InvoiceSource, string> = {
  manual: '手动录入',
  email: '邮件解析',
  import: '批量导入',
  api: 'API同步',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: '待支付',
  paid: '已支付',
  overdue: '已逾期',
};

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回',
  escalated: '已升级',
};

export const CASE_STATUS_COLORS: Record<CaseStatus, string> = {
  active: 'bg-blue-100 text-blue-800',
  pending: 'bg-yellow-100 text-yellow-800',
  closed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
};

export const APPROVAL_STATUS_COLORS: Record<ApprovalStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  escalated: 'bg-orange-100 text-orange-800',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  partner: 'bg-purple-100 text-purple-800',
  lawyer: 'bg-blue-100 text-blue-800',
  assistant: 'bg-cyan-100 text-cyan-800',
  client: 'bg-gray-100 text-gray-800',
};

export const getRoleLabel = (role: UserRole): string => {
  return ROLE_LABELS[role] || role;
};

export const getCaseStatusLabel = (status: CaseStatus): string => {
  return CASE_STATUS_LABELS[status] || status;
};

export const getInvoiceStatusLabel = (status: InvoiceStatus): string => {
  return INVOICE_STATUS_LABELS[status] || status;
};

export const getInvoiceSourceLabel = (source: InvoiceSource): string => {
  return INVOICE_SOURCE_LABELS[source] || source;
};

export const getPaymentStatusLabel = (status: PaymentStatus): string => {
  return PAYMENT_STATUS_LABELS[status] || status;
};

export const getApprovalStatusLabel = (status: ApprovalStatus): string => {
  return APPROVAL_STATUS_LABELS[status] || status;
};

export const getCaseStatusColor = (status: CaseStatus): string => {
  return CASE_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
};

export const getInvoiceStatusColor = (status: InvoiceStatus): string => {
  return INVOICE_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
};

export const getPaymentStatusColor = (status: PaymentStatus): string => {
  return PAYMENT_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
};

export const getApprovalStatusColor = (status: ApprovalStatus): string => {
  return APPROVAL_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
};

export const getRoleColor = (role: UserRole): string => {
  return ROLE_COLORS[role] || 'bg-gray-100 text-gray-800';
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

export const maskSensitiveData = (
  value: string,
  start: number = 0,
  end: number = 4,
  maskChar: string = '*'
): string => {
  if (!value) return '';
  if (value.length <= start + end) return value;
  const startPart = value.slice(0, start);
  const endPart = value.slice(-end);
  const maskLength = value.length - start - end;
  return `${startPart}${maskChar.repeat(maskLength)}${endPart}`;
};

export const maskEmail = (email: string): string => {
  if (!email) return '';
  const [username, domain] = email.split('@');
  if (!username || !domain) return email;
  const maskedUsername =
    username.length <= 2
      ? username
      : `${username[0]}${'*'.repeat(username.length - 2)}${username[username.length - 1]}`;
  return `${maskedUsername}@${domain}`;
};

export const maskPhone = (phone: string): string => {
  if (!phone || phone.length < 11) return phone;
  return `${phone.slice(0, 3)}${'*'.repeat(4)}${phone.slice(-4)}`;
};

export const formatDuration = (days: number): string => {
  if (days < 0) {
    return `逾期 ${Math.abs(days)} 天`;
  }
  if (days === 0) {
    return '今天';
  }
  return `剩余 ${days} 天`;
};
