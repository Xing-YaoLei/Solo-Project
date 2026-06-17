import { RepairCategory, OrderPriority, IRepairOrder } from './OrderTypes';

export interface IWorker {
    id: string;
    name: string;
    avatar?: string;
    skills: RepairCategory[];
    skillLevel: Map<RepairCategory, number>;
    currentLoad: number;
    maxLoad: number;
    efficiency: number;
    isAvailable: boolean;
    currentOrderId?: string;
    location?: { x: number; y: number };
}

export interface IDispatchRule {
    id: string;
    name: string;
    description: string;
    isActive: boolean;
    isUnlocked: boolean;
    unlockLevel: number;
    priority: number;
    checkRule: (order: IRepairOrder, worker: IWorker, context: IDispatchContext) => IDispatchRuleResult;
}

export interface IDispatchContext {
    availableWorkers: IWorker[];
    activeOrders: IRepairOrder[];
    currentTime: number;
    activeRuleIds: string[];
}

export interface IDispatchRuleResult {
    isValid: boolean;
    score: number;
    reason?: string;
    penalty?: number;
}

export interface IDispatchRecommendation {
    workerId: string;
    workerName: string;
    matchScore: number;
    ruleViolations: string[];
    isRecommended: boolean;
    estimatedTime: number;
}

export interface ITimeLimitConfig {
    baseTime: number;
    priorityMultiplier: Map<OrderPriority, number>;
    categoryMultiplier: Map<RepairCategory, number>;
    difficultyMultiplier: number;
}

export interface ITimePenalty {
    threshold: number;
    penalty: number;
    errorType: string;
    description: string;
}

export const DEFAULT_TIME_LIMIT_CONFIG: ITimeLimitConfig = {
    baseTime: 1800,
    priorityMultiplier: new Map([
        ['urgent', 0.5],
        ['high', 0.75],
        ['medium', 1.0],
        ['low', 1.5]
    ]),
    categoryMultiplier: new Map([
        ['electrical', 0.8],
        ['plumbing', 1.0],
        ['structure', 1.5],
        ['equipment', 1.2],
        ['other', 1.0]
    ]),
    difficultyMultiplier: 1.0
};

export const TIME_PENALTIES: ITimePenalty[] = [
    {
        threshold: 0.9,
        penalty: 10,
        errorType: 'TIME_WARNING',
        description: '工单即将超时，需加快处理'
    },
    {
        threshold: 1.0,
        penalty: 50,
        errorType: 'TIME_EXPIRED',
        description: '工单处理超时'
    }
];

export function createWorker(
    id: string,
    name: string,
    skills: RepairCategory[],
    skillLevels: number[] = [],
    maxLoad: number = 3
): IWorker {
    const skillLevelMap = new Map<RepairCategory, number>();
    skills.forEach((skill, index) => {
        skillLevelMap.set(skill, skillLevels[index] || 1);
    });

    return {
        id,
        name,
        skills,
        skillLevel: skillLevelMap,
        currentLoad: 0,
        maxLoad,
        efficiency: 1.0,
        isAvailable: true
    };
}

export function calculateOrderTimeLimit(
    order: IRepairOrder,
    config: ITimeLimitConfig = DEFAULT_TIME_LIMIT_CONFIG
): number {
    const priorityMultiplier = config.priorityMultiplier.get(order.priority) || 1.0;
    const categoryMultiplier = config.categoryMultiplier.get(order.category) || 1.0;
    return Math.floor(
        config.baseTime * priorityMultiplier * categoryMultiplier * config.difficultyMultiplier
    );
}

export function checkTimePenalty(
    order: IRepairOrder,
    elapsedTime: number
): ITimePenalty | null {
    const timeRatio = elapsedTime / order.timeLimit;
    for (let i = TIME_PENALTIES.length - 1; i >= 0; i--) {
        if (timeRatio >= TIME_PENALTIES[i].threshold) {
            return TIME_PENALTIES[i];
        }
    }
    return null;
}
