export type GamePhase = 'loading' | 'menu' | 'playing' | 'review' | 'paused';

export type GameStage = 'feedback' | 'rules' | 'scoring';

export type InputMethod = 'keyboard' | 'touch';

export interface Student {
  id: string;
  name: string;
  avatar: string;
  performance: number;
  improvement: number;
  submissions: Submission[];
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  score: number;
  submittedAt: number;
  isLate: boolean;
  content: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  chapter: number;
  difficulty: 'easy' | 'medium' | 'hard';
  deadline: number;
  maxScore: number;
  weight: number;
}

export interface ReminderRule {
  id: string;
  title: string;
  description: string;
  condition: string;
  action: string;
  penalty: number;
  active: boolean;
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  topics: string[];
  assignments: Assignment[];
}

export interface LevelData {
  id: string;
  title: string;
  description: string;
  courseName: string;
  semester: string;
  chapters: Chapter[];
  students: Student[];
  reminderRules: ReminderRule[];
  timeLimit: number;
  targetCompletionRate: number;
  backgroundImage?: string;
}

export interface GameState {
  currentPhase: GamePhase;
  currentStage: GameStage;
  currentLevelId: string;
  currentChapterIndex: number;
  timeRemaining: number;
  totalScore: number;
  completionRate: number;
  assignmentsGraded: string[];
  remindersSent: string[];
  students: Student[];
  assignments: Assignment[];
  isPaused: boolean;
  progressHistory: ProgressRecord[];
  lagWarningShown: boolean;
  selectedStudentId: string | null;
  selectedAssignmentId: string | null;
  currentScoreInput: number | null;
}

export interface ProgressRecord {
  timestamp: number;
  stage: GameStage;
  completionRate: number;
  score: number;
  assignmentsGraded: number;
}

export interface SaveData {
  unlockedLevels: string[];
  levelScores: Record<string, number>;
  levelCompletionRates: Record<string, number>;
  totalPlayTime: number;
  lastPlayed: number;
}

export interface UIButtonConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize?: number;
  color?: string;
  bgColor?: number;
  hoverColor?: number;
  onClick: () => void;
}

export interface DialogConfig {
  title: string;
  content: string;
  buttons: {
    text: string;
    onClick: () => void;
    isPrimary?: boolean;
  }[];
}

export interface CardDragData {
  assignmentId: string;
  startX: number;
  startY: number;
  isDragging: boolean;
}

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const COLORS = {
  primary: 0x4a90d9,
  secondary: 0x2c5282,
  success: 0x48bb78,
  warning: 0xed8936,
  danger: 0xe53e3e,
  background: 0x1a202c,
  surface: 0x2d3748,
  surfaceLight: 0x4a5568,
  text: 0xffffff,
  textMuted: 0xa0aec0,
  border: 0x718096
};

export const KEY_MAPPINGS = {
  UP: ['ArrowUp', 'W', 'w'],
  DOWN: ['ArrowDown', 'S', 's'],
  LEFT: ['ArrowLeft', 'A', 'a'],
  RIGHT: ['ArrowRight', 'D', 'd'],
  CONFIRM: ['Enter', 'Space'],
  CANCEL: ['Escape', 'Backspace'],
  TAB_LEFT: ['Q', 'q'],
  TAB_RIGHT: ['E', 'e'],
  HELP: ['F1', '?']
};
