import { Task, Clue, Document, ApprovalNode } from './Types';

export interface LevelConfig {
  id: string;
  name: string;
  description: string;
  difficulty: number;
  unlocked: boolean;
  starThresholds: number[];
  task: Task;
  clues: Clue[];
  document: Document;
  approvalNodes: ApprovalNode[];
  tutorialId?: string;
  mapData?: TiledMapData;
}

export interface TiledMapData {
  mapFile: string;
  spawnPoints: { x: number; y: number; type: string }[];
  interactiveObjects: { id: string; x: number; y: number; type: string }[];
}

export interface LevelProgress {
  levelId: string;
  bestScore: number;
  bestTime: number;
  stars: number;
  completed: boolean;
  attempts: number;
}
