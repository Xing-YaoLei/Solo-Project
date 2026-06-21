import { OCCUPANCY_RATE_SPEC, type OccupancyRateSpec } from '@/types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('zh-CN').format(num);
}

export function formatPercent(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(d);
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
}

export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 30) return `${diffDays}天前`;
  return formatDateShort(d);
}

export function generateToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export function getOccupancyRateSpec(): OccupancyRateSpec {
  return {
    ...OCCUPANCY_RATE_SPEC,
    updateTime: new Date(),
  };
}

export function calculateOccupancyRate(soldSeats: number, totalSeats: number, reservedSeats: number = 0): number {
  const denominator = totalSeats - reservedSeats;
  if (denominator <= 0) return 0;
  return soldSeats / denominator;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    sold: 'text-success',
    locked: 'text-warning',
    available: 'text-neutral-400',
    reserved: 'text-primary',
    paid: 'text-success',
    pending: 'text-warning',
    refunded: 'text-neutral-400',
    cancelled: 'text-danger',
  };
  return colors[status] || 'text-neutral-400';
}

export function getStatusBgColor(status: string): string {
  const colors: Record<string, string> = {
    sold: 'bg-success/20',
    locked: 'bg-warning/20',
    available: 'bg-neutral-700/50',
    reserved: 'bg-primary/20',
  };
  return colors[status] || 'bg-neutral-700/50';
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
