export interface TrainingRecord {
  id: string;
  userId: string;
  userName: string;
  levelId: string;
  levelName: string;
  mode: 'level' | 'practice';
  score: number;
  totalScore: number;
  accuracy: number;
  totalDuration: number;
  dispatchDuration: number;
  phaseDurations: Record<string, number>;
  stars: number;
  questionResults: QuestionResult[];
  createdAt: number;
  rewardPoints: number;
  badges: string[];
}

export interface QuestionResult {
  questionId: string;
  questionType: string;
  title: string;
  isCorrect: boolean;
  userAnswer: string[] | string;
  correctAnswer: string[] | string;
  scoreEarned: number;
  maxScore: number;
  timeSpent: number;
  errorAnalysis?: string;
}

export interface UserProgress {
  userId: string;
  totalPoints: number;
  totalTrainingTime: number;
  completedLevels: string[];
  unlockedLevels: string[];
  earnedBadges: string[];
  accuracyHistory: AccuracyPoint[];
  records: TrainingRecord[];
}

export interface AccuracyPoint {
  date: number;
  accuracy: number;
  score: number;
  duration: number;
}

export interface DispatchAnalysis {
  avgDispatchDuration: number;
  fastestDispatch: number;
  slowestDispatch: number;
  dispatchDistribution: { range: string; count: number }[];
  phaseTimeBreakdown: { phase: string; avgDuration: number }[];
}
