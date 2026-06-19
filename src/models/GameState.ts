import { PlayerAction, GamePhase } from './Task';
import { Level } from './Level';

export interface GameState {
  phase: GamePhase;
  currentLevel: Level | null;
  currentStepIndex: number;
  actions: PlayerAction[];
  startTime: number | null;
  endTime: number | null;
  totalScore: number;
  errorCount: number;
  isPaused: boolean;
  isReplayMode: boolean;
  replaySpeed: number;
  currentReplayIndex: number;
}

export interface GameResult {
  levelId: string;
  levelName: string;
  totalScore: number;
  maxScore: number;
  accuracyPercentage: number;
  totalTimeMs: number;
  expectedTimeMs: number;
  errorCount: number;
  actions: PlayerAction[];
  errors: {
    stepNumber: number;
    stepPrompt: string;
    wrongAction: string;
    correctAction: string;
    reason: string;
    timeSpentMs: number;
  }[];
  stallPoints: {
    stepNumber: number;
    stepPrompt: string;
    timeSpentMs: number;
    thresholdMs: number;
  }[];
  passed: boolean;
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
  completedAt: string;
}

export interface ReplayFrame {
  timestamp: number;
  stepIndex: number;
  action: PlayerAction | null;
  score: number;
  errorCount: number;
}

export interface ReplaySession {
  id: string;
  levelId: string;
  vehicleArchiveId: string;
  vehicleInfo: {
    brand: string;
    model: string;
    plateNumber: string;
    vin: string;
  };
  result: GameResult;
  frames: ReplayFrame[];
  createdAt: string;
}
