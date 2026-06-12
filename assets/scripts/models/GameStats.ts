export interface GameStats {
    totalOrders: number;
    totalSpent: number;
    perfectInventoryCount: number;
    inventoryDifferenceCount: number;
    shortageCount: number;
    averageTurnoverDays: number;
    fastestLevelCompletionTime: number;
    levelsCompleted: number;
    eventsResolved: number;
}

export interface PlayerCardPoint {
    time: number;
    description: string;
    type: 'decision' | 'mistake' | 'success' | 'event';
    relatedData?: Record<string, any>;
}

export interface LevelResult {
    levelId: string;
    isPassed: boolean;
    totalScore: number;
    objectiveScores: Record<string, number>;
    startTime: number;
    endTime: number;
    completionTimeSeconds: number;
    averageTurnoverDays: number;
    totalCost: number;
    inventoryAccuracy: number;
    shortageCount: number;
    cardPoints: PlayerCardPoint[];
    unlockedAchievements: string[];
}
