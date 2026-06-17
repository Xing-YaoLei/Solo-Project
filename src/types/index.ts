export type DifficultyId = 'easy' | 'normal' | 'hard';

export interface DifficultyConfig {
  id: DifficultyId;
  name: string;
  description: string;
  billingComplexity: number;
  emergencyFrequency: number;
  emergencyTimeLimit: number;
  patrolPointCount: number;
  timeMultiplier: number;
  itemCooldowns: Record<string, number>;
}

export type ParkingSpotStatus = 'empty' | 'occupied' | 'reserved';

export interface ParkingSpot {
  id: string;
  number: number;
  status: ParkingSpotStatus;
  vehiclePlate?: string;
  entryTime?: number;
  exitTime?: number;
  currentFee: number;
  position: [number, number, number];
}

export type VehicleType = 'car' | 'truck' | 'motorcycle';

export interface AccessRecord {
  id: string;
  vehiclePlate: string;
  vehicleType: VehicleType;
  entryTime: number;
  assignedSpotId?: string;
  isProcessed: boolean;
}

export interface Bill {
  id: string;
  spotId: string;
  vehiclePlate: string;
  durationMinutes: number;
  baseFee: number;
  discount: number;
  totalFee: number;
  isPaid: boolean;
  hasException: boolean;
  exceptionReason?: string;
}

export type PatrolTaskType = 'check' | 'repair' | 'verify';

export interface PatrolTask {
  type: PatrolTaskType;
  description: string;
}

export interface PatrolPoint {
  id: string;
  order: number;
  name: string;
  position: [number, number, number];
  isVisited: boolean;
  visitedAt?: number;
  task?: PatrolTask;
}

export type EmergencyType = 'device_failure' | 'payment_issue' | 'vehicle_block';

export interface EmergencyEvent {
  id: string;
  type: EmergencyType;
  location: string;
  position: [number, number, number];
  triggeredAt: number;
  resolvedAt?: number;
  isResolved: boolean;
  timeLimit: number;
  description: string;
}

export type InteractionType = 'drag' | 'click' | 'key';

export interface Interaction {
  type: InteractionType;
  target: string;
}

export interface ReplayFrame {
  timestamp: number;
  playerPosition: [number, number, number];
  cameraRotation: [number, number, number];
  spots: ParkingSpot[];
  currentTask: string;
  interaction?: Interaction;
}

export type LagReason = 'thinking' | 'interaction' | 'waiting';

export interface LagPoint {
  timestamp: number;
  duration: number;
  reason: LagReason;
  description: string;
  position: [number, number, number];
}

export interface ReplayData {
  id: string;
  sessionId: string;
  difficulty: string;
  startTime: number;
  endTime: number;
  frames: ReplayFrame[];
  lagPoints: LagPoint[];
  failureReason: string;
  finalScore: number;
}

export type ConditionType = 'score' | 'time' | 'accuracy' | 'streak';
export type ConditionOperator = 'gt' | 'lt' | 'eq';

export interface AchievementCondition {
  type: ConditionType;
  operator: ConditionOperator;
  value: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: AchievementCondition;
  isUnlocked: boolean;
  unlockedAt?: number;
}

export type AnalyticsEventType = 'game_start' | 'game_end' | 'task_complete' | 'task_fail' | 'emergency' | 'achievement';

export interface AnalyticsEvent {
  id: string;
  sessionId: string;
  eventType: AnalyticsEventType;
  eventData: Record<string, any>;
  timestamp: number;
}

export type GamePhase = 'access_control' | 'billing' | 'patrol' | 'settlement' | 'emergency' | 'ended';

export interface GameState {
  sessionId: string;
  difficulty: DifficultyId;
  phase: GamePhase;
  gameTime: number;
  realStartTime: number;
  score: number;
  accuracy: number;
  efficiency: number;
  emergencyHandling: number;
  spots: ParkingSpot[];
  accessRecords: AccessRecord[];
  bills: Bill[];
  patrolPoints: PatrolPoint[];
  currentPatrolIndex: number;
  emergencies: EmergencyEvent[];
  activeEmergency: EmergencyEvent | null;
  playerPosition: [number, number, number];
  cameraRotation: [number, number, number];
  isPaused: boolean;
  isFailed: boolean;
  failureReason?: string;
}

export interface GameConfig {
  baseParkingRate: number;
  motorcycleRate: number;
  truckRateMultiplier: number;
  discountThresholdMinutes: number;
  discountPercentage: number;
  maxReplayCount: number;
  lagThresholdSeconds: number;
  patrolSpeed: number;
}

export interface ItemConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  cooldown: number;
  effect: string;
}

export interface AnalyticsConfig {
  enabled: boolean;
  trackedEvents: AnalyticsEventType[];
}

export interface Settings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  analyticsEnabled: boolean;
  postProcessingEnabled: boolean;
}

export interface ReviewStats {
  totalDuration: number;
  spotTurnover: number;
  averageHandlingTime: number;
  accuracyRate: number;
  emergencyCount: number;
  emergencyResolvedCount: number;
  lagPoints: LagPoint[];
  lagHeatmap: { position: [number, number, number]; count: number }[];
}

export interface GameStats {
  totalGames: number;
  wins: number;
  bestScore: number;
  bestTime: number;
  currentStreak: number;
  bestStreak: number;
  totalEmergenciesHandled: number;
  totalPlayTime: number;
}
