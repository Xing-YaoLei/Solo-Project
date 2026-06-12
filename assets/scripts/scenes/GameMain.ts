import { _decorator, Component, Node, director, resources, JsonAsset } from 'cc';
import { EventManager, GameEvents } from '../core/EventManager';
import { ConfigManager, ConfigKeys } from '../core/ConfigManager';
import { GameManager } from '../core/GameManager';
import { TimeManager } from '../core/TimeManager';
import { InventoryManager } from '../game/InventoryManager';
import { OrderManager } from '../game/OrderManager';
import { LevelManager } from '../game/LevelManager';
import { AchievementManager } from '../game/AchievementManager';
import { RandomEventManager } from '../game/RandomEventManager';
import { ItemManager } from '../game/ItemManager';
import { ConsumptionManager } from '../game/ConsumptionManager';
import { LevelConfig } from '../models/Level';
const { ccclass, property } = _decorator;

@ccclass('GameMain')
export class GameMain extends Component {
    @property(Node)
    public supplierPanel: Node | null = null;

    @property(Node)
    public inventoryPanel: Node | null = null;

    @property(Node)
    public usageRecordPanel: Node | null = null;

    @property(Node)
    public timerNode: Node | null = null;

    @property(Node)
    public storeMap: Node | null = null;

    @property(Node)
    public topBar: Node | null = null;

    @property(Node)
    public tutorialLayer: Node | null = null;

    @property(Node)
    public eventBanner: Node | null = null;

    private _isLoaded: boolean = false;
    private _currentLevelId: string = 'level_1';

    onLoad() {
        this.loadConfigs();
    }

    start() {
        director.addPersistRootNode(this.node);
    }

    update(dt: number) {
        if (!this._isLoaded) return;
        if (!GameManager.getInstance().isPlaying()) return;

        TimeManager.getInstance().update();
        OrderManager.getInstance().update();
        RandomEventManager.getInstance().update();
        ItemManager.getInstance().update();
        ConsumptionManager.getInstance().update();
    }

    private async loadConfigs(): Promise<void> {
        const configKeys = [
            ConfigKeys.INGREDIENTS,
            ConfigKeys.SUPPLIERS,
            ConfigKeys.STORES,
            ConfigKeys.LEVELS,
            ConfigKeys.ITEMS,
            ConfigKeys.ACHIEVEMENTS,
            ConfigKeys.RANDOM_EVENTS,
            ConfigKeys.TUTORIALS
        ];

        const configs: Record<string, any> = {};

        for (const key of configKeys) {
            try {
                const asset = await this.loadJsonAsset(`configs/${key}`);
                configs[key] = asset;
            } catch (e) {
                console.warn(`[GameMain] Failed to load config: ${key}`, e);
                configs[key] = [];
            }
        }

        ConfigManager.getInstance().loadAll(configs);
        this._isLoaded = true;

        this.initManagers();
        this.startLevel(this._currentLevelId);
    }

    private loadJsonAsset(path: string): Promise<any> {
        return new Promise((resolve, reject) => {
            resources.load(path, JsonAsset, (err, asset) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(asset?.json || []);
                }
            });
        });
    }

    private initManagers(): void {
        EventManager.getInstance().on(GameEvents.DAY_PASSED, this.onDayPassed.bind(this));
        EventManager.getInstance().on(GameEvents.GAME_END, this.onGameEnd.bind(this));
    }

    public startLevel(levelId: string): void {
        const level = ConfigManager.getInstance().findById<LevelConfig>(ConfigKeys.LEVELS, levelId);
        if (!level) {
            console.error(`[GameMain] Level ${levelId} not found`);
            return;
        }

        InventoryManager.getInstance().reset();
        OrderManager.getInstance().reset();
        RandomEventManager.getInstance().reset();
        ItemManager.getInstance().reset();
        ConsumptionManager.getInstance().reset();
        LevelManager.getInstance().reset();

        for (const storeId of level.stores) {
            InventoryManager.getInstance().initStoreInventory(storeId, level.initialInventory);
        }

        if (level.stores.length > 0) {
            ConsumptionManager.getInstance().init(
                level.stores[0],
                level.dailyConsumptionRate,
                level.consumptionFluctuation
            );
        }

        RandomEventManager.getInstance().init(level.randomEventChance);
        ItemManager.getInstance().init();
        LevelManager.getInstance().startLevel(levelId);
        GameManager.getInstance().startLevel(levelId);
    }

    private onDayPassed(day: number): void {
        console.log(`[GameMain] Day ${day} passed`);
    }

    private onGameEnd(result: any): void {
        console.log('[GameMain] Game ended:', result);
    }

    onDestroy() {
        EventManager.getInstance().clear();
    }
}
