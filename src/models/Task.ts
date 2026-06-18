import type { Difficulty, TaskStatus } from './index';

export interface Task {
  id: string;
  title: string;
  description: string;
  clientName: string;
  difficulty: Difficulty;
  budget: number;
  duration: number;
  houseType: string;
  area: number;
  requirements: string[];
  reward: number;
  penaltyRate: number;
  unlocked: boolean;
  status: TaskStatus;
}
