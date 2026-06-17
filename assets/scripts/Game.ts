import { GameManager } from './core/GameManager';
import { EventManager, GameEventType } from './core/EventManager';
import { SaveManager } from './core/SaveManager';
import { Logger } from './core/Logger';
import { OrderManager } from './game/OrderManager';
import { DispatchRuleManager } from './game/DispatchRuleManager';
import { TiledMapManager } from './game/TiledMapManager';
import { LeaderboardManager, ReviewManager } from './game/LeaderboardManager';
import { TutorialManager } from './tutorial/TutorialManager';
import { DataManager } from './data/DataManager';

export class PropertyRepairGame {
    private static instance: PropertyRepairGame;
    private gameManager: GameManager;
    private eventManager: EventManager;
    private saveManager: SaveManager;
    private orderManager: OrderManager;
    private dispatchRuleManager: DispatchRuleManager;
    private mapManager: TiledMapManager;
    private leaderboardManager: LeaderboardManager;
    private reviewManager: ReviewManager;
    private tutorialManager: TutorialManager;
    private dataManager: DataManager;
    private isInitialized: boolean = false;

    private constructor() {
        this.gameManager = GameManager.getInstance();
        this.eventManager = EventManager.getInstance();
        this.saveManager = SaveManager.getInstance();
        this.orderManager = OrderManager.getInstance();
        this.dispatchRuleManager = DispatchRuleManager.getInstance();
        this.mapManager = TiledMapManager.getInstance();
        this.leaderboardManager = LeaderboardManager.getInstance();
        this.reviewManager = ReviewManager.getInstance();
        this.tutorialManager = TutorialManager.getInstance();
        this.dataManager = DataManager.getInstance();
    }

    public static getInstance(): PropertyRepairGame {
        if (!PropertyRepairGame.instance) {
            PropertyRepairGame.instance = new PropertyRepairGame();
        }
        return PropertyRepairGame.instance;
    }

    public async initialize(): Promise<boolean> {
        if (this.isInitialized) {
            Logger.warn('Game already initialized');
            return true;
        }

        try {
            Logger.info('Initializing Property Repair Simulator...');
            
            this.saveManager.loadFromStorage();
            
            this.setupEventListeners();
            
            this.isInitialized = true;
            Logger.info('Game initialized successfully');
            
            return true;
        } catch (error) {
            Logger.error('Failed to initialize game:', error);
            return false;
        }
    }

    private setupEventListeners(): void {
        this.eventManager.on(GameEventType.ORDER_COMPLETED, (event) => {
            Logger.info(`Order completed: ${event.data?.orderId}, score: ${event.data?.score}`);
            this.gameManager.addScore(event.data?.score || 0);
        });

        this.eventManager.on(GameEventType.ORDER_FAILED, (event) => {
            Logger.warn(`Order failed: ${event.data?.orderId}, deduction: ${event.data?.scoreDeduction}`);
            if (event.data?.scoreDeduction) {
                this.gameManager.deductScore(event.data.scoreDeduction, event.data.penalty?.errorType);
            }
        });

        this.eventManager.on(GameEventType.ORDER_TIMEOUT, (event) => {
            Logger.warn(`Order timeout: ${event.data?.orderId}`);
        });

        this.eventManager.on(GameEventType.RULE_UNLOCKED, (event) => {
            Logger.info(`Rule unlocked: ${event.data?.ruleId}`);
            this.dispatchRuleManager.unlockRule(event.data?.ruleId);
        });

        this.eventManager.on(GameEventType.TUTORIAL_COMPLETE, () => {
            Logger.info('Tutorial completed');
        });

        this.eventManager.on(GameEventType.LEVEL_COMPLETE, (event) => {
            const levelId = event.data?.levelId || 1;
            const profile = this.saveManager.getProfile();
            this.leaderboardManager.submitScore(profile);
            this.dispatchRuleManager.checkUnlocksForLevel(levelId + 1);
        });
    }

    public async startGame(levelId: number = 1): Promise<void> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        Logger.info(`Starting game at level ${levelId}`);

        const config = this.dataManager.getLevelConfig(levelId);
        if (!config) {
            Logger.error(`Level config not found: ${levelId}`);
            return;
        }

        const orders = this.dataManager.getOrdersForLevel(levelId);
        const workers = this.dataManager.getWorkersForLevel(levelId);
        const mapResource = this.dataManager.getMapResourceForLevel(levelId);

        this.orderManager.clearAllOrders();
        this.dispatchRuleManager.clearAll();
        this.dispatchRuleManager.resetWorkers();
        
        workers.forEach(w => this.dispatchRuleManager.addWorker(w));
        orders.forEach(o => this.orderManager.receiveOrder(o));

        if (mapResource) {
            await this.mapManager.loadMap(levelId.toString(), mapResource);
        }

        this.gameManager.startGame(levelId);

        if (this.tutorialManager.shouldShowTutorial()) {
            this.tutorialManager.startTutorial('tutorial_dispatch_basics');
        } else {
            const tutorials = this.tutorialManager.getUncompletedTutorials(levelId);
            if (tutorials.length > 0) {
                this.tutorialManager.startTutorial(tutorials[0].id);
            }
        }
    }

    public pauseGame(): void {
        this.gameManager.pauseGame();
        this.tutorialManager.pauseTutorial();
    }

    public resumeGame(): void {
        this.gameManager.resumeGame();
        this.tutorialManager.resumeTutorial();
    }

    public completeLevel(): void {
        this.gameManager.completeLevel(this.gameManager.getCurrentScore());
    }

    public failLevel(reason: string): void {
        this.gameManager.failLevel(reason);
    }

    public returnToMenu(): void {
        this.gameManager.returnToMenu();
        this.orderManager.clearAllOrders();
        this.mapManager.clearAll();
        this.tutorialManager.closeTutorial();
    }

    public getGameManager(): GameManager {
        return this.gameManager;
    }

    public getEventManager(): EventManager {
        return this.eventManager;
    }

    public getSaveManager(): SaveManager {
        return this.saveManager;
    }

    public getOrderManager(): OrderManager {
        return this.orderManager;
    }

    public getDispatchRuleManager(): DispatchRuleManager {
        return this.dispatchRuleManager;
    }

    public getMapManager(): TiledMapManager {
        return this.mapManager;
    }

    public getLeaderboardManager(): LeaderboardManager {
        return this.leaderboardManager;
    }

    public getReviewManager(): ReviewManager {
        return this.reviewManager;
    }

    public getTutorialManager(): TutorialManager {
        return this.tutorialManager;
    }

    public getDataManager(): DataManager {
        return this.dataManager;
    }

    public update(dt: number): void {
        if (!this.gameManager.isGamePlaying()) return;

        this.orderManager.checkTimeoutOrders();
    }

    public destroy(): void {
        this.eventManager.removeAllListeners();
        this.orderManager.clearAllOrders();
        this.mapManager.clearAll();
        this.dispatchRuleManager.clearAll();
        this.isInitialized = false;
    }
}

export const game = PropertyRepairGame.getInstance();
