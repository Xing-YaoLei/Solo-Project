import type { RepairItem } from '@/types';
import { GAME_CONFIG } from '@/config/constants';

export function calculateItemTotal(item: RepairItem): number {
  return item.basePrice + item.partsCost + item.laborHours * GAME_CONFIG.LABOR_RATE_PER_HOUR;
}

export function calculateTotalPrice(items: RepairItem[]): number {
  return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
}

export function formatPrice(price: number): string {
  return `¥${price.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatMileage(mileage: number): string {
  return mileage.toLocaleString('zh-CN') + ' km';
}
