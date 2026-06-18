import {
  MaterialType,
  UsageRecord,
  DeliveryBatch,
  GameEvent,
  Inventory,
  GameStatistics,
  ReviewData,
  GameState,
  Achievement,
  AchievementType
} from '../types';
import {
  MATERIALS,
  MATERIAL_TYPES,
  DAILY_DEMAND_BASE,
  WORK_AREAS,
  EVENT_MESSAGES,
  getConfigByDifficulty,
  ACHIEVEMENT_CONFIGS
} from '../config/gameConfig';
import { Level } from '../config/levels';

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const generateUsageRecord = (
  day: number,
  multiplier: number
): UsageRecord => {
  const materialType = MATERIAL_TYPES[Math.floor(Math.random() * MATERIAL_TYPES.length)];
  const baseDemand = DAILY_DEMAND_BASE[materialType];
  const variation = 0.7 + Math.random() * 0.6;
  const quantity = Math.floor(baseDemand * multiplier * variation);
  const workArea = WORK_AREAS[Math.floor(Math.random() * WORK_AREAS.length)];

  return {
    id: generateId(),
    materialType,
    quantity,
    day,
    timestamp: Date.now(),
    workArea
  };
};

export const generateDailyUsages = (
  day: number,
  count: number,
  multiplier: number
): UsageRecord[] => {
  return Array.from({ length: count }, () => generateUsageRecord(day, multiplier));
};

export const generateRandomEvent = (
  day: number,
  deliveries: DeliveryBatch[]
): GameEvent | null => {
  const eventTypes: Array<'shortage' | 'delay' | 'quality' | 'extra_demand'> = [
    'shortage',
    'delay',
    'quality',
    'extra_demand'
  ];
  const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  const messages = EVENT_MESSAGES[type];
  const messageTemplate = messages[Math.floor(Math.random() * messages.length)];

  const materialType = MATERIAL_TYPES[Math.floor(Math.random() * MATERIAL_TYPES.length)];
  const material = MATERIALS[materialType];
  const workArea = WORK_AREAS[Math.floor(Math.random() * WORK_AREAS.length)];
  const amount = Math.floor(10 + Math.random() * 30);
  const supplier = deliveries.find(d => d.materialType === materialType)?.supplierId || '供应商';

  let message = messageTemplate
    .replace('{material}', material.name)
    .replace('{supplier}', supplier)
    .replace('{amount}', amount.toString())
    .replace('{workArea}', workArea);

  return {
    id: generateId(),
    type,
    day,
    message,
    materialType,
    impact: type === 'shortage' ? amount : type === 'extra_demand' ? amount : 10,
    resolved: false
  };
};

export const calculateInventory = (
  inventory: Inventory[],
  usages: UsageRecord[],
  deliveries: DeliveryBatch[]
): Inventory[] => {
  const updatedInventory = inventory.map(inv => ({ ...inv }));

  usages.forEach(usage => {
    const inv = updatedInventory.find(i => i.materialType === usage.materialType);
    if (inv) {
      inv.quantity = Math.max(0, inv.quantity - usage.quantity);
    }
  });

  deliveries
    .filter(d => d.status === 'arrived')
    .forEach(delivery => {
      const inv = updatedInventory.find(i => i.materialType === delivery.materialType);
      if (inv) {
        const received = delivery.shortageAmount
          ? delivery.quantity - delivery.shortageAmount
          : delivery.quantity;
        inv.quantity += received;
      }
    });

  const pendingDeliveries = deliveries.filter(d => d.status === 'pending');
  updatedInventory.forEach(inv => {
    inv.incoming = pendingDeliveries
      .filter(d => d.materialType === inv.materialType)
      .reduce((sum, d) => sum + d.quantity, 0);
  });

  return updatedInventory;
};

export const checkShortages = (inventory: Inventory[]): { materialType: MaterialType; shortage: number }[] => {
  return inventory
    .filter(inv => inv.quantity < 0)
    .map(inv => ({ materialType: inv.materialType, shortage: Math.abs(inv.quantity) }));
};

export const calculateScore = (
  inventory: Inventory[],
  events: GameEvent[],
  config: ReturnType<typeof getConfigByDifficulty>
): number => {
  let score = 1000;

  inventory.forEach(inv => {
    if (inv.quantity < 0) {
      score -= Math.abs(inv.quantity) * config.shortagePenalty;
    }
    if (inv.quantity > config.maxInventory) {
      score -= (inv.quantity - config.maxInventory) * config.overstockPenalty;
    }
  });

  const unresolvedEvents = events.filter(e => !e.resolved);
  score -= unresolvedEvents.length * 50;

  const resolvedShortages = events.filter(e => e.type === 'shortage' && e.resolved);
  score += resolvedShortages.length * 30;

  return Math.max(0, score);
};

