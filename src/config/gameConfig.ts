import { GameConfig, Difficulty, Material, MaterialType } from '../types';

export const MATERIALS: Record<MaterialType, Material> = {
  cement: {
    id: 'cement',
    type: 'cement',
    name: '水泥',
    unit: '袋',
    icon: '🧱',
    color: '#8B7355'
  },
  sand: {
    id: 'sand',
    type: 'sand',
    name: '沙子',
    unit: '方',
    icon: '🏖️',
    color: '#F4A460'
  },
  brick: {
    id: 'brick',
    type: 'brick',
    name: '砖块',
    unit: '块',
    icon: '🧱',
    color: '#CD5C5C'
  },
  steel: {
    id: 'steel',
    type: 'steel',
    name: '钢筋',
    unit: '根',
    icon: '⚙️',
    color: '#708090'
  },
  wood: {
    id: 'wood',
    type: 'wood',
    name: '木材',
    unit: '根',
    icon: '🪵',
    color: '#8B4513'
  },
  tile: {
    id: 'tile',
    type: 'tile',
    name: '瓷砖',
    unit: '箱',
    icon: '🔲',
    color: '#E0E0E0'
  },
  paint: {
    id: 'paint',
    type: 'paint',
    name: '涂料',
    unit: '桶',
    icon: '🎨',
    color: '#4682B4'
  },
  pipe: {
    id: 'pipe',
    type: 'pipe',
    name: '管材',
    unit: '根',
    icon: '🔧',
    color: '#2F4F4F'
  }
};

export const MATERIAL_TYPES: MaterialType[] = ['cement', 'sand', 'brick', 'steel', 'wood', 'tile', 'paint', 'pipe'];

const DIFFICULTY_CONFIGS: Record<Difficulty, Partial<GameConfig>> = {
  easy: {
    gameDays: 7,
    maxInventory: 500,
    shortagePenalty: 10,
    overstockPenalty: 5,
    eventFrequency: 0.1
  },
  medium: {
    gameDays: 14,
    maxInventory: 400,
    shortagePenalty: 20,
    overstockPenalty: 10,
    eventFrequency: 0.25
  },
  hard: {
    gameDays: 21,
    maxInventory: 300,
    shortagePenalty: 30,
    overstockPenalty: 15,
    eventFrequency: 0.4
  }
};

export const ITEM_CONFIGS = [
  {
    id: 'express_delivery',
    name: '加急配送',
    description: '立即将一批货物送达',
    cooldown: 3,
    effect: 'instant_delivery',
    icon: '🚚'
  },
  {
    id: 'quality_check',
    name: '质量检测',
    description: '降低下一批次短缺风险',
    cooldown: 2,
    effect: 'reduce_shortage',
    icon: '🔍'
  },
  {
    id: 'extra_storage',
    name: '临时仓库',
    description: '临时增加库存上限',
    cooldown: 5,
    effect: 'increase_storage',
    icon: '🏭'
  },
  {
    id: 'demand_forecast',
    name: '需求预测',
    description: '显示未来3天的需求量',
    cooldown: 4,
    effect: 'forecast',
    icon: '📊'
  },
  {
    id: 'supplier_bonus',
    name: '供应商激励',
    description: '提高供应商可靠性',
    cooldown: 6,
    effect: 'improve_reliability',
    icon: '🤝'
  }
];

export const ACHIEVEMENT_CONFIGS = [
  {
    id: 'perfect',
    name: '完美调度',
    description: '零短缺完成游戏',
    condition: 'totalShortages === 0'
  },
  {
    id: 'speed',
    name: '效率大师',
    description: '在最短时间内完成',
    condition: 'completionTime < averageTime * 0.7'
  },
  {
    id: 'no_shortage',
    name: '应急专家',
    description: '成功处理5次以上短缺事件',
    condition: 'resolvedShortages >= 5'
  },
  {
    id: 'master_planner',
    name: '规划大师',
    description: '周转天数低于平均值30%',
    condition: 'averageTurnoverDays < globalAverage * 0.7'
  },
  {
    id: 'survivor',
    name: '逆境生存',
    description: '困难难度通关',
    condition: 'difficulty === "hard" && completed'
  }
];

export const DEFAULT_CONFIG: GameConfig = {
  difficulty: 'medium',
  gameDays: 14,
  maxInventory: 400,
  shortagePenalty: 20,
  overstockPenalty: 10,
  eventFrequency: 0.25,
  items: ITEM_CONFIGS,
  achievements: ACHIEVEMENT_CONFIGS,
  analytics: {
    enabled: true,
    trackActions: true,
    trackThinkingTime: true
  }
};

export const getConfigByDifficulty = (difficulty: Difficulty): GameConfig => {
  const base = { ...DEFAULT_CONFIG, ...DIFFICULTY_CONFIGS[difficulty] };
  return {
    ...base,
    difficulty
  };
};

export const WORK_AREAS = ['客厅', '卧室', '厨房', '卫生间', '阳台', '玄关'];

export const DAILY_DEMAND_BASE: Record<MaterialType, number> = {
  cement: 20,
  sand: 15,
  brick: 50,
  steel: 10,
  wood: 8,
  tile: 12,
  paint: 5,
  pipe: 6
};

export const EVENT_MESSAGES = {
  shortage: [
    '{material}批次抽检不合格，需要退回重发',
    '供应商{supplier}库存不足，{material}短缺{amount}单位',
    '运输途中{material}损坏，实际到货量减少{amount}',
    '仓库盘点发现{material}库存差异，实际缺少{amount}'
  ],
  delay: [
    '恶劣天气导致{material}配送延误',
    '供应商{supplier}生产线故障，{material}发货延迟',
    '交通管制，{material}预计晚到1天'
  ],
  quality: [
    '{material}质量抽检发现问题，需要复检',
    '{material}规格不符，需要协调更换'
  ],
  extra_demand: [
    '{workArea}施工进度提前，{material}需求增加{amount}',
    '设计变更，{material}需要追加{amount}单位'
  ]
};
