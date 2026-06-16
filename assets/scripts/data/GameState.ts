import { GameMode } from './enums/GameMode';
import { TaskAction } from './enums/TaskAction';
import type { LevelConfig } from './LevelConfig';

export interface TaskResult {
    taskId: string;
    playerAction: TaskAction;
    correctAction: TaskAction;
    isCorrect: boolean;
    scoreEarned: number;
    timeSpent: number;
    wrongReason?: string;
    knowledgeExplanation?: string;
    knowledgePoint?: string;
}

export interface GameState {
    currentMode: GameMode;
    currentLevel: LevelConfig | null;
    currentTaskIndex: number;
    score: number;
    totalScore: number;
    timeRemaining: number;
    taskResults: TaskResult[];
    isPaused: boolean;
    taskStartTime: number;
    levelStartTime: number;
}

export function createInitialGameState(): GameState {
    return {
        currentMode: GameMode.FORMAL_TRAINING,
        currentLevel: null,
        currentTaskIndex: 0,
        score: 0,
        totalScore: 0,
        timeRemaining: 0,
        taskResults: [],
        isPaused: false,
        taskStartTime: 0,
        levelStartTime: 0
    };
}
