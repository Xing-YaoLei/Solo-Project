export type DeviceStatus = 'normal' | 'need_clean' | 'fault';
export type DifficultyLevel = 'easy' | 'normal' | 'hard';
export type GamePhase = 'start' | 'playing' | 'paused' | 'inspecting' | 'event' | 'result';
export type FaultType = 'leak' | 'blockage' | 'electrical' | 'mechanical' | 'heating';

export interface Point {
  id: string;
  name: string;
  deviceType: string;
  storeName: string;
  status: DeviceStatus;
  isCompleted: boolean;
  photoUrl: string;
  faultType?: FaultType;
  decisionTime?: number;
  playerDecision?: DeviceStatus;
  isCorrect?: boolean;
  isStuckPoint?: boolean;
  viewedAt?: number;
  decisionSwitchCount?: number;
}

export interface Item {
  id: string;
  name: string;
  icon: string;
  cooldown: number;
  currentCooldown: number;
  effect: string;
}

export interface GameEvent {
  id: string;
  type: 'device_offline';
  pointId: string;
  triggeredAt: number;
  options: EventOption[];
  playerChoice?: string;
  choiceTime?: number;
}

export interface EventOption {
  id: string;
  label: string;
  description: string;
  scoreImpact: number;
  timeImpact: number;
}
