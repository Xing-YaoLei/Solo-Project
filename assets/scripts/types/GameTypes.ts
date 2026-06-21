export interface Position {
  x: number;
  y: number;
  name: string;
  address: string;
}

export interface Order {
  id: string;
  createdAt: number;
  pickup: Position;
  delivery: Position;
  expectedTime: number;
  basePrice: number;
  distance: number;
  priority: 'normal' | 'urgent' | 'vip';
  status: 'pending' | 'assigned' | 'picked' | 'delivered' | 'failed' | 'rejected';
  riderId?: string;
  acceptedAt?: number;
  pickedAt?: number;
  deliveredAt?: number;
  failedReason?: string;
  wrongSteps: WrongStep[];
}

export interface Rider {
  id: string;
  name: string;
  avatar: string;
  position: Position;
  status: 'idle' | 'busy' | 'offline' | 'rejecting';
  currentOrderId?: string;
  efficiency: number;
  satisfaction: number;
  totalOrders: number;
  rejectionCount: number;
  rejectWarningLevel: number;
  trajectory: TrajectoryPoint[];
}

export interface TrajectoryPoint {
  time: number;
  position: Position;
  speed: number;
  event?: string;
}

export interface SubsidyRule {
  id: string;
  name: string;
  description: string;
  condition: {
    timeRange?: [number, number];
    minDistance?: number;
    maxDistance?: number;
    priority?: string;
    weather?: string;
  };
  subsidyType: 'per_order' | 'distance_multiplier' | 'time_bonus';
  value: number;
  active: boolean;
}

export interface WrongStep {
  time: number;
  type: 'address' | 'rider' | 'subsidy' | 'timing';
  description: string;
  correctAction: string;
  impact: {
    cost: number;
    delay: number;
    satisfaction: number;
  };
}

export interface GameState {
  level: number;
  score: number;
  totalRevenue: number;
  totalCost: number;
  totalCompensation: number;
  orders: Order[];
  riders: Rider[];
  activeSubsidies: SubsidyRule[];
  currentTime: number;
  isPaused: boolean;
  isGameOver: boolean;
  isVictory: boolean;
  wrongSteps: WrongStep[];
  gameSpeed: number;
  weather: 'sunny' | 'rainy' | 'snowy' | 'hot';
}

export interface LevelConfig {
  id: number;
  name: string;
  description: string;
  duration: number;
  targetScore: number;
  maxOrders: number;
  maxCompensation: number;
  orderFrequency: number;
  riderCount: number;
  initialSubsidies: string[];
  weather: 'sunny' | 'rainy' | 'snowy' | 'hot';
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface ReplayRecord {
  id: string;
  levelId: number;
  timestamp: number;
  score: number;
  isVictory: boolean;
  totalCompensation: number;
  wrongSteps: WrongStep[];
  gameStateSnapshots: GameStateSnapshot[];
  duration: number;
}

export interface GameStateSnapshot {
  time: number;
  orders: Order[];
  riders: Rider[];
  activeSubsidies: SubsidyRule[];
  score: number;
  totalCompensation: number;
}

export interface AppealEvidence {
  orderId: string;
  wrongStep: WrongStep;
  riderTrajectory: TrajectoryPoint[];
  orderTimeline: { time: number; event: string }[];
  subsidyApplied: boolean;
  compensationAmount: number;
  appealable: boolean;
  appealSuccessRate: number;
}

export interface Statistics {
  totalGames: number;
  totalVictories: number;
  totalOrdersProcessed: number;
  totalCompensationPaid: number;
  avgScore: number;
  wrongStepStats: Record<string, number>;
  subsidyEffectiveness: Record<string, { used: number; saved: number }>;
  riderPerformance: Record<string, { orders: number; rejections: number }>;
}
