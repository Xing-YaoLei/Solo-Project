import type { BillData, PaymentTransaction, DiscrepancyCategory } from '../types';
import { CATEGORY_LABELS } from '../types';
import { MERCHANT_NAMES } from '../config/gameConfig';

const TRANSACTION_TYPES: Array<{ type: PaymentTransaction['type']; desc: string; positive: boolean }> = [
  { type: 'order', desc: '订单收入', positive: true },
  { type: 'refund', desc: '退款扣除', positive: false },
  { type: 'coupon', desc: '优惠券抵扣', positive: false },
  { type: 'platform_fee', desc: '平台抽成', positive: false },
  { type: 'subsidy', desc: '活动补贴', positive: true },
  { type: 'delivery', desc: '配送费结算', positive: true }
];

function generateOrderNo(): string {
  return 'DD' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
}

function formatTimestamp(hourOffset: number): string {
  const d = new Date();
  d.setHours(d.getHours() - hourOffset);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function generateTransactions(orderCount: number, category: DiscrepancyCategory): {
  transactions: PaymentTransaction[];
  expectedSettlement: number;
  actualSettlement: number;
} {
  const transactions: PaymentTransaction[] = [];
  let totalOrder = 0;
  let totalRefund = 0;
  let totalCoupon = 0;
  let totalSubsidy = 0;

  for (let i = 0; i < orderCount; i++) {
    const orderAmount = round2(15 + Math.random() * 35);
    totalOrder = round2(totalOrder + orderAmount);
    transactions.push({
      id: `tx_${i}_${Date.now()}_${Math.random()}`,
      orderNo: generateOrderNo(),
      amount: orderAmount,
      type: 'order',
      status: 'success',
      timestamp: formatTimestamp(Math.floor(Math.random() * 24)),
      description: TRANSACTION_TYPES[0].desc
    });
  }

  const platformFeeRate = 0.1 + Math.random() * 0.05;
  const platformFee = round2(totalOrder * platformFeeRate);
  transactions.push({
    id: `tx_fee_${Date.now()}_${Math.random()}`,
    orderNo: 'PLATFORM_' + Date.now().toString().slice(-6),
    amount: platformFee,
    type: 'platform_fee',
    status: 'success',
    timestamp: formatTimestamp(0),
    description: `平台抽成 ${Math.round(platformFeeRate * 100)}%`
  });

  const refundCount = Math.floor(Math.random() * Math.min(3, Math.max(1, orderCount / 5)));
  for (let i = 0; i < refundCount; i++) {
    const refundAmount = round2(8 + Math.random() * 20);
    totalRefund = round2(totalRefund + refundAmount);
    transactions.push({
      id: `tx_refund_${i}_${Date.now()}_${Math.random()}`,
      orderNo: generateOrderNo(),
      amount: refundAmount,
      type: 'refund',
      status: 'success',
      timestamp: formatTimestamp(Math.floor(Math.random() * 12)),
      description: TRANSACTION_TYPES[1].desc
    });
  }

  const couponCount = Math.floor(Math.random() * Math.min(4, Math.max(1, orderCount / 4)));
  for (let i = 0; i < couponCount; i++) {
    const couponAmount = round2(2 + Math.random() * 8);
    totalCoupon = round2(totalCoupon + couponAmount);
    transactions.push({
      id: `tx_coupon_${i}_${Date.now()}_${Math.random()}`,
      orderNo: generateOrderNo(),
      amount: couponAmount,
      type: 'coupon',
      status: 'success',
      timestamp: formatTimestamp(Math.floor(Math.random() * 24)),
      description: TRANSACTION_TYPES[2].desc
    });
  }

  const hasSubsidy = Math.random() < 0.5;
  if (hasSubsidy) {
    totalSubsidy = round2(10 + Math.random() * 30);
    transactions.push({
      id: `tx_subsidy_${Date.now()}_${Math.random()}`,
      orderNo: 'SUBSIDY_' + Date.now().toString().slice(-6),
      amount: totalSubsidy,
      type: 'subsidy',
      status: 'success',
      timestamp: formatTimestamp(1),
      description: TRANSACTION_TYPES[4].desc
    });
  }

  const deliveryFee = round2(orderCount * (2 + Math.random() * 1.5));
  transactions.push({
    id: `tx_delivery_${Date.now()}_${Math.random()}`,
    orderNo: 'DELIVERY_' + Date.now().toString().slice(-6),
    amount: deliveryFee,
    type: 'delivery',
    status: 'success',
    timestamp: formatTimestamp(0),
    description: TRANSACTION_TYPES[5].desc
  });

  const expectedSettlement = round2(
    totalOrder - platformFee - totalRefund - totalCoupon + totalSubsidy + deliveryFee
  );

  let actualSettlement = expectedSettlement;

  switch (category) {
    case 'refund_missing':
      actualSettlement = round2(expectedSettlement + totalRefund);
      break;
    case 'coupon_missing':
      actualSettlement = round2(expectedSettlement + totalCoupon);
      break;
    case 'platform_fee_wrong':
      actualSettlement = round2(expectedSettlement + platformFee * 0.5);
      break;
    case 'subsidy_missing':
      actualSettlement = round2(expectedSettlement - totalSubsidy);
      break;
    case 'delivery_fee_wrong':
      actualSettlement = round2(expectedSettlement - deliveryFee * 0.3);
      break;
    case 'order_missing': {
      const missingOrder = round2(20 + Math.random() * 30);
      actualSettlement = round2(expectedSettlement - missingOrder);
      const orderTx = transactions.find(t => t.type === 'order');
      if (orderTx) {
        orderTx.amount = round2(orderTx.amount + missingOrder);
      }
      break;
    }
    case 'correct':
    default:
      actualSettlement = expectedSettlement;
      break;
  }

  transactions.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  return {
    transactions,
    expectedSettlement,
    actualSettlement
  };
}

export function generateBill(levelId: number, errorRate: number, index: number, forceCategory?: DiscrepancyCategory): BillData {
  const merchantName = MERCHANT_NAMES[Math.floor(Math.random() * MERCHANT_NAMES.length)];
  const orderCount = Math.floor(Math.random() * 25) + 5;

  let category: DiscrepancyCategory = 'correct';
  if (forceCategory) {
    category = forceCategory;
  } else {
    const hasDiscrepancy = Math.random() < errorRate;
    if (hasDiscrepancy) {
      const categories: DiscrepancyCategory[] = [
        'refund_missing',
        'coupon_missing',
        'platform_fee_wrong',
        'subsidy_missing',
        'delivery_fee_wrong',
        'order_missing'
      ];
      category = categories[Math.floor(Math.random() * categories.length)];
    }
  }

  const { transactions, expectedSettlement, actualSettlement } = generateTransactions(orderCount, category);

  if (category === 'correct') {
    const diff = Math.abs(expectedSettlement - actualSettlement);
    if (diff > 0.001) {
      console.warn(`[billUtils] correct 账单差额不为 0: ${diff}，强制修正`);
    }
  }

  return {
    id: `bill_${levelId}_${index}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    merchantName,
    orderCount,
    expectedAmount: expectedSettlement,
    actualAmount: actualSettlement,
    transactions,
    discrepancyCategory: category,
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

export function sumTransactions(transactions: PaymentTransaction[]): number {
  let sum = 0;
  for (const tx of transactions) {
    switch (tx.type) {
      case 'order':
      case 'subsidy':
      case 'delivery':
        sum += tx.amount;
        break;
      case 'refund':
      case 'coupon':
      case 'platform_fee':
        sum -= tx.amount;
        break;
    }
  }
  return round2(sum);
}

export function getDiscrepancyLabel(category: DiscrepancyCategory): string {
  return CATEGORY_LABELS[category];
}

export function calculateScore(
  isCorrect: boolean,
  responseTime: number,
  combo: number,
  baseScore: number
): number {
  if (!isCorrect) return -50;

  const speedBonus = Math.max(0, Math.floor((5000 - responseTime) / 50));
  const comboBonus = Math.floor(baseScore * combo * 0.1);
  const total = baseScore + speedBonus + Math.min(comboBonus, 200);

  return total;
}
