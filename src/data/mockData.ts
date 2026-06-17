import type { Tenant, WorkOrder, PatrolPoint, MeterReading } from '../types';

export const tenantTypeLabels: Record<string, string> = {
  office: '办公楼',
  retail: '商业零售',
  restaurant: '餐饮',
  warehouse: '仓储',
};

export const creditRatingLabels: Record<string, string> = {
  A: '优秀',
  B: '良好',
  C: '一般',
};

export const urgencyColors: Record<string, string> = {
  low: 'bg-green-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  critical: 'bg-red-600',
};

export const urgencyLabels: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '紧急',
};

export const workOrderTypeLabels: Record<string, string> = {
  repair: '维修',
  complaint: '投诉',
  maintenance: '维保',
  emergency: '紧急事件',
};

export const approvalTypeLabels: Record<string, string> = {
  approve: '同意',
  reject: '拒绝',
  negotiate: '协商',
  escalate: '上报',
};

export const loadingTips = [
  '提示：仔细观察巡检路线，记忆每个巡检点的位置',
  '提示：审批合同时要综合考虑租金、信用评级和特殊需求',
  '提示：水电读数要准确，误差过大会扣分',
  '提示：紧急工单需要快速响应，超时会被重判',
  '提示：可以使用数字键 1-4 快速选择审批选项',
  '提示：按 Esc 键可以暂停游戏或返回上一步',
  '提示：复盘页可以查看你的响应时间和决策质量',
];

export function getRandomLoadingTip(): string {
  return loadingTips[Math.floor(Math.random() * loadingTips.length)];
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function calculateWaterUsage(reading: MeterReading): number {
  return reading.currentReading - reading.previousReading;
}

export function calculateElectricUsage(reading: MeterReading): number {
  return reading.currentReading - reading.previousReading;
}

export function calculateWaterCost(usage: number, unitPrice: number): number {
  return usage * unitPrice;
}

export function calculateElectricCost(usage: number, unitPrice: number): number {
  return usage * unitPrice;
}
