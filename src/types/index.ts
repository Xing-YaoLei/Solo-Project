export type QuestionType = 'single' | 'multiple' | 'schedule';

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  description: string;
  options: string[];
  correctAnswer: number | number[];
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  points: number;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  completed: boolean;
  score: number;
  totalPoints: number;
  completedAt?: number;
  timeSpent?: number;
}

export interface Chapter {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
  completed: boolean;
  assignments: Assignment[];
  progress: number;
  order: number;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  totalScore: number;
  completionRate: number;
  totalTime: number;
  level: number;
}

export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  avatar: string;
  value: number;
  rank: number;
  chapterId?: string;
}

export type LeaderboardType = 'completionRate' | 'time';

export interface GameStats {
  chapterId: string;
  chapterTitle: string;
  completionRate: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  averageScore: number;
  attempts: number;
  lastPlayedAt: number;
}

export interface GameState {
  currentView: 'menu' | 'game' | 'leaderboard' | 'stats' | 'tutorial';
  currentChapterId: string | null;
  currentAssignmentId: string | null;
  currentQuestionIndex: number;
  selectedAnswers: number[];
  showResult: boolean;
  isCorrect: boolean;
  tutorialStep: number;
  showTutorial: boolean;
  chapters: Chapter[];
  players: Player[];
  stats: GameStats[];
  gameStartTime: number;
  questionStartTime: number;
}

export interface TutorialStep {
  id: number;
  title: string;
  description: string;
  target: string;
  chapterId?: string;
}
