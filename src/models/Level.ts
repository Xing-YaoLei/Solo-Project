import type { ConstructionPhase, Clue, InspectionPhoto, Action } from './index';

export interface SiteObject {
  id: string;
  x: number;
  y: number;
  type: string;
  physics?: boolean;
}

export interface SiteLayout {
  width: number;
  height: number;
  walls: { x: number; y: number; width: number; height: number }[];
  objects: SiteObject[];
}

export interface MaterialDelayEvent {
  id: string;
  materialName: string;
  phase: ConstructionPhase;
  triggerDay: number;
  delayDays: number;
  impact: string;
}

export interface Level {
  id: string;
  taskId: string;
  name: string;
  description: string;
  phases: ConstructionPhase[];
  clues: Clue[];
  photos: InspectionPhoto[];
  availableActions: Action[];
  layout: SiteLayout;
  materialDelays: MaterialDelayEvent[];
  perfectScore: number;
  passingScore: number;
}
