import { Difficulty } from '@/types';

export const GAME_CONFIG = {
  easy: {
    totalTime: 120,
    productCount: 8,
    settlementCount: 3,
    defectRate: 0.15,
    warningTimeThreshold: 30,
    scorePerCorrect: 100,
    timeBonusMultiplier: 2,
  },
  normal: {
    totalTime: 90,
    productCount: 12,
    settlementCount: 4,
    defectRate: 0.25,
    warningTimeThreshold: 20,
    scorePerCorrect: 150,
    timeBonusMultiplier: 3,
  },
  hard: {
    totalTime: 60,
    productCount: 16,
    settlementCount: 5,
    defectRate: 0.35,
    warningTimeThreshold: 15,
    scorePerCorrect: 200,
    timeBonusMultiplier: 5,
  },
};

export const COLORS = {
  primary: '#165DFF',
  warning: '#FF7D00',
  success: '#00B42A',
  danger: '#F53F3F',
  dark: '#1D2129',
  darkGray: '#4E5969',
  gray: '#86909C',
  lightGray: '#C9CDD4',
  bgDark: '#0A0E1A',
  bgCard: 'rgba(22, 93, 255, 0.1)',
  neonBlue: '#00D4FF',
  neonPink: '#FF2D95',
  neonGreen: '#39FF14',
  neonOrange: '#FF6B00',
};

export const BATCH_COLORS = [
  '#165DFF',
  '#00B42A',
  '#FF7D00',
  '#722ED1',
  '#F53F3F',
];

export const PRODUCT_CATEGORIES = [
  '蔬菜水果',
  '肉禽蛋品',
  '粮油调味',
  '休闲零食',
  '乳品烘焙',
];

export const PRODUCT_NAMES = [
  '有机西红柿',
  '新鲜草莓',
  '土鸡蛋',
  '精选五花肉',
  '金龙鱼花生油',
  '原味酸奶',
  '全麦面包',
  '进口香蕉',
  '精品苹果',
  '鲜牛奶',
  '薯片大礼包',
  '五常大米',
  '进口牛排',
  '有机菠菜',
  '车厘子',
  '三文鱼',
];

export const DEFECT_TYPES = {
  shortage: { label: '到货短少', color: '#F53F3F' },
  damaged: { label: '包装破损', color: '#FF7D00' },
  wrong_item: { label: '商品错发', color: '#722ED1' },
  expired: { label: '临近过期', color: '#F7BA1E' },
};

export const ERROR_TYPE_LABELS: Record<string, string> = {
  wrong_batch: '批次错误',
  wrong_product: '商品不匹配',
  shortage: '到货短少',
  expired: '商品过期',
  damaged: '包装破损',
  wrong_settlement: '结算单错误',
  unprocessed_defect: '缺损未处理',
};

export const STORAGE_KEYS = {
  gameRecords: 'community_groupbuy_records',
  replayRecords: 'community_groupbuy_replays',
  settings: 'community_groupbuy_settings',
};

export const MAX_REPLAY_RECORDS = 3;

export const SHELF_CONFIG = {
  rows: 3,
  cols: 6,
  width: 12,
  height: 6,
  depth: 1.5,
  shelfSpacing: 2,
};

export const getDifficultyConfig = (difficulty: Difficulty) => {
  return GAME_CONFIG[difficulty];
};
