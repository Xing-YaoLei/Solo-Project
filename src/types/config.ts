import type { Question, Evidence, TagOption, CalendarTask, CleaningTask } from './training';

export interface RewardConfig {
  id: string;
  name: string;
}

export interface RewardItem {
  id: string;
  configId: string;
  type: string;
  threshold: number;
  value: string;
}

export interface ScheduleConfig {
  id: string;
  levelId: string;
}

export interface TimeSlot {
  id: string;
  configId: string;
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
  configId: string;
  key: string;
  value: string;
}

export interface Asset {
  id: string;
  name: string;
  type: 'model' | 'image' | 'audio';
  url: string;
  questionId?: string;
  uploadedAt: Date;
}

export interface ConfigBundle {
  questions: Question[];
  evidences: Evidence[];
  tagOptions: TagOption[];
  calendarTasks: CalendarTask[];
  cleaningTasks: CleaningTask[];
  assets: Asset[];
  rewardConfigs: RewardConfig[];
  rewardItems: RewardItem[];
  scheduleConfigs: ScheduleConfig[];
  timeSlots: TimeSlot[];
  modeConfigs: ModeConfig[];
  modeParams: ModeParam[];
}
