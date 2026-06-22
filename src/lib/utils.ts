import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(input: Date | string | null | undefined): string {
  if (!input) return '-';
  const date = typeof input === 'string' ? new Date(input) : input;
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateTime(input: Date | string | null | undefined): string {
  if (!input) return '-';
  const date = typeof input === 'string' ? new Date(input) : input;
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatNumber(n: number, digits = 0): string {
  return n.toLocaleString('zh-CN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatPercent(n: number, digits = 1): string {
  return `${(n * 100).toLocaleString('zh-CN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`;
}

export function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function generateBatchNo(): string {
  const now = new Date();
  const ymd =
    now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `B${ymd}${rand}`;
}

export type UserRole = 'MANAGEMENT' | 'EXECUTOR' | 'REVIEWER';

export type AuditStatus =
  | 'CREATED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'PENDING_REVIEW'
  | 'REJECTED'
  | 'CLOSED';

export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type SourceType = 'PERMISSION_LOG' | 'ERP_EXPORT' | 'EMAIL_MATERIAL' | 'COMBINED';

export const STATUS_LABEL: Record<AuditStatus, string> = {
  CREATED: '已创建',
  ASSIGNED: '已派工',
  IN_PROGRESS: '整改中',
  PENDING_REVIEW: '待复核',
  REJECTED: '复核退回',
  CLOSED: '已关闭',
};

export const RISK_LABEL: Record<RiskLevel, string> = {
  HIGH: '高风险',
  MEDIUM: '中风险',
  LOW: '低风险',
};

export const SOURCE_LABEL: Record<SourceType, string> = {
  PERMISSION_LOG: '权限日志',
  ERP_EXPORT: 'ERP 导出',
  EMAIL_MATERIAL: '邮件材料',
  COMBINED: '多源合并',
};
