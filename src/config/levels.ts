import { Supplier, MaterialType } from '../types';

export interface Level {
  id: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  mode: 'training' | 'free';
  suppliers: Supplier[];
  initialInventory: { materialType: MaterialType; quantity: number }[];
  targetDays: number;
  dailyDemandMultiplier: number;
  availableItems: string[];
  hints: string[];
}

export const TRAINING_LEVELS: Level[] = [
  {
    id: 'training_1',
    name: '新手入门',
    description: '学习基础的材料进场调度流程，了解库存管理',
    difficulty: 'easy',
    mode: 'training',
    suppliers: [
      {
        id: 'supplier_1',
        name: '建材批发中心',
        materials: ['cement', 'sand', 'brick'],
        deliveryTime: 1,
        reliability: 0.95,
        position: { x: -4, y: 2 }
      },
      {
        id: 'supplier_2',
        name: '钢材直销店',
        materials: ['steel', 'wood'],
        deliveryTime: 2,
        reliability: 0.9,
        position: { x: 4, y: 2 }
      }
    ],
    initialInventory: [
      { materialType: 'cement', quantity: 100 },
      { materialType: 'sand', quantity: 80 },
      { materialType: 'brick', quantity: 200 },
      { materialType: 'steel', quantity: 50 },
      { materialType: 'wood', quantity: 40 }
    ],
    targetDays: 7,
    dailyDemandMultiplier: 0.8,
    availableItems: ['express_delivery', 'demand_forecast'],
    hints: [
      '每天开工前检查库存',
      '预留3-5天的安全库存',
      '水泥保质期短，不要囤货太多'
    ]
  },
  {
    id: 'training_2',
    name: '多供应商协调',
    description: '学习协调多个供应商，应对不同材料的需求',
    difficulty: 'medium',
    mode: 'training',
    suppliers: [
      {
        id: 'supplier_1',
        name: '建材批发中心',
        materials: ['cement', 'sand', 'brick'],
        deliveryTime: 1,
        reliability: 0.9,
        position: { x: -5, y: 3 }
      },
      {
        id: 'supplier_2',
        name: '钢材直销店',
        materials: ['steel', 'wood'],
        deliveryTime: 2,
        reliability: 0.85,
        position: { x: 0, y: 4 }
      },
      {
        id: 'supplier_3',
        name: '装修材料城',
        materials: ['tile', 'paint', 'pipe'],
        deliveryTime: 2,
        reliability: 0.88,
        position: { x: 5, y: 3 }
      }
    ],
    initialInventory: [
      { materialType: 'cement', quantity: 80 },
      { materialType: 'sand', quantity: 60 },
      { materialType: 'brick', quantity: 150 },
      { materialType: 'steel', quantity: 40 },
      { materialType: 'wood', quantity: 30 },
      { materialType: 'tile', quantity: 40 },
      { materialType: 'paint', quantity: 20 },
      { materialType: 'pipe', quantity: 25 }
    ],
    targetDays: 10,
    dailyDemandMultiplier: 1.0,
    availableItems: ['express_delivery', 'demand_forecast', 'quality_check'],
    hints: [
      '不同供应商的配送时间不同，提前规划',
      '可靠性低的供应商可以多备安全库存',
      '瓷砖怕摔，注意验收检查'
    ]
  },
  {
    id: 'training_3',
    name: '紧急事件处理',
    description: '学习应对材料短缺、配送延误等突发事件',
    difficulty: 'hard',
    mode: 'training',
    suppliers: [
      {
        id: 'supplier_1',
        name: '建材批发中心',
        materials: ['cement', 'sand', 'brick'],
        deliveryTime: 2,
        reliability: 0.8,
        position: { x: -5, y: 3 }
      },
      {
        id: 'supplier_2',
        name: '钢材直销店',
        materials: ['steel', 'wood'],
        deliveryTime: 3,
        reliability: 0.75,
        position: { x: 0, y: 4 }
      },
      {
        id: 'supplier_3',
        name: '装修材料城',
        materials: ['tile', 'paint', 'pipe'],
        deliveryTime: 2,
        reliability: 0.78,
        position: { x: 5, y: 3 }
      }
    ],
    initialInventory: [
      { materialType: 'cement', quantity: 60 },
      { materialType: 'sand', quantity: 50 },
      { materialType: 'brick', quantity: 120 },
      { materialType: 'steel', quantity: 30 },
      { materialType: 'wood', quantity: 25 },
      { materialType: 'tile', quantity: 30 },
      { materialType: 'paint', quantity: 15 },
      { materialType: 'pipe', quantity: 20 }
    ],
    targetDays: 14,
    dailyDemandMultiplier: 1.2,
    availableItems: ['express_delivery', 'demand_forecast', 'quality_check', 'extra_storage', 'supplier_bonus'],
    hints: [
      '突发事件会打乱计划，保持灵活',
      '加急配送可以解燃眉之急，但成本高',
      '与供应商搞好关系很重要'
    ]
  }
];

