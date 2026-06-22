import { GameConstants } from './GameConstants';

export interface IClientProfile {
    id: string;
    name: string;
    avatar: string;
    description: string;
    occupation: string;
    age: number;
    background: string;
    personality: string[];
    trustLevel: number;
    unlocked: boolean;
    caseIds: string[];
}

export interface IClue {
    id: string;
    name: string;
    type: GameConstants.ClueType;
    description: string;
    icon: string;
    isKey: boolean;
    credibility: number;
    relatedPersonIds: string[];
    discovered: boolean;
    missingPage: boolean;
    missingPageReason?: string;
}

export interface ICaseAction {
    id: string;
    name: string;
    type: GameConstants.ActionType;
    description: string;
    icon: string;
    requiredClueIds: string[];
    requiredStage: GameConstants.CaseStage;
    isCorrect: boolean;
    consequence: string;
    scoreImpact: number;
    errorCategory?: GameConstants.ErrorCategory;
    errorReason?: string;
    nextStage?: GameConstants.CaseStage;
    unlockClueIds?: string[];
}

export interface ICaseStageConfig {
    stage: GameConstants.CaseStage;
    name: string;
    description: string;
    clueIds: string[];
    actionIds: string[];
    scheduleDays: number;
    deadlineDays: number;
}

export interface ICase {
    id: string;
    title: string;
    type: string;
    description: string;
    difficulty: GameConstants.Difficulty;
    clientId: string;
    opponentId: string;
    baseScore: number;
    stages: ICaseStageConfig[];
    clues: IClue[];
    actions: ICaseAction[];
    backgroundStory: string;
    legalBasis: string[];
    requiredUnlockedCaseIds: string[];
    unlockScore: number;
}

export interface ILevelConfig {
    id: string;
    name: string;
    description: string;
    caseIds: string[];
    requiredScore: number;
    reward: string;
    tutorialId?: string;
}

export interface ITutorialStep {
    id: string;
    title: string;
    content: string;
    highlightNode?: string;
    nextStepId?: string;
    prevStepId?: string;
}

export interface ITutorial {
    id: string;
    name: string;
    steps: ITutorialStep[];
    triggerCondition: string;
}

export interface IAssetConfig {
    id: string;
    path: string;
    type: 'sprite' | 'audio' | 'prefab' | 'tiled' | 'font';
    bundle?: string;
}

export interface ITrialScheduleItem {
    day: number;
    stage: GameConstants.CaseStage;
    event: string;
    durationHours: number;
    courtRoom?: string;
    judgeId?: string;
}

export interface ILeaderboardEntry {
    playerId: string;
    playerName: string;
    totalScore: number;
    casesCompleted: number;
    perfectCases: number;
    rank: number;
    updateTime: number;
}

export interface IMaterialMissRecord {
    caseId: string;
    stage: GameConstants.CaseStage;
    clueId: string;
    triggerAction: string;
    reason: string;
    timestamp: number;
}

export interface IErrorRecord {
    caseId: string;
    stage: GameConstants.CaseStage;
    actionId: string;
    errorCategory: GameConstants.ErrorCategory;
    errorReason: string;
    timestamp: number;
}

export interface ITrainingRecord {
    id: string;
    caseId: string;
    startTime: number;
    endTime: number;
    score: number;
    maxScore: number;
    passed: boolean;
    perfect: boolean;
    currentStage: GameConstants.CaseStage;
    discoveredClueIds: string[];
    takenActionIds: string[];
    errorRecords: IErrorRecord[];
    materialMissRecords: IMaterialMissRecord[];
    totalPlayTime: number;
}

export interface IGameSave {
    saveVersion: string;
    playerName: string;
    totalScore: number;
    completedCaseIds: string[];
    unlockedLevelIds: string[];
    unlockedClientIds: string[];
    currentCaseId: string | null;
    currentLevelId: string | null;
    trainingRecords: ITrainingRecord[];
    settings: {
        soundEnabled: boolean;
        musicEnabled: boolean;
        language: string;
    };
    tutorialProgress: Record<string, boolean>;
    lastSaveTime: number;
}
