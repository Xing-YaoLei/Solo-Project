export type OrderType = 'repair' | 'maintenance' | 'complaint' | 'emergency' | 'consultation';
export type OrderPriority = 'low' | 'medium' | 'high' | 'urgent';
export type OrderStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed' | 'timeout';
export type RepairCategory = 'electrical' | 'plumbing' | 'structure' | 'equipment' | 'other';
export type LocationType = 'residential' | 'commercial' | 'public' | 'parking' | 'outdoor';

export interface IOrderLocation {
    building: string;
    floor: string;
    room: string;
    description: string;
    coordinates?: { x: number; y: number };
}

export interface IOrderReward {
    score: number;
    experience?: number;
    unlockRule?: string;
}

export interface IOrderPenalty {
    scoreDeduction: number;
    errorType: string;
    description: string;
    requiresReview: boolean;
}

export interface IChoiceResult {
    isCorrect: boolean;
    nextState: string;
    reward?: IOrderReward;
    penalty?: IOrderPenalty;
    feedback: string;
    unlockedClues?: string[];
    endOrder?: boolean;
    changeAssignedWorker?: string;
}

export interface IChoice {
    id: string;
    text: string;
    requiredClues?: string[];
    condition?: (context: IOrderContext) => boolean;
    result: IChoiceResult;
}

export interface IClue {
    id: string;
    title: string;
    description: string;
    category: string;
    isHidden: boolean;
    discoveredAt?: number;
    importance: number;
}

export interface IOrderStage {
    id: string;
    name: string;
    description: string;
    choices: IChoice[];
    autoDiscoverClues?: string[];
}

export interface IOrderContext {
    order: IRepairOrder;
    discoveredClues: string[];
    currentStage: string;
    assignedWorkerId?: string;
    decisionHistory: Array<{ stageId: string; choiceId: string; timestamp: number }>;
    elapsedTime: number;
}

export interface IRepairOrder {
    id: string;
    type: OrderType;
    priority: OrderPriority;
    category: RepairCategory;
    title: string;
    description: string;
    location: IOrderLocation;
    reporter: string;
    reporterPhone?: string;
    timeLimit: number;
    baseReward: number;
    stages: IOrderStage[];
    initialClues: IClue[];
    correctPath: string[];
    commonErrors: IOrderPenalty[];
    createdAt: number;
    deadline: number;
    icon?: string;
    tags?: string[];
}

export interface IActiveOrder extends IRepairOrder {
    status: OrderStatus;
    assignedWorkerId?: string;
    discoveredClueIds: string[];
    currentStageId: string;
    decisionHistory: Array<{ stageId: string; choiceId: string; timestamp: number }>;
    acceptedAt: number;
    completedAt?: number;
    failedAt?: number;
    isFirstAttempt: boolean;
}

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

export interface IScoreRecord {
    orderId: string;
    score: number;
    isFirstTime: boolean;
    errorType?: string;
    errorDescription?: string;
    reviewPassed: boolean;
    timestamp: number;
    completionTime: number;
}

export interface ILevelRecord {
    levelId: number;
    levelName: string;
    totalScore: number;
    maxScore: number;
    completionRate: number;
    firstSolveRate: number;
    averageTime: number;
    playCount: number;
    bestTime: number;
    records: IScoreRecord[];
}

export interface IPlayerProfile {
    playerId: string;
    playerName: string;
    totalScore: number;
    totalLevelsCompleted: number;
    firstSolveRate: number;
    playTime: number;
    unlockedLevels: number[];
    unlockedRules: string[];
    tutorialCompleted: boolean;
    lastPlayTime: number;
}

export interface IGameSettings {
    soundEnabled: boolean;
    musicEnabled: boolean;
    difficulty: 'easy' | 'normal' | 'hard';
    language: string;
    autoSave: boolean;
}

export interface ILeaderboardEntry {
    rank: number;
    playerId: string;
    playerName: string;
    totalScore: number;
    firstSolveRate: number;
    levelsCompleted: number;
    averageTime: number;
    lastUpdate: number;
}

export interface ILevelConfig {
    id: number;
    name: string;
    description: string;
    difficulty: 'easy' | 'normal' | 'hard';
    orderCount: number;
    timeLimit: number;
    targetScore: number;
    unlockRules: string[];
    workers: IWorker[];
    orders: IRepairOrder[];
    mapResource?: string;
    backgroundResource?: string;
    tutorialSteps?: string[];
    isUnlockable: boolean;
    requiredLevel?: number;
}

export function getOrderByPriority(priority: OrderPriority): number {
    const priorityMap: Record<OrderPriority, number> = {
        urgent: 4,
        high: 3,
        medium: 2,
        low: 1
    };
    return priorityMap[priority];
}

export function getPriorityColor(priority: OrderPriority): string {
    const colorMap: Record<OrderPriority, string> = {
        urgent: '#FF3B30',
        high: '#FF9500',
        medium: '#FFCC00',
        low: '#34C759'
    };
    return colorMap[priority];
}

export function getStatusText(status: OrderStatus): string {
    const statusMap: Record<OrderStatus, string> = {
        pending: '待受理',
        assigned: '已派单',
        in_progress: '处理中',
        completed: '已完成',
        failed: '处理失败',
        timeout: '已超时'
    };
    return statusMap[status];
}

export function getCategoryText(category: RepairCategory): string {
    const categoryMap: Record<RepairCategory, string> = {
        electrical: '电力维修',
        plumbing: '水暖维修',
        structure: '土建维修',
        equipment: '设备维修',
        other: '其他维修'
    };
    return categoryMap[category];
}

export function createActiveOrder(order: IRepairOrder): IActiveOrder {
    return {
        ...order,
        status: 'pending',
        discoveredClueIds: order.initialClues.filter(c => !c.isHidden).map(c => c.id),
        currentStageId: order.stages[0]?.id || '',
        decisionHistory: [],
        acceptedAt: Date.now(),
        isFirstAttempt: true
    };
}

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