export const FREE_LEVELS: Level[] = [
  {
    id: 'free_1',
    name: '小型家装',
    description: '自由模式 - 100平米住宅装修',
    difficulty: 'easy',
    mode: 'free',
    suppliers: [
      {
        id: 'supplier_1',
        name: '建材批发中心',
        materials: ['cement', 'sand', 'brick'],
        deliveryTime: 1,
        reliability: 0.92,
        position: { x: -4, y: 2 }
      },
      {
        id: 'supplier_2',
        name: '钢材直销店',
        materials: ['steel', 'wood'],
        deliveryTime: 2,
        reliability: 0.88,
        position: { x: 0, y: 3 }
      },
      {
        id: 'supplier_3',
        name: '装修材料城',
        materials: ['tile', 'paint', 'pipe'],
        deliveryTime: 2,
        reliability: 0.9,
        position: { x: 4, y: 2 }
      }
    ],
    initialInventory: [
      { materialType: 'cement', quantity: 80 },
      { materialType: 'sand', quantity: 60 },
      { materialType: 'brick', quantity: 150 },
      { materialType: 'steel', quantity: 40 },
      { materialType: 'wood', quantity: 30 },
      { materialType: 'tile', quantity: 35 },
      { materialType: 'paint', quantity: 18 },
      { materialType: 'pipe', quantity: 22 }
    ],
    targetDays: 14,
    dailyDemandMultiplier: 1.0,
    availableItems: ['express_delivery', 'demand_forecast', 'quality_check', 'extra_storage', 'supplier_bonus'],
    hints: []
  },
  {
    id: 'free_2',
    name: '中型工装',
    description: '自由模式 - 300平米办公室装修',
    difficulty: 'medium',
    mode: 'free',
    suppliers: [
      {
        id: 'supplier_1',
        name: '建材批发中心',
        materials: ['cement', 'sand', 'brick'],
        deliveryTime: 2,
        reliability: 0.85,
        position: { x: -5, y: 3 }
      },
      {
        id: 'supplier_2',
        name: '钢材直销店',
        materials: ['steel', 'wood'],
        deliveryTime: 2,
        reliability: 0.82,
        position: { x: 0, y: 4 }
      },
      {
        id: 'supplier_3',
        name: '装修材料城',
        materials: ['tile', 'paint', 'pipe'],
        deliveryTime: 3,
        reliability: 0.8,
        position: { x: 5, y: 3 }
      }
    ],
    initialInventory: [
      { materialType: 'cement', quantity: 120 },
      { materialType: 'sand', quantity: 90 },
      { materialType: 'brick', quantity: 250 },
      { materialType: 'steel', quantity: 60 },
      { materialType: 'wood', quantity: 45 },
      { materialType: 'tile', quantity: 55 },
      { materialType: 'paint', quantity: 28 },
      { materialType: 'pipe', quantity: 35 }
    ],
    targetDays: 21,
    dailyDemandMultiplier: 1.5,
    availableItems: ['express_delivery', 'demand_forecast', 'quality_check', 'extra_storage', 'supplier_bonus'],
    hints: []
  },
  {
    id: 'free_3',
    name: '大型项目',
    description: '自由模式 - 1000平米商业空间装修',
    difficulty: 'hard',
    mode: 'free',
    suppliers: [
      {
        id: 'supplier_1',
        name: '建材批发中心',
        materials: ['cement', 'sand', 'brick'],
        deliveryTime: 3,
        reliability: 0.78,
        position: { x: -6, y: 3 }
      },
      {
        id: 'supplier_2',
        name: '钢材直销店',
        materials: ['steel', 'wood'],
        deliveryTime: 3,
        reliability: 0.75,
        position: { x: 0, y: 4 }
      },
      {
        id: 'supplier_3',
        name: '装修材料城',
        materials: ['tile', 'paint', 'pipe'],
        deliveryTime: 4,
        reliability: 0.72,
        position: { x: 6, y: 3 }
      }
    ],
    initialInventory: [
      { materialType: 'cement', quantity: 200 },
      { materialType: 'sand', quantity: 150 },
      { materialType: 'brick', quantity: 400 },
      { materialType: 'steel', quantity: 100 },
      { materialType: 'wood', quantity: 75 },
      { materialType: 'tile', quantity: 90 },
      { materialType: 'paint', quantity: 45 },
      { materialType: 'pipe', quantity: 55 }
    ],
    targetDays: 30,
    dailyDemandMultiplier: 2.5,
    availableItems: ['express_delivery', 'demand_forecast', 'quality_check', 'extra_storage', 'supplier_bonus'],
    hints: []
  }
];

export const getAllLevels = () => [...TRAINING_LEVELS, ...FREE_LEVELS];
export const getTrainingLevels = () => TRAINING_LEVELS;
export const getFreeLevels = () => FREE_LEVELS;
export const getLevelById = (id: string) => getAllLevels().find(l => l.id === id);
