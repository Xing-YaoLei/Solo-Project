import type { Medicine } from '@/types/game';

export const MEDICINES: Medicine[] = [
  {
    id: 'cold-001',
    name: '复方氨酚烷胺片',
    category: '感冒药',
    color: '#4FC3F7',
    icon: '🤒',
  },
  {
    id: 'cold-002',
    name: '感冒灵颗粒',
    category: '感冒药',
    color: '#29B6F6',
    icon: '🌡️',
  },
  {
    id: 'cold-003',
    name: '连花清瘟胶囊',
    category: '感冒药',
    color: '#03A9F4',
    icon: '🤧',
  },
  {
    id: 'fever-001',
    name: '布洛芬缓释胶囊',
    category: '退烧药',
    color: '#FFB74D',
    icon: '🔥',
  },
  {
    id: 'fever-002',
    name: '对乙酰氨基酚片',
    category: '退烧药',
    color: '#FFA726',
    icon: '💊',
  },
  {
    id: 'stomach-001',
    name: '健胃消食片',
    category: '肠胃药',
    color: '#81C784',
    icon: '🍜',
  },
  {
    id: 'stomach-002',
    name: '奥美拉唑肠溶胶囊',
    category: '肠胃药',
    color: '#66BB6A',
    icon: '🫃',
  },
  {
    id: 'stomach-003',
    name: '蒙脱石散',
    category: '肠胃药',
    color: '#4CAF50',
    icon: '💩',
  },
  {
    id: 'vitamin-001',
    name: '维生素C片',
    category: '维生素',
    color: '#F06292',
    icon: '🍊',
  },
  {
    id: 'vitamin-002',
    name: '复合维生素B',
    category: '维生素',
    color: '#EC407A',
    icon: '💪',
  },
  {
    id: 'vitamin-003',
    name: '钙片',
    category: '维生素',
    color: '#E91E63',
    icon: '🦴',
  },
  {
    id: 'skincare-001',
    name: '创可贴',
    category: '外用',
    color: '#BA68C8',
    icon: '🩹',
  },
  {
    id: 'skincare-002',
    name: '碘伏消毒液',
    category: '外用',
    color: '#AB47BC',
    icon: '🧴',
  },
  {
    id: 'skincare-003',
    name: '云南白药气雾剂',
    category: '外用',
    color: '#9C27B0',
    icon: '🩼',
  },
  {
    id: 'promo-001',
    name: '买二赠一标识',
    category: '促销标识',
    color: '#FFD54F',
    icon: '🎁',
  },
  {
    id: 'promo-002',
    name: '限时特惠标识',
    category: '促销标识',
    color: '#FFC107',
    icon: '⏰',
  },
  {
    id: 'promo-003',
    name: '会员专享标识',
    category: '促销标识',
    color: '#FFB300',
    icon: '⭐',
  },
];

export const getMedicineById = (id: string): Medicine | undefined => {
  return MEDICINES.find(m => m.id === id);
};

export const getMedicinesByCategory = (category: string): Medicine[] => {
  return MEDICINES.filter(m => m.category === category);
};

export const getMedicineCategories = (): string[] => {
  return [...new Set(MEDICINES.map(m => m.category))];
};