export const calculateTurnoverDays = (
  usages: UsageRecord[],
  inventory: Inventory[],
  totalDays: number
): Record<MaterialType, number> => {
  const turnover: Record<MaterialType, number> = {} as Record<MaterialType, number>;

  MATERIAL_TYPES.forEach(type => {
    const totalUsage = usages
      .filter(u => u.materialType === type)
      .reduce((sum, u) => sum + u.quantity, 0);
    const avgInventory = inventory.find(i => i.materialType === type)?.quantity || 0;

    if (totalUsage > 0 && avgInventory > 0) {
      turnover[type] = Math.round((avgInventory / (totalUsage / totalDays)) * 10) / 10;
    } else {
      turnover[type] = 0;
    }
  });

  return turnover;
};

export const calculateStatistics = (
  state: GameState,
  totalDays: number
): GameStatistics => {
  const turnoverDays = calculateTurnoverDays(state.usageRecords, state.inventory, totalDays);
  const averageTurnoverDays = Object.values(turnoverDays).reduce((sum, t) => sum + t, 0) / MATERIAL_TYPES.length;

  return {
    startTime: state.statistics.startTime,
    endTime: Date.now(),
    completionTime: Date.now() - state.statistics.startTime,
    turnoverDays,
    averageTurnoverDays: Math.round(averageTurnoverDays * 10) / 10,
    totalShortages: state.deliveries.filter(d => d.status === 'shortage').length,
    totalOverstock: state.inventory.filter(i => i.quantity > getConfigByDifficulty(state.difficulty).maxInventory).length,
    perfectDeliveries: state.deliveries.filter(d => d.status === 'accepted' && !d.shortageAmount).length,
    decisionsMade: state.playerActions.length,
    hintsUsed: state.statistics.hintsUsed
  };
};

export const calculateGrade = (score: number, totalScore: number): ReviewData['grade'] => {
  const percentage = score / totalScore;
  if (percentage >= 0.95) return 'S';
  if (percentage >= 0.85) return 'A';
  if (percentage >= 0.7) return 'B';
  if (percentage >= 0.5) return 'C';
  return 'D';
};

export const generateReviewData = (state: GameState, totalDays: number): ReviewData => {
  const statistics = calculateStatistics(state, totalDays);
  const grade = calculateGrade(state.score, state.totalScore);
  const efficiency = Math.round((state.score / state.totalScore) * 100);

  return {
    statistics,
    score: state.score,
    totalScore: state.totalScore,
    achievements: state.achievements,
    stuckPoints: state.stuckPoints,
    actions: state.playerActions,
    efficiency,
    grade
  };
};

export const checkAchievements = (
  state: GameState,
  statistics: GameStatistics
): Achievement[] => {
  const achievements: Achievement[] = [...state.achievements];
  const config = getConfigByDifficulty(state.difficulty);

  ACHIEVEMENT_CONFIGS.forEach(configAch => {
    const achId = configAch.id as AchievementType;
    const existing = achievements.find(a => a.id === achId);
    if (existing && existing.unlocked) return;

    let unlocked = false;

    switch (achId) {
      case 'perfect':
        unlocked = statistics.totalShortages === 0;
        break;
      case 'speed':
        unlocked = statistics.completionTime !== undefined && statistics.completionTime < config.gameDays * 60000 * 0.7;
        break;
      case 'no_shortage':
        unlocked = state.events.filter(e => e.type === 'shortage' && e.resolved).length >= 5;
        break;
      case 'master_planner':
        unlocked = statistics.averageTurnoverDays < 7;
        break;
      case 'survivor':
        unlocked = state.difficulty === 'hard' && (state.phase === 'review' || state.phase === 'settlement');
        break;
    }

    if (unlocked) {
      const achievement: Achievement = existing ? { ...existing } : {
        id: achId,
        name: configAch.name,
        description: configAch.description,
        unlocked: false
      };
      achievement.unlocked = true;
      achievement.unlockedAt = Date.now();

      const index = achievements.findIndex(a => a.id === achId);
      if (index >= 0) {
        achievements[index] = achievement;
      } else {
        achievements.push(achievement);
      }
    }
  });

  return achievements;
};

export const createDeliveryBatch = (
  supplierId: string,
  materialType: MaterialType,
  quantity: number,
  scheduledDay: number
): DeliveryBatch => {
  return {
    id: generateId(),
    supplierId,
    materialType,
    quantity,
    scheduledDay,
    status: 'pending'
  };
};

export const createInitialInventory = (level: Level): Inventory[] => {
  const usedTypes = new Set(level.suppliers.flatMap(s => s.materials));
  return MATERIAL_TYPES.filter(t => usedTypes.has(t)).map(type => {
    const initial = level.initialInventory.find(i => i.materialType === type);
    return {
      materialType: type,
      quantity: initial?.quantity || 0,
      incoming: 0
    };
  });
};

export const formatTime = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}时${minutes % 60}分${seconds % 60}秒`;
  }
  if (minutes > 0) {
    return `${minutes}分${seconds % 60}秒`;
  }
  return `${seconds}秒`;
};

export const getSupplierById = (suppliers: Array<{ id: string; name: string }>, id: string) => {
  return suppliers.find(s => s.id === id);
};
