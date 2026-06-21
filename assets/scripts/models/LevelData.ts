import { GameMode, PostType, DifficultyLevel, ActionType } from './GameEnums';

export interface LevelTask {
    visitorId: string;
    visitorName: string;
    idCard: string;
    phone: string;
    ticketCount: number;
    hasBlacklist: boolean;
    scenicSpotId: string;
    timeSlotIndex: number;
    arrivalTime: number | null;
    arrivalStatus: string;
    isTask: boolean;
    correctAction: ActionType;
    correctRescheduleSlotIndex: number | null;
    conflictTypes: string[];
    rescheduleCount: number;
    notes: string;
}

export interface LevelData {
    id: string;
    name: string;
    description: string;
    mode: GameMode;
    postType: PostType;
    difficulty: DifficultyLevel;
    timeLimit: number;
    targetScore: number;
    maxMistakes: number;
    scenicSpots: {
        id: string;
        name: string;
        description: string;
        icon: string;
        mapPosX: number;
        mapPosY: number;
        dailyCapacity: number;
        color: string;
        timeSlots: { startTime: number; endTime: number; capacity: number }[];
    }[];
    tasks: LevelTask[];
    tutorialSteps?: TutorialStep[];
    hasTutorial: boolean;
}

export interface TutorialStep {
    id: string;
    title: string;
    content: string;
    highlightNode: string;
    position: 'top' | 'bottom' | 'left' | 'right';
    autoNext: boolean;
    waitForAction?: ActionType;
}

export interface LevelProgress {
    levelId: string;
    unlocked: boolean;
    bestScore: number;
    bestTime: number;
    stars: number;
    completed: boolean;
}
