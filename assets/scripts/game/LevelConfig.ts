export interface LevelConfig {
    id: string;
    name: string;
    description: string;
    difficulty: number;
    timeLimitSeconds: number;
    stationCount: number;
    customerIds: string[];
    passConditions: {
        minArrivalRate: number;
        maxConflictCount: number;
        maxOverbookCount: number;
    };
    capacityRuleId: string;
    scenarioId: string;
    hintEnabled: boolean;
    hintAdvanceSeconds: number;
}

export interface LevelsConfig {
    levels: LevelConfig[];
}

export interface ScenarioConfig {
    id: string;
    name: string;
    timeRange: { start: string; end: string };
    slotIntervalMinutes: number;
    events: ScenarioEvent[];
}

export interface ScenarioEvent {
    time: string;
    type: string;
    customerId?: string;
    customerIds?: string[];
    description: string;
    lateMinutes?: number;
}

export interface ScenariosConfig {
    scenarios: ScenarioConfig[];
}
