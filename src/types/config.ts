export type AssetType = 'image' | 'model' | 'audio';

export interface AssetItem {
  id: string;
  type: AssetType;
  name: string;
  url: string;
  tag: string;
  uploadedAt: number;
  size: number;
}

export interface RewardConfig {
  pointsPerCorrectAnswer: number;
  bonusForPerfectScore: number;
  bonusForFastCompletion: number;
  starsThresholds: [number, number, number];
  badges: Badge[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: string;
  points: number;
  unlocked: boolean;
}

export interface OpenSchedule {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  levelIds: string[];
  active: boolean;
}

export interface TrainingMode {
  id: string;
  name: string;
  description: string;
  icon: string;
  questionTypes: string[];
  difficultyRange: [number, number];
  timeMultiplier: number;
  scoreMultiplier: number;
}

export type QuestionStatus = 'draft' | 'published' | 'archived';

export interface QuestionBankItem {
  id: string;
  type: 'rule' | 'evidence' | 'settlement' | 'compensation';
  title: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  score: number;
  status: QuestionStatus;
  updatedAt: number;
  usageCount: number;
  correctRate: number;
}
