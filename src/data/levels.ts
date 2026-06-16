import type { Level } from '@/types/game';

export const LEVELS: Level[] = [
  {
    id: 1,
    name: '新手入门',
    description: '学习基础的药品分类陈列',
    difficulty: 'easy',
    timeLimit: 120,
    shelfRows: 2,
    shelfCols: 3,
    promotionRules: ['rule-cold-zone'],
    medicines: ['cold-001', 'cold-002', 'fever-001', 'stomach-001', 'vitamin-001', 'skincare-001'],
    targetScore: 150,
  },
  {
    id: 2,
    name: '分类达人',
    description: '掌握多品类药品分区陈列',
    difficulty: 'easy',
    timeLimit: 150,
    shelfRows: 3,
    shelfCols: 3,
    promotionRules: ['rule-cold-zone', 'rule-fever-zone', 'rule-stomach-zone'],
    medicines: ['cold-001', 'cold-002', 'cold-003', 'fever-001', 'fever-002', 'stomach-001', 'stomach-002', 'vitamin-001', 'skincare-001'],
    targetScore: 300,
  },
  {
    id: 3,
    name: '促销专家',
    description: '学会端架促销陈列技巧',
    difficulty: 'medium',
    timeLimit: 180,
    shelfRows: 3,
    shelfCols: 4,
    promotionRules: ['rule-cold-zone', 'rule-fever-zone', 'rule-endcap-left', 'rule-endcap-right'],
    medicines: ['cold-001', 'cold-002', 'cold-003', 'fever-001', 'fever-002', 'stomach-001', 'stomach-002', 'vitamin-001', 'vitamin-002', 'promo-001', 'promo-002', 'skincare-001'],
    targetScore: 500,
  },
  {
    id: 4,
    name: '堆头陈列',
    description: '掌握促销堆头陈列方法',
    difficulty: 'medium',
    timeLimit: 180,
    shelfRows: 4,
    shelfCols: 4,
    promotionRules: ['rule-cold-zone', 'rule-fever-zone', 'rule-stomach-zone', 'rule-stack-cold'],
    medicines: ['cold-001', 'cold-002', 'cold-003', 'fever-001', 'fever-002', 'stomach-001', 'stomach-002', 'stomach-003', 'vitamin-001', 'vitamin-002', 'promo-001', 'promo-002', 'skincare-001', 'skincare-002', 'skincare-003', 'vitamin-003'],
    targetScore: 700,
  },
  {
    id: 5,
    name: '黄金位置',
    description: '明星商品的黄金位置陈列',
    difficulty: 'medium',
    timeLimit: 150,
    shelfRows: 4,
    shelfCols: 4,
    promotionRules: ['rule-cold-zone', 'rule-fever-zone', 'rule-vitamin-zone', 'rule-special-medicine'],
    medicines: ['cold-001', 'cold-002', 'cold-003', 'fever-001', 'fever-002', 'stomach-001', 'stomach-002', 'vitamin-001', 'vitamin-002', 'vitamin-003', 'promo-001', 'promo-003', 'skincare-001', 'skincare-002', 'skincare-003', 'stomach-003'],
    targetScore: 800,
  },
  {
    id: 6,
    name: '综合挑战',
    description: '综合运用所有陈列技巧',
    difficulty: 'hard',
    timeLimit: 240,
    shelfRows: 4,
    shelfCols: 4,
    promotionRules: ['rule-cold-zone', 'rule-fever-zone', 'rule-stomach-zone', 'rule-vitamin-zone', 'rule-endcap-left', 'rule-endcap-right', 'rule-stack-cold'],
    medicines: ['cold-001', 'cold-002', 'cold-003', 'fever-001', 'fever-002', 'stomach-001', 'stomach-002', 'stomach-003', 'vitamin-001', 'vitamin-002', 'vitamin-003', 'promo-001', 'promo-002', 'promo-003', 'skincare-001', 'skincare-002'],
    targetScore: 1200,
  },
  {
    id: 7,
    name: '终极考验',
    description: '限时完成全部促销陈列',
    difficulty: 'hard',
    timeLimit: 200,
    shelfRows: 4,
    shelfCols: 4,
    promotionRules: ['rule-cold-zone', 'rule-fever-zone', 'rule-stomach-zone', 'rule-vitamin-zone', 'rule-endcap-left', 'rule-endcap-right', 'rule-stack-cold', 'rule-stack-vitamin', 'rule-price-tag', 'rule-special-medicine'],
    medicines: ['cold-001', 'cold-002', 'cold-003', 'fever-001', 'fever-002', 'stomach-001', 'stomach-002', 'stomach-003', 'vitamin-001', 'vitamin-002', 'vitamin-003', 'promo-001', 'promo-002', 'promo-003', 'skincare-001', 'skincare-002'],
    targetScore: 1800,
  },
];

export const getLevelById = (id: number): Level | undefined => {
  return LEVELS.find(l => l.id === id);
};

export const getNextLevel = (currentId: number): Level | undefined => {
  const currentIndex = LEVELS.findIndex(l => l.id === currentId);
  return currentIndex >= 0 && currentIndex < LEVELS.length - 1 ? LEVELS[currentIndex + 1] : undefined;
};

export const getDifficultyColor = (difficulty: Level['difficulty']): string => {
  switch (difficulty) {
    case 'easy':
      return 'health-500';
    case 'medium':
      return 'promo-500';
    case 'hard':
      return 'alert-500';
    default:
      return 'gray-500';
  }
};

export const getDifficultyLabel = (difficulty: Level['difficulty']): string => {
  switch (difficulty) {
    case 'easy':
      return '简单';
    case 'medium':
      return '中等';
    case 'hard':
      return '困难';
    default:
      return '未知';
  }
};

export const calculateStars = (score: number, targetScore: number): number => {
  if (score >= targetScore * 1.2) return 3;
  if (score >= targetScore) return 2;
  if (score >= targetScore * 0.6) return 1;
  return 0;
};
