export type GameMode = 'training' | 'free';
export type GamePhase = 'menu' | 'playing' | 'settlement' | 'review';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type MaterialType = 'cement' | 'sand' | 'brick' | 'steel' | 'wood' | 'tile' | 'paint' | 'pipe';
export type EventType = 'shortage' | 'delay' | 'quality' | 'extra_demand';
export type AchievementType = 'perfect' | 'speed' | 'no_shortage' | 'master_planner' | 'survivor';

export interface Material {
  id: string;
  type: MaterialType;
  name: string;
  unit: string;
  icon: string;
  color: string;
}

export interface Supplier {
  id: string;
  name: string;
  materials: MaterialType[];
  deliveryTime: number;
  reliability: number;
  position: { x: number; y: number };
}

export interface DeliveryBatch {
  id: string;
  supplierId: string;
  materialType: MaterialType;
  quantity: number;
  scheduledDay: number;
  actualDay?: number;
  status: 'pending' | 'arrived' | 'shortage' | 'accepted';
  shortageAmount?: number;
}

export interface UsageRecord {
  id: string;
  materialType: MaterialType;
  quantity: number;
  day: number;
  timestamp: number;
  workArea: string;
}

export interface GameEvent {
  id: string;
  type: EventType;
  day: number;
  message: string;
  materialType?: MaterialType;
  impact: number;
  resolved: boolean;
}

export interface Inventory {
  materialType: MaterialType;
  quantity: number;
  incoming: number;
}

export interface PlayerAction {
  timestamp: number;
  action: string;
  details: Record<string, unknown>;
  thinkingTime?: number;
}

export interface Achievement {
  id: AchievementType;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface GameConfig {
  difficulty: Difficulty;
  gameDays: number;
  maxInventory: number;
  shortagePenalty: number;
  overstockPenalty: number;
  eventFrequency: number;
  items: ItemConfig[];
  achievements: AchievementConfig[];
  analytics: AnalyticsConfig;
}

export interface ItemConfig {
  id: string;
  name: string;
  description: string;
  cooldown: number;
  effect: string;
  icon: string;
}

export interface AchievementConfig {
  id: AchievementType;
  name: string;
  description: string;
  condition: string;
}

export interface AnalyticsConfig {
  enabled: boolean;
  trackActions: boolean;
  trackThinkingTime: boolean;
}

export interface GameState {
  mode: GameMode;
  phase: GamePhase;
  difficulty: Difficulty;
  currentDay: number;
  currentTime: number;
  isPaused: boolean;
  score: number;
  totalScore: number;
  inventory: Inventory[];
  suppliers: Supplier[];
  deliveries: DeliveryBatch[];
  usageRecords: UsageRecord[];
  events: GameEvent[];
  activeEvents: GameEvent[];
  playerActions: PlayerAction[];
  achievements: Achievement[];
  itemCooldowns: Record<string, number>;
  statistics: GameStatistics;
  stuckPoints: StuckPoint[];
}

export interface GameStatistics {
  startTime: number;
  endTime?: number;
  completionTime?: number;
  turnoverDays: Record<MaterialType, number>;
  averageTurnoverDays: number;
  totalShortages: number;
  totalOverstock: number;
  perfectDeliveries: number;
  decisionsMade: number;
  hintsUsed: number;
}

export interface StuckPoint {
  timestamp: number;
  day: number;
  reason: string;
  duration: number;
}

export interface ReviewData {
  statistics: GameStatistics;
  score: number;
  totalScore: number;
  achievements: Achievement[];
  stuckPoints: StuckPoint[];
  actions: PlayerAction[];
  efficiency: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
}
