import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN');
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins} 分钟前`;
  if (diffHours < 24) return `${diffHours} 小时前`;
  if (diffDays < 7) return `${diffDays} 天前`;
  return formatDate(d);
}

export function getSeverityColor(severity: 'low' | 'medium' | 'high'): string {
  switch (severity) {
    case 'low':
      return 'text-risk-low bg-risk-low/10 border-risk-low/30';
    case 'medium':
      return 'text-risk-medium bg-risk-medium/10 border-risk-medium/30';
    case 'high':
      return 'text-risk-high bg-risk-high/10 border-risk-high/30';
  }
}

export function getSentimentColor(sentiment: 'positive' | 'neutral' | 'negative'): string {
  switch (sentiment) {
    case 'positive':
      return 'text-risk-low';
    case 'neutral':
      return 'text-slate-400';
    case 'negative':
      return 'text-risk-high';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'open':
    case 'pending':
      return 'text-risk-high bg-risk-high/10';
    case 'processing':
    case 'collected':
      return 'text-risk-medium bg-risk-medium/10';
    case 'resolved':
    case 'refunded':
      return 'text-risk-low bg-risk-low/10';
    case 'deducted':
      return 'text-risk-high bg-risk-high/10';
    default:
      return 'text-slate-400 bg-slate-400/10';
  }
}

export function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export function calculatePunctualityRate(onTime: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((onTime / total) * 1000) / 1000;
}

export const CLEANING_PUNCTUALITY_RULE = 
  '保洁准时率 = 实际开始时间 ≤ 计划时间30分钟内的保洁任务数 / 总保洁任务数 × 100%。数据范围涵盖最近30天所有已完成的保洁排班记录。';
