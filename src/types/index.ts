export * from './game';
export * from './member';

export interface LevelConfig {
  id: string;
  name: string;
  difficulty: number;
  minScore: number;
  description: string;
  taskIds: string[];
  backgroundStory: string;
  unlockHint: string;
}

export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  targetElement?: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}
