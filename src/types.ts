export type GradeFeedback = 'excellent' | 'good' | 'pass' | 'fail';

export type ReminderRule = 'deadline' | 'retry' | 'plagiarism' | 'late';

export interface Homework {
  id: string;
  chapterId: string;
  studentName: string;
  submitTime: number;
  deadline: number;
  isLate: boolean;
  hasPlagiarism: boolean;
  needsRetry: boolean;
  correctGrade: GradeFeedback;
  correctRules: ReminderRule[];
}

export interface Chapter {
  id: string;
  name: string;
  description: string;
  order: number;
}

export interface ChoiceResult {
  homeworkId: string;
  selectedGrade: GradeFeedback | null;
  selectedRules: ReminderRule[];
  selectedChapterId: string | null;
  isCorrect: boolean;
  timeTaken: number;
  errorType?: 'grade' | 'rule' | 'chapter';
}

export interface FailureRecord {
  id: string;
  timestamp: number;
  chapterId: string;
  errors: ChoiceResult[];
  replaySnapshot: ReplaySnapshot;
}

export interface ReplaySnapshot {
  homeworks: Homework[];
  playerChoices: ChoiceResult[];
  correctAnswers: Map<string, { grade: GradeFeedback; rules: ReminderRule[]; chapterId: string }>;
}

export interface GameStats {
  totalAttempts: number;
  correctCount: number;
  completionRate: number;
  averageTimePerHomework: number;
  chapterStats: Map<string, { attempts: number; correct: number; failures: number }>;
  recentFailures: FailureRecord[];
  errorBreakdown: {
    gradeErrors: number;
    ruleErrors: number;
    chapterErrors: number;
  };
}

export type GameScreen = 'menu' | 'playing' | 'result' | 'stats' | 'review' | 'replay';
