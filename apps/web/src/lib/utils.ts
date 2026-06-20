import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmtMoney(n: number | string | { toNumber?: () => number } | null | undefined, digits = 2): string {
  if (n === null || n === undefined) return '0.00';
  const num = typeof n === 'object' && 'toNumber' in n ? (n as any).toNumber() : Number(n);
  return num.toLocaleString('zh-CN', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function fmtDateTime(v: string | Date | null | undefined): string {
  if (!v) return '-';
  const d = typeof v === 'string' ? new Date(v) : v;
  return format(d, 'yyyy-MM-dd HH:mm:ss');
}

export function fmtDate(v: string | Date | null | undefined): string {
  if (!v) return '-';
  const d = typeof v === 'string' ? new Date(v) : v;
  return format(d, 'yyyy-MM-dd');
}

export function fmtAgo(v: string | Date | null | undefined): string {
  if (!v) return '-';
  const d = typeof v === 'string' ? new Date(v) : v;
  return formatDistanceToNow(d, { addSuffix: true, locale: zhCN });
}

export function fmtPercent(v: number, digits = 1): string {
  return `${(v * 100).toFixed(digits)}%`;
}

export const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'badge bg-slate-100 text-slate-700',
  ACTIVE: 'badge bg-emerald-100 text-emerald-700',
  SUSPENDED: 'badge bg-amber-100 text-amber-700',
  CLOSED: 'badge bg-slate-100 text-slate-600',

  PENDING: 'badge bg-amber-100 text-amber-700',
  PAID: 'badge bg-sky-100 text-sky-700',
  CONFIRMED: 'badge bg-blue-100 text-blue-700',
  COMPLETED: 'badge bg-emerald-100 text-emerald-700',
  CANCELLED: 'badge bg-slate-100 text-slate-600',
  REFUNDING: 'badge bg-orange-100 text-orange-700',
  REFUNDED: 'badge bg-purple-100 text-purple-700',
  DISPUTED: 'badge bg-rose-100 text-rose-700',

  AVAILABLE: 'badge bg-emerald-100 text-emerald-700',
  LOCKED: 'badge bg-amber-100 text-amber-700',
  OCCUPIED: 'badge bg-rose-100 text-rose-700',
  RESERVED: 'badge bg-purple-100 text-purple-700',
  MAINTAINED: 'badge bg-slate-100 text-slate-600',

  CHECKED_IN: 'badge bg-emerald-100 text-emerald-700',
  CHECKED_OUT: 'badge bg-sky-100 text-sky-700',
  EXPIRED: 'badge bg-slate-100 text-slate-600',
  INVALID: 'badge bg-rose-100 text-rose-700',

  OPEN: 'badge bg-rose-100 text-rose-700',
  INVESTIGATING: 'badge bg-amber-100 text-amber-700',
  PENDING_RESPONSE: 'badge bg-orange-100 text-orange-700',
  RESOLVED: 'badge bg-emerald-100 text-emerald-700',
  ESCALATED: 'badge bg-red-100 text-red-700',
};

export const LABELS: Record<string, Record<string, string>> = {
  TicketTypeStatus: { DRAFT: '草稿', ACTIVE: '在售', SUSPENDED: '停售', CLOSED: '关闭' },
  OrderStatus: {
    PENDING: '待支付', PAID: '已支付', CONFIRMED: '已确认', COMPLETED: '已完成',
    CANCELLED: '已取消', REFUNDING: '退款中', REFUNDED: '已退款', DISPUTED: '有争议',
  },
  SeatStatus: { AVAILABLE: '可用', LOCKED: '锁定', OCCUPIED: '已售', RESERVED: '预留', MAINTAINED: '维护' },
  CheckInStatus: { PENDING: '待核销', CHECKED_IN: '已入场', CHECKED_OUT: '已离场', EXPIRED: '已过期', INVALID: '已作废' },
  SponsorType: {
    TITLE_SPONSOR: '冠名赞助', PLATINUM: '铂金', GOLD: '金牌', SILVER: '银牌', BRONZE: '铜牌', OFFICIAL_PARTNER: '官方合作',
  },
  ExceptionType: {
    REFUND_DISPUTE: '退票争议', DOUBLE_PAYMENT: '重复支付', SEAT_CONFLICT: '座位冲突',
    CHECKIN_ABNORMAL: '核销异常', SYSTEM_ERROR: '系统错误', OTHER: '其他',
  },
  ExceptionStatus: {
    OPEN: '待处理', INVESTIGATING: '调查中', PENDING_RESPONSE: '待反馈',
    RESOLVED: '已解决', CLOSED: '已关闭', ESCALATED: '已升级',
  },
  LiabilityParty: {
    CUSTOMER: '客户', PLATFORM: '平台', VENUE: '场馆', ORGANIZER: '主办方',
    THIRD_PARTY: '第三方', UNCLEAR: '待确认',
  },
  Severity: { LOW: '低', MEDIUM: '中', HIGH: '高', CRITICAL: '紧急' },
};

export function labelOf(group: keyof typeof LABELS, key: string) {
  return LABELS[group]?.[key] || key;
}

export function statusBadge(cls: string, labelMap: Record<string, string>, v: string) {
  return {
    className: STATUS_STYLES[v] || 'badge bg-slate-100 text-slate-700',
    text: labelMap[v] || v,
  };
}
