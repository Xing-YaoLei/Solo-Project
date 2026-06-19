import { RoomStatus, RoomType } from "./Room";
import { OrderPriority } from "./Order";
import { ChannelType } from "./Channel";
import { TaskType } from "./Task";

export enum ConflictType {
    DOUBLE_BOOKING = "double_booking",
    OVERLAP_STAY = "overlap_stay",
    EARLY_CHECKIN = "early_checkin",
    LATE_CHECKOUT = "late_checkout",
    ROOM_UNAVAILABLE = "room_unavailable",
    MAINTENANCE_CLASH = "maintenance_clash"
}

export interface ConflictEvent {
    id: string;
    type: ConflictType;
    roomId: string;
    conflictingOrderIds: string[];
    description: string;
    options: ConflictOption[];
    timeLimit: number;
    appearedAt: number;
}

export interface ConflictOption {
    id: string;
    label: string;
    description: string;
    outcome: ConflictOutcome;
}

export interface ConflictOutcome {
    resolvedOrderIds: string[];
    affectedRoomIds: string[];
    penalty: number;
    reputationChange: number;
    roomStatusOverride: Partial<Record<string, RoomStatus>>;
}

export interface LevelConfig {
    id: string;
    name: string;
    description: string;
    roomCount: number;
    roomTypes: RoomType[];
    dayCount: number;
    orderFrequency: number;
    conflictProbability: number;
    channelTypes: ChannelType[];
    taskTypes: TaskType[];
    timeScale: number;
    targetOccupancy: number;
    targetSatisfaction: number;
    maxPenalty: number;
    stars: { threshold: number; stars: number }[];
}

export interface ItemConfig {
    id: string;
    name: string;
    description: string;
    icon: string;
    cooldown: number;
    duration: number;
    effectType: string;
    effectValue: number;
}

export interface AchievementConfig {
    id: string;
    name: string;
    description: string;
    icon: string;
    conditionType: string;
    conditionValue: number;
    reward: number;
    hidden: boolean;
}

export interface GameSettings {
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    animationIntensity: number;
    autoPauseEnabled: boolean;
    tutorialCompleted: boolean;
    language: string;
}

export interface ReviewStats {
    occupancyRate: number;
    avgCheckInTime: number;
    totalCompletedTasks: number;
    totalFailedTasks: number;
    totalPenalty: number;
    totalRevenue: number;
    conflictResolutionRate: number;
    completionTime: number;
    playerBottlenecks: BottleneckRecord[];
    starRating: number;
}

export interface BottleneckRecord {
    type: string;
    timestamp: number;
    duration: number;
    description: string;
}

export interface TutorialStep {
    id: string;
    targetElement: string;
    message: string;
    highlightArea: { x: number; y: number; width: number; height: number };
    actionRequired: string;
    nextStepId: string | null;
}
