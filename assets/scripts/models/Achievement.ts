export enum AchievementType {
    COMPLETE_LEVEL = 'complete_level',
    PERFECT_INVENTORY = 'perfect_inventory',
    COST_SAVER = 'cost_saver',
    NO_SHORTAGE = 'no_shortage',
    HIGH_TURNOVER = 'high_turnover',
    SPEED_DELIVERY = 'speed_delivery',
    COLLECTOR = 'collector',
    VETERAN = 'veteran'
}

export interface AchievementCondition {
    type: AchievementType;
    params: Record<string, number | string>;
}

export interface AchievementConfig {
    id: string;
    name: string;
    description: string;
    icon: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    conditions: AchievementCondition[];
    rewards: Record<string, number>;
}

export interface PlayerAchievement {
    achievementId: string;
    unlockedTime: number;
    progress: number;
    isUnlocked: boolean;
}
