import type { BillData } from '../types';
import { MERCHANT_NAMES, DISCREPANCY_REASONS } from '../config/gameConfig';

export function generateBill(levelId: number, errorRate: number, index: number): BillData {
  const merchantName = MERCHANT_NAMES[Math.floor(Math.random() * MERCHANT_NAMES.length)];
  const orderCount = Math.floor(Math.random() * 30) + 5;
  const baseAmount = orderCount * (15 + Math.random() * 10);
  const expectedAmount = Math.round(baseAmount * 100) / 100;
  
  const hasDiscrepancy = Math.random() < errorRate;
  let actualAmount = expectedAmount;
  
  if (hasDiscrepancy) {
    const discrepancy = expectedAmount * (0.05 + Math.random() * 0.15) * (Math.random() > 0.5 ? 1 : -1);
    actualAmount = Math.round((expectedAmount + discrepancy) * 100) / 100;
  }

  const discrepancyReason = hasDiscrepancy 
    ? DISCREPANCY_REASONS[Math.floor(Math.random() * DISCREPANCY_REASONS.length)]
    : undefined;

  return {
    id: `bill_${levelId}_${index}_${Date.now()}`,
    merchantName,
    orderCount,
    expectedAmount,
    actualAmount,
    hasDiscrepancy,
    discrepancyReason,
    timestamp: Date.now()
  };
}

export function generateBills(levelId: number, count: number, errorRate: number): BillData[] {
  const bills: BillData[] = [];
  for (let i = 0; i < count; i++) {
    bills.push(generateBill(levelId, errorRate, i));
  }
  return bills;
}

export function formatAmount(amount: number): string {
  return `¥${amount.toFixed(2)}`;
}

export function calculateScore(
  isCorrect: boolean,
  responseTime: number,
  combo: number,
  baseScore: number
): number {
  if (!isCorrect) return -50;

  const speedBonus = Math.max(0, Math.floor((3000 - responseTime) / 60));
  const comboBonus = Math.floor(baseScore * combo * 0.1);
  const total = baseScore + speedBonus + Math.min(comboBonus, 200);

  return total;
}
