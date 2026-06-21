export interface GameSettings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  tutorialCompleted: boolean;
}

export interface LevelConfig {
  id: number;
  name: string;
  description: string;
  duration: number;
  difficulty: 'easy' | 'normal' | 'hard';
  billCount: number;
  errorRate: number;
  payoutCycle: number;
  baseScore: number;
  unlocked: boolean;
}

export interface PaymentTransaction {
  id: string;
  orderNo: string;
  amount: number;
  type: 'order' | 'refund' | 'coupon' | 'platform_fee' | 'subsidy' | 'delivery';
  status: 'success' | 'failed' | 'pending';
  timestamp: string;
  description: string;
}

export type DiscrepancyCategory =
  | 'correct'
  | 'refund_missing'
  | 'coupon_missing'
  | 'platform_fee_wrong'
  | 'subsidy_missing'
  | 'delivery_fee_wrong'
  | 'order_missing';

export const CATEGORY_LABELS: Record<DiscrepancyCategory, string> = {
  correct: '金额正确',
  refund_missing: '退款未扣除',
  coupon_missing: '优惠未抵扣',
  platform_fee_wrong: '平台抽成错误',
  subsidy_missing: '补贴未到账',
  delivery_fee_wrong: '配送费差异',
  order_missing: '订单漏入账'
};

export interface BillData {
  id: string;
  merchantName: string;
  orderCount: number;
  expectedAmount: number;
  actualAmount: number;
  transactions: PaymentTransaction[];
  discrepancyCategory: DiscrepancyCategory;
  timestamp: number;
}

export interface GameStats {
  score: number;
  correctCount: number;
  wrongCount: number;
  combo: number;
  maxCombo: number;
  avgResponseTime: number;
  totalBills: number;
  levelId: number;
}

export interface LevelRecord {
  levelId: number;
  levelName: string;
  bestScore: number;
  bestCombo: number;
  accuracy: number;
  payoutCycle: number;
  playCount: number;
}

export type GameScene = 'boot' | 'mainMenu' | 'levelSelect' | 'game' | 'review' | 'tutorial' | 'settings';
