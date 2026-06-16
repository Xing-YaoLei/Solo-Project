export type Gender = 'male' | 'female';

export type ImageType = 'xray' | 'ct' | 'photo' | 'scan';

export type FollowUpType = 'review' | 'reminder' | 're-examination';

export type ActionType =
  | 'archive'
  | 'forward_doctor'
  | 'forward_front'
  | 'return_missing'
  | 'return_quality'
  | 'follow_up'
  | 'missed_appointment';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type LevelCategory = 'archive' | 'frontdesk' | 'nurse';

export type GameMode = 'training' | 'practice' | 'challenge';

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  avatar: string;
  medicalRecord: string;
}

export interface ImageAttachment {
  id: string;
  type: ImageType;
  url: string;
  thumbnail: string;
  description: string;
  date: string;
}

export interface TreatmentStep {
  id: string;
  order: number;
  description: string;
  requiredImages: string[];
}

export interface FollowUpTask {
  id: string;
  type: FollowUpType;
  dueDate: string;
  description: string;
}

export interface TreatmentPlan {
  id: string;
  name: string;
  description: string;
  steps: TreatmentStep[];
  followUp?: FollowUpTask;
}

export interface GameTask {
  id: string;
  patient: Patient;
  treatmentPlan: TreatmentPlan;
  images: ImageAttachment[];
  correctAction: ActionType;
  correctReason: string;
  timeLimit: number;
  points: number;
  difficulty: Difficulty;
}

export interface Level {
  id: string;
  name: string;
  description: string;
  category: LevelCategory;
  mode: GameMode;
  difficulty: Difficulty;
  tasks: string[];
  timeLimit: number;
  passingScore: number;
  unlocked: boolean;
  stars: number;
  bestScore: number;
}

export interface GameError {
  taskId: string;
  patientName: string;
  selectedAction: ActionType;
  correctAction: ActionType;
  reason: string;
  timestamp: number;
  responseTime: number;
}

export interface GameState {
  currentLevel: Level | null;
  currentTaskIndex: number;
  tasks: GameTask[];
  score: number;
  combo: number;
  maxCombo: number;
  startTime: number;
  elapsedTime: number;
  currentTaskStartTime: number;
  errors: GameError[];
  correctCount: number;
  totalCount: number;
  isPaused: boolean;
  isTutorial: boolean;
  tutorialStep: number;
}

export interface ActionOption {
  type: ActionType;
  label: string;
  icon: string;
  description: string;
  color: string;
}

export interface ValidationResult {
  isCorrect: boolean;
  correctAction: ActionType;
  reason: string;
  points: number;
  errorCategory?: string;
}

export interface GameResult {
  score: number;
  maxScore: number;
  stars: number;
  totalTime: number;
  correctCount: number;
  totalCount: number;
  accuracy: number;
  avgResponseTime: number;
  maxCombo: number;
  errors: GameError[];
  passed: boolean;
}

export interface ErrorCategory {
  code: string;
  label: string;
  description: string;
}

export interface TutorialStep {
  id: number;
  target: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  highlight?: boolean;
}
