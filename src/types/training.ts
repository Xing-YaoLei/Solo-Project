export type QuestionType = 'evidence' | 'tag' | 'calendar' | 'task';

export type CameraMode = 'orbit' | 'firstPerson';

export interface ActionLogEntry {
  timestamp: number;
  actionType: string;
  payload: unknown;
}

export interface User {
  id: string;
  name: string;
  role: string;
  totalScore: number;
}

export interface Level {
  id: string;
  name: string;
  difficulty: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface Question {
  id: string;
  levelId: string;
  type: QuestionType;
  description: string;
  score: number;
  recommendedTime: number;
  correctReason: string;
  reviewText?: string;
  evidences?: Evidence[];
  tagOptions?: TagOption[];
  calendarTasks?: CalendarTask[];
  cleaningTasks?: CleaningTask[];
}

export interface EvidencePosition {
  x: number;
  y: number;
  z: number;
}

export interface Evidence {
  id: string;
  questionId: string;
  name: string;
  description: string;
  isCorrect: boolean;
  position: EvidencePosition;
}

export interface TagOption {
  id: string;
  questionId: string;
  label: string;
  isCorrect: boolean;
}

export interface CalendarTask {
  id: string;
  questionId: string;
  roomId: string;
  checkOut: string;
  nextCheckIn: string;
  priority: number;
  requiredMinutes: number;
}

export interface CleaningTask {
  id: string;
  questionId: string;
  roomId: string;
  type: string;
  priority: number;
  deadline: string;
  assignedTo: string;
}

export interface QuestionResult {
  id: string;
  recordId: string;
  questionId: string;
  type: QuestionType;
  isCorrect: boolean;
  timeSpent: number;
  recommendedTime: number;
  hesitationPoints: number;
  userAnswer: string;
}

export interface TrainingRecord {
  id: string;
  userId: string;
  levelId: string;
  score: number;
  onTimeRate: number;
  status: 'completed' | 'failed';
  startTime: string;
  endTime: string;
  results: QuestionResult[];
}
