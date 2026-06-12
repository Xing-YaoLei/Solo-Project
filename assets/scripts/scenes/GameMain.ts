import { _decorator, Component, Node, director, find } from 'cc';
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
import { loadAllConfigs } from '../config/GameConfigs';
import { SupplierPanel } from './SupplierPanel';
import { StoreNode } from './StoreNode';
import { InventoryPanel } from './InventoryPanel';
import { UsageRecordPanel } from './UsageRecordPanel';
import { GameTimer } from './GameTimer';
import { EventBanner } from './EventBanner';
import { TutorialSystem } from './TutorialSystem';
import { ResultScreen } from './ResultScreen';
import { InventoryCheckDialog } from './InventoryCheckDialog';
import { ItemBar } from './ItemBar';
import { TopBar } from '../ui/TopBar';
import { ConfigManager as CM } from '../core/ConfigManager';
import { Store } from '../models/Store';
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

    @property(Node)
    public resultScreen: Node | null = null;

    @property(Node)
    public inventoryCheckDialog: Node | null = null;

    @property(Node)
    public itemBar: Node | null = null;

    @property(Node)
    public orderDialog: Node | null = null;

    public startLevelId: string = 'level_1';

    @property([Node])
    public storeNodes: Node[] = [];

    private _isLoaded: boolean = false;
    private _isManualInit: boolean = false;
    private _currentLevelId: string = 'level_1';
    private _storeNodeComps: Map<string, StoreNode> = new Map();

    onLoad() {
        if (this._isManualInit) return;
    }

    start() {
        if (this._isManualInit) return;
        director.addPersistRootNode(this.node);
    }

    public manualInit(): void {
        if (this._isManualInit) return;
        this._isManualInit = true;

        director.addPersistRootNode(this.node);
        this.autoBindNodes();
        this.loadConfigs();
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

    private loadConfigs(): void {
        try {
            loadAllConfigs();
            const cm = ConfigManager.getInstance();
            if (!cm.isLoaded()) {
                console.error('[GameMain] Configs failed to load');
                return;
            }
            const levelCount = cm.getListConfig(ConfigKeys.LEVELS).length;
            console.log(`[GameMain] Configs loaded: ${levelCount} levels, ${cm.getListConfig(ConfigKeys.INGREDIENTS).length} ingredients`);
        } catch (e) {
            console.error('[GameMain] Error loading configs:', e);
            return;
        }

        this._isLoaded = true;
        if (this.startLevelId) {
            this._currentLevelId = this.startLevelId;
        }
        this.initManagers();
        this.bindStoreNodesToSupplierPanel();
        this.startLevel(this._currentLevelId);
    }

    private autoBindNodes(): void {
        if (!this.supplierPanel) this.supplierPanel = find('Canvas/SupplierPanel');
        if (!this.inventoryPanel) this.inventoryPanel = find('Canvas/InventoryPanel');
        if (!this.usageRecordPanel) this.usageRecordPanel = find('Canvas/UsageRecordPanel');
        if (!this.timerNode) this.timerNode = find('Canvas/TopBar/Timer');
        if (!this.storeMap) this.storeMap = find('Canvas/StoreMap');
        if (!this.topBar) this.topBar = find('Canvas/TopBar');
        if (!this.tutorialLayer) this.tutorialLayer = find('Canvas/TutorialLayer');
        if (!this.eventBanner) this.eventBanner = find('Canvas/EventBanner');
        if (!this.resultScreen) this.resultScreen = find('Canvas/ResultScreen');
        if (!this.inventoryCheckDialog) this.inventoryCheckDialog = find('Canvas/InventoryCheckDialog');
        if (!this.itemBar) this.itemBar = find('Canvas/ItemBar');
        if (!this.orderDialog) this.orderDialog = find('Canvas/OrderDialog');

        if (this.storeMap && this.storeNodes.length === 0) {
            this.storeMap.children.forEach((child: Node) => {
                if (child.getComponent(StoreNode)) {
                    this.storeNodes.push(child);
                }
            });
        }
    }

    private bindStoreNodesToSupplierPanel(): void {
        const supplierPanelComp = this.supplierPanel?.getComponent(SupplierPanel);
        if (!supplierPanelComp) return;

        const stores = ConfigManager.getInstance().getListConfig<Store>(ConfigKeys.STORES);
        stores.forEach((store, index) => {
            let storeNode = this.storeNodes[index];
            if (!storeNode && this.storeMap) {
                storeNode = this.storeMap.getChildByName(`store_${store.id}`);
            }
            if (storeNode) {
                let comp = storeNode.getComponent(StoreNode);
                if (!comp) {
                    comp = storeNode.addComponent(StoreNode);
                }
                comp.setStoreData(store);
                this._storeNodeComps.set(store.id, comp);
                supplierPanelComp.registerDropTarget(store.id, storeNode);
            }
        });
    }

    private initManagers(): void {
        EventManager.getInstance().on(GameEvents.DAY_PASSED, this.onDayPassed.bind(this));
        EventManager.getInstance().on(GameEvents.GAME_END, this.onGameEnd.bind(this));
        EventManager.getInstance().on('start_level', (levelId: string) => this.startLevel(levelId));
        EventManager.getInstance().on('retry_level', (levelId: string) => this.startLevel(levelId));

        const invPanelComp = this.inventoryPanel?.getComponent(InventoryPanel);
        if (invPanelComp) invPanelComp.setStore('store_main');

        const usagePanelComp = this.usageRecordPanel?.getComponent(UsageRecordPanel);
        if (usagePanelComp) usagePanelComp.setStore('store_main');
    }

    public startLevel(levelId: string): void {
        const level = ConfigManager.getInstance().findById<LevelConfig>(ConfigKeys.LEVELS, levelId);
        if (!level) {
            console.error(`[GameMain] Level ${levelId} not found. Available levels:`,
                ConfigManager.getInstance().getListConfig(ConfigKeys.LEVELS).map((l: any) => l.id));
            return;
        }

        console.log(`[GameMain] Starting level: ${level.name} (${levelId})`);

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

        this._currentLevelId = levelId;

        const resultScreenComp = this.resultScreen?.getComponent(ResultScreen);
        if (resultScreenComp) resultScreenComp.hide();

        EventManager.getInstance().emit(GameEvents.SHOW_TOAST, {
            message: `关卡开始: ${level.name}`,
            type: 'info'
        });
    }

    private onDayPassed(day: number): void {
        console.log(`[GameMain] Day ${day} / ${TimeManager.getInstance().getTotalDays()}`);

        if (TimeManager.getInstance().isGameOver()) {
            this.finishLevel();
        }
    }

    private finishLevel(): void {
        const stats = GameManager.getInstance().getStats();
        const result = LevelManager.getInstance().evaluateLevel(stats);
        const levelResult = GameManager.getInstance().endLevel(
            result.isPassed,
            result.objectiveScores,
            result.totalScore
        );

        const newlyUnlocked = AchievementManager.getInstance().checkAllAchievements({
            ...stats,
            fastestLevelCompletionTime: levelResult.completionTimeSeconds
        });
        levelResult.unlockedAchievements = newlyUnlocked;

        LevelManager.getInstance().completeLevel(levelResult);

        const resultScreenComp = this.resultScreen?.getComponent(ResultScreen);
        if (resultScreenComp) {
            this.scheduleOnce(() => {
                resultScreenComp.node.emit('setup_result', levelResult);
            }, 0.5);
        }
    }

    private onGameEnd(result: any): void {
        console.log('[GameMain] Game ended:', result);
    }

    public getStoreNodeComp(storeId: string): StoreNode | null {
        return this._storeNodeComps.get(storeId) || null;
    }

    public getCurrentLevelId(): string {
        return this._currentLevelId;
    }

    onDestroy() {
        EventManager.getInstance().clear();
    }
}
