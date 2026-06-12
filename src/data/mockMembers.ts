import type { Member, Transaction, Refund, Benefit, MemberStats } from '@/types/member';

export const members: Member[] = [
  {
    id: 'member-001',
    name: '张女士',
    avatar: '👩',
    level: 3,
    balance: 258.50,
    totalSpent: 5680,
    visitCount: 156,
    lastVisit: '2026-06-10T09:30:00Z',
    joinDate: '2024-03-15T00:00:00Z',
    phone: '138****5678',
    email: 'zhang@example.com',
    preferredDrink: '拿铁',
    visitFrequency: 'weekly',
  },
  {
    id: 'member-002',
    name: '李先生',
    avatar: '👨',
    level: 2,
    balance: 89.00,
    totalSpent: 2340,
    visitCount: 67,
    lastVisit: '2026-06-08T18:15:00Z',
    joinDate: '2025-01-20T00:00:00Z',
    phone: '139****1234',
    email: 'li@example.com',
    preferredDrink: '美式',
    visitFrequency: 'daily',
  },
  {
    id: 'member-003',
    name: '王小姐',
    avatar: '👩‍💼',
    level: 4,
    balance: 1250.00,
    totalSpent: 12800,
    visitCount: 312,
    lastVisit: '2026-06-12T12:00:00Z',
    joinDate: '2023-08-10T00:00:00Z',
    phone: '137****8899',
    email: 'wang@example.com',
    preferredDrink: '卡布奇诺',
    visitFrequency: 'daily',
  },
  {
    id: 'member-004',
    name: '陈先生',
    avatar: '👨‍💼',
    level: 1,
    balance: 15.00,
    totalSpent: 450,
    visitCount: 12,
    lastVisit: '2026-05-28T14:30:00Z',
    joinDate: '2026-02-01T00:00:00Z',
    phone: '136****7788',
    email: 'chen@example.com',
    preferredDrink: '摩卡',
    visitFrequency: 'rare',
  },
];

export const transactions: Transaction[] = [
  {
    id: 'txn-001',
    memberId: 'member-001',
    type: 'purchase',
    amount: -38.00,
    balanceAfter: 258.50,
    description: '购买拿铁 x2',
    createdAt: '2026-06-10T09:30:00Z',
    status: 'completed',
    storeId: 'store-001',
    items: [{ name: '拿铁', quantity: 2, price: 19 }],
  },
  {
    id: 'txn-002',
    memberId: 'member-001',
    type: 'recharge',
    amount: 500.00,
    balanceAfter: 296.50,
    description: '会员储值充值',
    createdAt: '2026-06-05T16:00:00Z',
    status: 'completed',
    storeId: 'store-001',
  },
  {
    id: 'txn-003',
    memberId: 'member-002',
    type: 'purchase',
    amount: -25.00,
    balanceAfter: 89.00,
    description: '购买美式大杯',
    createdAt: '2026-06-08T18:15:00Z',
    status: 'completed',
    storeId: 'store-001',
    items: [{ name: '美式大杯', quantity: 1, price: 25 }],
  },
  {
    id: 'txn-004',
    memberId: 'member-003',
    type: 'recharge',
    amount: 1000.00,
    balanceAfter: 1250.00,
    description: '钻石会员充值送200',
    createdAt: '2026-06-01T10:00:00Z',
    status: 'completed',
    storeId: 'store-001',
  },
  {
    id: 'txn-005',
    memberId: 'member-003',
    type: 'refund',
    amount: 45.00,
    balanceAfter: 250.00,
    description: '退款处理',
    createdAt: '2026-05-28T11:30:00Z',
    status: 'completed',
    storeId: 'store-001',
  },
];

