export interface LevelObjective {
    id: string;
    type: 'stock_accuracy' | 'cost_control' | 'timely_restock' | 'no_shortage' | 'turnover_rate';
    targetValue: number;
    description: string;
    weight: number;
}

export interface LevelConfig {
    id: string;
    name: string;
    difficulty: number;
    description: string;
    durationDays: number;
    stores: string[];
    initialCapital: number;
    initialInventory: Record<string, number>;
    dailyConsumptionRate: Record<string, number>;
    consumptionFluctuation: number;
    randomEventChance: number;
    objectives: LevelObjective[];
    unlockConditions: string[];
}
