import type { GameSettings, LevelConfig } from '../types';

export const GAME_WIDTH = 900;
export const GAME_HEIGHT = 600;

export const COLORS = {
  primary: 0x4ecdc4,
  secondary: 0xff6b6b,
  success: 0x6bcb77,
  warning: 0xffd93d,
  danger: 0xff6b6b,
  background: 0x1a1a2e,
  cardBg: 0x16213e,
  cardBorder: 0x0f3460,
  text: 0xffffff,
  textSecondary: 0xa0a0a0,
  gold: 0xffd700
};

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: '新手村',
    description: '熟悉金额校验入门，简单账单，适合新人练习',
    duration: 60,
    difficulty: 'easy',
    billCount: 10,
    errorRate: 0.2,
    payoutCycle: 7,
    baseScore: 100,
    unlocked: true
  },
  {
    id: 2,
    name: '日常对账',
    description: '中等难度，账单数量增加',
    duration: 90,
    difficulty: 'normal',
    billCount: 20,
    errorRate: 0.3,
    payoutCycle: 3,
    baseScore: 150,
    unlocked: false
  },
  {
    id: 3,
    name: '月末结算',
    description: '高难度，大量账单需要快速处理',
    duration: 120,
    difficulty: 'hard',
    billCount: 35,
    errorRate: 0.4,
    payoutCycle: 1,
    baseScore: 200,
    unlocked: false
  }
];

export const MERCHANT_NAMES = [
  '老王小吃店',
  '张记面馆',
  '李氏快餐',
  '陈家粥铺',
  '王家饭馆',
  '刘家烧烤',
  '赵家饺子',
  '孙家包子铺',
  '周家麻辣烫',
  '吴家火锅',
  '郑家面馆',
  '王家小吃',
  '李家快餐',
  '陈家面馆',
  '刘家饭馆'
];

export const DISCREPANCY_REASONS = [
  '退款订单',
  '取消订单',
  '优惠抵扣',
  '平台抽成',
  '配送费差异',
  '活动补贴',
  '优惠券使用',
  '会员折扣'
];

export const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  vibrationEnabled: true,
  tutorialCompleted: false
};

export const SCORE_CONFIG = {
  baseCorrect: 100,
  speedBonus: 50,
  comboMultiplier: 0.1,
  wrongPenalty: 50,
  comboBreakPenalty: true,
  maxComboBonus: 200
};
