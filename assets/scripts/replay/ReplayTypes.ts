export enum ReplayActionType {
    ASSIGN = "assign",
    REMOVE = "remove",
    ARRIVAL_CHECK = "arrival_check",
    CONFLICT_OCCURRED = "conflict_occurred",
    TIMEOUT = "timeout"
}

export interface ReplayAction {
    type: ReplayActionType;
    customerId: string;
    stationIndex?: number;
    time?: string;
    previousStatus?: string;
    newStatus?: string;
    isCorrect?: boolean;
    conflictMessage?: string;
    timestamp: number;
    gameTime: number;
}

export interface ReplaySession {
    levelId: string;
    startTime: number;
    actions: ReplayAction[];
    finalArrivalRate: number;
    passed: boolean;
}
