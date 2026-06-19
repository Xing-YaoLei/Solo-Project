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
  openTime: Date;
  closeTime: Date;
}

export interface Question {
  id: string;
  levelId: string;
  type: QuestionType;
  description: string;
  score: number;
  correctReason: string;
}

export interface Evidence {
  id: string;
  questionId: string;
  name: string;
  description: string;
  isCorrect: boolean;
  position: string;
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
  checkOut: Date;
  nextCheckIn: Date;
  priority: number;
  requiredMinutes: number;
}

export interface CleaningTask {
  id: string;
  questionId: string;
  roomId: string;
  type: string;
  priority: number;
  deadline: Date;
  assignedTo: string;
}

export interface QuestionResult {
  id: string;
  recordId: string;
  questionId: string;
  type: QuestionType;
  isCorrect: boolean;
  timeSpent: number;
  hesitationPoints: number;
  userAnswer: string;
}

export interface TrainingRecord {
  id: string;
  userId: string;
  levelId: string;
  score: number;
  onTimeRate: number;
  status: string;
  startTime: Date;
  endTime: Date;
}