export const refunds: Refund[] = [
  {
    id: 'refund-001',
    memberId: 'member-003',
    transactionId: 'txn-005',
    amount: 45.00,
    reason: '饮品制作错误',
    detailedReason: '客户点单的卡布奇诺被误制作成了摩卡，客户要求退款。经核实情况属实，已全额退款。',
    createdAt: '2026-05-28T11:25:00Z',
    status: 'completed',
    handledBy: '店长小王',
    evidence: ['照片证据-饮品对比', '客户聊天记录'],
  },
  {
    id: 'refund-002',
    memberId: 'member-001',
    transactionId: 'txn-006',
    amount: 150.00,
    reason: '储值误操作',
    detailedReason: '客户原本想充值100元，但店员误操作充值了250元。客户要求退还多充的150元。',
    createdAt: '2026-05-20T15:40:00Z',
    status: 'pending',
    handledBy: null,
  },
];

export const benefits: Benefit[] = [
  {
    id: 'benefit-001',
    memberId: 'member-001',
    type: 'coupon',
    title: '买一送一券',
    description: '购买任意饮品可享受买一送一',
    value: 38,
    expireDate: '2026-06-20T23:59:59Z',
    isExpired: false,
    isUsed: false,
    minPurchase: 38,
  },
  {
    id: 'benefit-002',
    memberId: 'member-001',
    type: 'discount',
    title: '8折优惠券',
    description: '全场饮品8折',
    value: 20,
    expireDate: '2026-06-18T23:59:59Z',
    isExpired: false,
    isUsed: false,
    minPurchase: 0,
  },
  {
    id: 'benefit-003',
    memberId: 'member-002',
    type: 'free_drink',
    title: '免费饮品券',
    description: '可兑换任意中杯饮品',
    value: 35,
    expireDate: '2026-06-15T23:59:59Z',
    isExpired: false,
    isUsed: false,
  },
  {
    id: 'benefit-004',
    memberId: 'member-003',
    type: 'birthday',
    title: '生日专属福利',
    description: '生日当月可免费领取指定蛋糕一份',
    value: 88,
    expireDate: '2026-07-31T23:59:59Z',
    isExpired: false,
    isUsed: false,
  },
  {
    id: 'benefit-005',
    memberId: 'member-004',
    type: 'points',
    title: '积分翻倍卡',
    description: '消费积分双倍，有效期7天',
    value: 0,
    expireDate: '2026-06-05T23:59:59Z',
    isExpired: true,
    isUsed: false,
  },
];

export const memberStats: MemberStats[] = [
  {
    memberId: 'member-001',
    totalVisits: 156,
    avgSpendPerVisit: 36.41,
    last30DaysSpend: 420,
    churnRisk: 'low',
    renewalProbability: 85,
    nextBestOffer: '推荐季度会员礼包',
    preferredVisitTime: '上午 9:00-11:00',
  },
  {
    memberId: 'member-002',
    totalVisits: 67,
    avgSpendPerVisit: 34.93,
    last30DaysSpend: 580,
    churnRisk: 'low',
    renewalProbability: 90,
    nextBestOffer: '推荐月卡套餐',
    preferredVisitTime: '下午 17:00-19:00',
  },
  {
    memberId: 'member-003',
    totalVisits: 312,
    avgSpendPerVisit: 41.03,
    last30DaysSpend: 1280,
    churnRisk: 'low',
    renewalProbability: 95,
    nextBestOffer: '推荐年度钻石会员',
    preferredVisitTime: '中午 12:00-13:00',
  },
  {
    memberId: 'member-004',
    totalVisits: 12,
    avgSpendPerVisit: 37.50,
    last30DaysSpend: 0,
    churnRisk: 'high',
    renewalProbability: 20,
    nextBestOffer: '发送回归礼包',
    preferredVisitTime: '下午 14:00-16:00',
  },
];

export function getMemberById(id: string): Member | undefined {
  return members.find((m) => m.id === id);
}

export function getTransactionsByMemberId(memberId: string): Transaction[] {
  return transactions.filter((t) => t.memberId === memberId);
}

export function getRefundsByMemberId(memberId: string): Refund[] {
  return refunds.filter((r) => r.memberId === memberId);
}

export function getBenefitsByMemberId(memberId: string): Benefit[] {
  return benefits.filter((b) => b.memberId === memberId);
}

export function getMemberStatsById(memberId: string): MemberStats | undefined {
  return memberStats.find((s) => s.memberId === memberId);
}
