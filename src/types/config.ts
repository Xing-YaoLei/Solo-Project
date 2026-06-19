import type { Question, Evidence, TagOption, CalendarTask, CleaningTask } from './training';

export interface RewardConfig {
  id: string;
  name: string;
}

export interface RewardItem {
  id: string;
  type: 'points' | 'badge' | 'level';
  threshold: number;
  value: string;
}

export interface ScheduleConfig {
  id: string;
  levelId: string;
}

export interface TimeSlot {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  maxAttempts: number;
}

export interface ModeConfig {
  id: string;
  mode: string;
}

export interface ModeParam {
  id: string;
  key: string;
  value: string;
}

export interface Asset {
  id: string;
  name: string;
  type: 'model' | 'image' | 'audio';
  url: string;
  questionId?: string;
  uploadedAt: string;
  fileSize?: number;
}

export interface ConfigBundle {
  questions: Question[];
  rewards: RewardItem[];
  schedule: TimeSlot[];
  modes: ModeParam[];
  assets: Asset[];
}
