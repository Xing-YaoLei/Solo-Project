export interface ActionLog {
  timestamp: number;
  actionType: string;
  payload: unknown;
}

export interface HesitationPoint {
  id: string;
  timestamp: number;
  duration: number;
  questionId: string;
  hint: string;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  speed: number;
}

export interface ReplayData {
  id: string;
  recordId: string;
  levelId?: string;
  actionLog: ActionLog[];
  hesitationThreshold: number;
  createdAt: string;
}
