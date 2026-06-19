export interface Stats {
  totalScore: number;
  averageScore: number;
  completedLevels: number;
  totalAttempts: number;
  overallOnTimeRate: number;
  ranking: number;
  totalUsers: number;
}

export interface RecordsStats {
  totalAttempts: number;
  completedCount: number;
  averageScore: number;
  averageOnTimeRate: number;
  levelStats: {
    levelId: string;
    levelName: string;
    attempts: number;
    bestScore: number;
    averageOnTimeRate: number;
  }[];
}

export interface OnTimeRateBreakdown {
  evidence: number;
  tag: number;
  calendar: number;
  task: number;
  trend: {
    date: string;
    rate: number;
  }[];
}
