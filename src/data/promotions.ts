import type { PromotionRule } from '@/types/game';

export const PROMOTION_RULES: PromotionRule[] = [
  {
    id: 'rule-cold-zone',
    name: '感冒药专区',
    description: '感冒药品类需陈列在货架第1行',
    icon: '🤒',
    type: 'category-zone',
    targetCategory: '感冒药',
    targetPositions: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 0, col: 3 },
    ],
    points: 50,
  },
  {
    id: 'rule-fever-zone',
    name: '退烧药专区',
    description: '退烧药品类需陈列在货架第2行',
    icon: '🔥',
    type: 'category-zone',
    targetCategory: '退烧药',
    targetPositions: [
      { row: 1, col: 0 },
      { row: 1, col: 1 },
      { row: 1, col: 2 },
      { row: 1, col: 3 },
    ],
    points: 50,
  },
  {
    id: 'rule-stomach-zone',
    name: '肠胃药专区',
    description: '肠胃药品类需陈列在货架第3行',
    icon: '🍜',
    type: 'category-zone',
    targetCategory: '肠胃药',
    targetPositions: [
      { row: 2, col: 0 },
      { row: 2, col: 1 },
      { row: 2, col: 2 },
      { row: 2, col: 3 },
    ],
    points: 50,
  },
  {
    id: 'rule-vitamin-zone',
    name: '维生素专区',
    description: '维生素品类需陈列在货架第4行',
    icon: '🍊',
    type: 'category-zone',
    targetCategory: '维生素',
    targetPositions: [
      { row: 3, col: 0 },
      { row: 3, col: 1 },
      { row: 3, col: 2 },
      { row: 3, col: 3 },
    ],
    points: 50,
  },
  {
    id: 'rule-endcap-left',
    name: '左侧端架促销',
    description: '端架左侧需放置促销标识',
    icon: '🎁',
    type: 'endcap',
    targetCategory: '促销标识',
    targetPositions: [
      { row: 0, col: 0 },
      { row: 1, col: 0 },
      { row: 2, col: 0 },
    ],
    points: 80,
  },
  {
    id: 'rule-endcap-right',
    name: '右侧端架促销',
    description: '端架右侧需放置促销标识',
    icon: '🎁',
    type: 'endcap',
    targetCategory: '促销标识',
    targetPositions: [
      { row: 0, col: 3 },
      { row: 1, col: 3 },
      { row: 2, col: 3 },
    ],
    points: 80,
  },
  {
    id: 'rule-stack-cold',
    name: '感冒药堆头',
    description: '感冒药需在第1行第2-3列形成堆头',
    icon: '📦',
    type: 'stack',
    targetCategory: '感冒药',
    targetPositions: [
      { row: 0, col: 1 },
      { row: 0, col: 2 },
    ],
    points: 100,
  },
  {
    id: 'rule-stack-vitamin',
    name: '维生素堆头',
    description: '维生素需在第4行2-3列形成堆头',
    icon: '📦',
    type: 'stack',
    targetCategory: '维生素',
    targetPositions: [
      { row: 3, col: 1 },
      { row: 3, col: 2 },
    ],
    points: 100,
  },
  {
    id: 'rule-price-tag',
    name: '价签标识',
    description: '每个商品旁需放置促销价签',
    icon: '🏷️',
    type: 'price-tag',
    targetCategory: '促销标识',
    targetMedicineId: 'promo-003',
    targetPositions: [
      { row: 0, col: 1 },
      { row: 1, col: 1 },
      { row: 2, col: 1 },
      { row: 3, col: 1 },
    ],
    points: 30,
  },
  {
    id: 'rule-special-medicine',
    name: '明星商品陈列',
    description: '连花清瘟胶囊需放在黄金位置（第1行第2列）',
    icon: '⭐',
    type: 'stack',
    targetMedicineId: 'cold-003',
    targetPositions: [
      { row: 0, col: 1 },
    ],
    points: 150,
  },
];

export const getPromotionRuleById = (id: string): PromotionRule | undefined => {
  return PROMOTION_RULES.find(r => r.id === id);
};

export const getPromotionRulesByIds = (ids: string[]): PromotionRule[] => {
  return ids.map(id => getPromotionRuleById(id)).filter(Boolean) as PromotionRule[];
};
