import { ConfigTypes } from './ConfigTypes';

export module GameTypes {

    export type GamePhase =
        | 'MENU'
        | 'LEVEL_SELECT'
        | 'TASK_ACCEPT'
        | 'CLUE_OBSERVATION'
        | 'ACTION_SELECTION'
        | 'FEEDBACK'
        | 'QUESTION_SET'
        | 'SETTLEMENT'
        | 'NURSING_LOG'
        | 'BILLING_DETAIL';

    export interface TaskProgress {
        taskId: string;
        completed: boolean;
        selectedOptionId: string | null;
        scoreEarned: number;
        errorType?: ConfigTypes.ErrorType;
        triggeredInsuranceRejection: boolean;
        insuranceRisk: number;
        timeSpent: number;
        clueViewed: string[];
        startTime: number;
        endTime?: number;
    }

    export interface ObjectiveProgress {
        objectiveId: string;
        name: string;
        currentValue: number;
        targetValue: number;
        passed: boolean;
    }

    export interface BillingItem {
        id: string;
        name: string;
        insuranceCode: string;
        category: string;
        unitPrice: number;
        quantity: number;
        totalCost: number;
        insuranceRatio: number;
        insuranceCovered: number;
        outOfPocket: number;
        isDenied: boolean;
        denialReason?: string;
    }

    export interface SettlementDetail {
        levelId: string;
        totalCost: number;
        insuranceCoveredTotal: number;
        outOfPocketTotal: number;
        deniedItems: BillingItem[];
        deniedAmountTotal: number;
        drgGroup?: string;
        drgStandardCost?: number;
        costOverrun?: number;
        billingItems: BillingItem[];
    }

    export interface NursingLogEntry {
        timestamp: number;
        taskId: string;
        taskName: string;
        action: string;
        selectedOption: string;
        scoreChange: number;
        isCorrect: boolean;
        errorType?: ConfigTypes.ErrorType;
        insuranceRisk?: number;
        notes?: string;
    }

    export interface LevelSession {
        sessionId: string;
        levelId: string;
        prescriptionId: string;
        startTime: number;
        endTime?: number;
        totalTimeSpent: number;
        currentTaskIndex: number;
        taskOrder: string[];
        taskProgress: Record<string, TaskProgress>;
        totalScore: number;
        passScore: number;
        completed: boolean;
        passed: boolean;
        insuranceRejectionCount: number;
        insuranceTriggered: boolean;
        objectives: ObjectiveProgress[];
        settlement?: SettlementDetail;
        nursingLogs: NursingLogEntry[];
        difficulty: number;
    }

    export interface PlayerProfile {
        playerId: string;
        playerName: string;
        level: number;
        totalExp: number;
        coins: number;
        unlockedLevels: string[];
        ownedItems: string[];
        completedLevels: Record<string, LevelCompletionRecord>;
        totalTrainingCount: number;
        averageScore: number;
        bestScore: number;
        insuranceRejectionTotalCount: number;
        errorDistribution: Record<ConfigTypes.ErrorType, number>;
        tutorialProgress: Record<string, boolean>;
        lastLoginTime: number;
        createdAt: number;
    }

    export interface LevelCompletionRecord {
        levelId: string;
        bestScore: number;
        bestSessionId: string;
        attempts: number;
        firstCompletedAt: number;
        lastAttemptAt: number;
        stars: number;
    }

    export interface LeaderboardEntry {
        rank: number;
        playerId: string;
        playerName: string;
        levelId: string;
        score: number;
        timeSpent: number;
        accuracy: number;
        insuranceCompliance: number;
        compositeScore: number;
        updatedAt: number;
    }

    export interface ReplaySession {
        sessionId: string;
        levelId: string;
        levelName: string;
        totalScore: number;
        passScore: number;
        passed: boolean;
        timeSpent: number;
        taskCount: number;
        correctCount: number;
        errorCount: number;
        insuranceRejectionCount: number;
        nursingLogs: NursingLogEntry[];
        taskProgress: Record<string, TaskProgress>;
        settlement?: SettlementDetail;
        completedAt: number;
    }

    export interface TrainingSummary {
        totalSessions: number;
        totalCorrect: number;
        totalErrors: number;
        overallAccuracy: number;
        averageScore: number;
        errorBreakdown: Record<ConfigTypes.ErrorType, number>;
        insuranceRejectionTotal: number;
        byLevelBreakdown: Record<string, {
            attempts: number;
            bestScore: number;
            averageScore: number;
            passRate: number;
        }>;
        recommendedFocusAreas: string[];
    }
}
