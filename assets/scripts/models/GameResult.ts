import { ActionType, ConflictType } from './GameEnums';

export interface MistakeRecord {
    reservationId: string;
    visitorName: string;
    expectedAction: ActionType;
    actualAction: ActionType;
    conflicts: ConflictType[];
    explanation: string;
    timePoint: number;
}

export interface GameResult {
    levelId: string;
    totalScore: number;
    maxScore: number;
    correctCount: number;
    totalTasks: number;
    mistakes: MistakeRecord[];
    usedTime: number;
    timeLimit: number;
    stars: number;
    passed: boolean;
    accuracy: number;
    comboMax: number;
}

export interface ScorePopup {
    id: string;
    score: number;
    message: string;
    position: { x: number; y: number };
    startTime: number;
    duration: number;
}
