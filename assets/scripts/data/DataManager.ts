import { getLevelConfig, getAllLevelConfigs, ILevelConfig } from '../../configs/LevelConfig';
import { getOrdersForLevel, SAMPLE_ORDERS, IRepairOrder } from '../../configs/OrderConfig';
import { ASSET_CATEGORIES, IAssetConfig, IAssetCategory } from '../../configs/AssetConfig';
import { IWorker } from '../game/DispatchTypes';
import { SaveManager } from '../core/SaveManager';
import { Logger } from '../core/Logger';

export class DataManager {
    private static instance: DataManager;
    private saveManager: SaveManager;
    private levelOrdersCache: Map<number, IRepairOrder[]> = new Map();
    private levelWorkersCache: Map<number, IWorker[]> = new Map();

    private constructor() {
        this.saveManager = SaveManager.getInstance();
    }

    public static getInstance(): DataManager {
        if (!DataManager.instance) {
            DataManager.instance = new DataManager();
        }
        return DataManager.instance;
    }

    public getLevelConfig(levelId: number): ILevelConfig | undefined {
        return getLevelConfig(levelId);
    }

    public getAllLevelConfigs(): ILevelConfig[] {
        return getAllLevelConfigs();
    }

    public getUnlockedLevelConfigs(): ILevelConfig[] {
        return this.getAllLevelConfigs().filter(l => 
            this.saveManager.isLevelUnlocked(l.id)
        );
    }

    public isLevelUnlocked(levelId: number): boolean {
        return this.saveManager.isLevelUnlocked(levelId);
    }

    public getOrdersForLevel(levelId: number): IRepairOrder[] {
        if (this.levelOrdersCache.has(levelId)) {
            return this.cloneOrders(this.levelOrdersCache.get(levelId)!);
        }
        const orders = getOrdersForLevel(levelId);
        this.levelOrdersCache.set(levelId, orders);
        return this.cloneOrders(orders);
    }

    private cloneOrders(orders: IRepairOrder[]): IRepairOrder[] {
        return orders.map(order => ({
            ...order,
            stages: [...order.stages],
            initialClues: [...order.initialClues],
            correctPath: [...order.correctPath],
            commonErrors: [...order.commonErrors],
            createdAt: Date.now(),
            deadline: Date.now() + order.timeLimit * 1000
        }));
    }

    public getWorkersForLevel(levelId: number): IWorker[] {
        if (this.levelWorkersCache.has(levelId)) {
            return JSON.parse(JSON.stringify(this.levelWorkersCache.get(levelId)!));
        }
        const config = this.getLevelConfig(levelId);
        if (config) {
            this.levelWorkersCache.set(levelId, config.workers);
            return JSON.parse(JSON.stringify(config.workers));
        }
        return [];
    }

    public getAssetCategories(): IAssetCategory[] {
        return JSON.parse(JSON.stringify(ASSET_CATEGORIES));
    }

    public getAssetsByCategory(categoryId: string): IAssetConfig[] {
        const category = ASSET_CATEGORIES.find(c => c.id === categoryId);
        return category ? JSON.parse(JSON.stringify(category.assets)) : [];
    }

    public getAssetById(assetId: string): IAssetConfig | undefined {
        for (const category of ASSET_CATEGORIES) {
            const asset = category.assets.find(a => a.id === assetId);
            if (asset) {
                return JSON.parse(JSON.stringify(asset));
            }
        }
        return undefined;
    }

    public getAssetsByType(type: IAssetConfig['type']): IAssetConfig[] {
        const assets: IAssetConfig[] = [];
        for (const category of ASSET_CATEGORIES) {
            assets.push(...category.assets.filter(a => a.type === type));
        }
        return JSON.parse(JSON.stringify(assets));
    }

    public getAllOrders(): IRepairOrder[] {
        return this.cloneOrders(SAMPLE_ORDERS);
    }

    public getMapResourceForLevel(levelId: number): string | undefined {
        const config = this.getLevelConfig(levelId);
        return config?.mapResource;
    }

    public getTargetScoreForLevel(levelId: number): number {
        const config = this.getLevelConfig(levelId);
        return config?.targetScore || 0;
    }

    public getTimeLimitForLevel(levelId: number): number {
        const config = this.getLevelConfig(levelId);
        return config?.timeLimit || 0;
    }

    public getUnlockRulesForLevel(levelId: number): string[] {
        const config = this.getLevelConfig(levelId);
        return config?.unlockRules || [];
    }

    public getTutorialStepsForLevel(levelId: number): string[] {
        const config = this.getLevelConfig(levelId);
        return config?.tutorialSteps || [];
    }

    public clearCache(): void {
        this.levelOrdersCache.clear();
        this.levelWorkersCache.clear();
        Logger.info('Data cache cleared');
    }

    public preloadLevelData(levelId: number): void {
        this.getOrdersForLevel(levelId);
        this.getWorkersForLevel(levelId);
        Logger.info(`Level ${levelId} data preloaded`);
    }
}
