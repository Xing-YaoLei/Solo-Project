import { _decorator, Component, director, resources, JsonAsset } from "cc";
import { RoomManager } from "./RoomManager";
import { OrderManager } from "./OrderManager";
import { TaskManager } from "./TaskManager";
import { LevelConfig, GameSettings, ReviewStats, BottleneckRecord, ItemConfig, AchievementConfig } from "../models/Config";
import { RoomStatus } from "../models/Room";
import { OrderStatus } from "../models/Order";
import { TaskStatus } from "../models/Task";
import { Channel } from "../models/Channel";

const { ccclass, property } = _decorator;

export enum GameState {
    MENU = "menu",
    TUTORIAL = "tutorial",
    PLAYING = "playing",
    PAUSED = "paused",
    CONFLICT = "conflict",
    SETTLEMENT = "settlement",
    REVIEW = "review"
}

@ccclass("GameManager")
export class GameManager extends Component {
    private static _instance: GameManager | null = null;

    private roomManager: RoomManager | null = null;
    private orderManager: OrderManager | null = null;
    private taskManager: TaskManager | null = null;

    private currentState: GameState = GameState.MENU;
    private currentLevel: LevelConfig | null = null;
    private currentLevelIndex: number = 0;
    private levels: LevelConfig[] = [];
    private channels: Channel[] = [];
    private items: ItemConfig[] = [];
    private achievements: AchievementConfig[] = [];
    private itemCooldowns: Map<string, number> = new Map();

    private settings: GameSettings = {
        soundEnabled: true,
        vibrationEnabled: true,
        animationIntensity: 1.0,
        autoPauseEnabled: true,
        tutorialCompleted: false,
        language: "zh"
    };

    private gameStartTime: number = 0;
    private gameElapsedTime: number = 0;
    private totalRevenue: number = 0;
    private totalPenalty: number = 0;
    private bottlenecks: BottleneckRecord[] = [];
    private currentDayIndex: number = 0;
    private completedRoomNights: number = 0;

    private onStateChanged: ((state: GameState) => void) | null = null;
    private onDayChanged: ((day: number) => void) | null = null;

    public static get instance(): GameManager | null {
        return GameManager._instance;
    }

    onLoad(): void {
        if (GameManager._instance && GameManager._instance !== this) {
            this.destroy();
            return;
        }
        GameManager._instance = this;
        director.addPersistRootNode(this.node);

        this.roomManager = this.addComponent(RoomManager);
        this.orderManager = this.addComponent(OrderManager);
        this.taskManager = this.addComponent(TaskManager);

        this.loadSettings();
    }

    onDestroy(): void {
        if (GameManager._instance === this) {
            GameManager._instance = null;
        }
    }

    public async loadConfigs(): Promise<void> {
        try {
            const levelsRes = await this.loadJSON("configs/levels");
            this.levels = levelsRes as LevelConfig[];

            const channelsRes = await this.loadJSON("configs/channels");
            this.channels = channelsRes as Channel[];

            const itemsRes = await this.loadJSON("configs/items");
            this.items = itemsRes as ItemConfig[];

            const achievementsRes = await this.loadJSON("configs/achievements");
            this.achievements = achievementsRes as AchievementConfig[];
        } catch (e) {
            console.error("Failed to load configs:", e);
        }
    }

    private loadJSON(path: string): Promise<unknown> {
        return new Promise((resolve, reject) => {
            resources.load(path, JsonAsset, (err, asset) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(asset.json);
            });
        });
    }

    public startLevel(levelIndex: number): void {
        if (levelIndex < 0 || levelIndex >= this.levels.length) return;

        this.currentLevelIndex = levelIndex;
        this.currentLevel = this.levels[levelIndex];
        this.gameStartTime = Date.now();
        this.gameElapsedTime = 0;
        this.totalRevenue = 0;
        this.totalPenalty = 0;
        this.bottlenecks = [];
        this.currentDayIndex = 0;
        this.completedRoomNights = 0;
        this.itemCooldowns.clear();

        this.roomManager!.init(this.currentLevel);
        this.orderManager!.init(this.currentLevel, this.channels);
        this.taskManager!.init(this.currentLevel);

        this.setState(GameState.PLAYING);
    }

    update(dt: number): void {
        if (this.currentState !== GameState.PLAYING) return;

        this.gameElapsedTime += dt;
        this.orderManager!.update(dt * this.currentLevel!.timeScale);
        this.taskManager!.update(dt);

        this.updateItemCooldowns(dt);
        this.checkDayAdvance();
        this.checkLevelEnd();
    }

    private checkDayAdvance(): void {
        if (!this.currentLevel) return;
        const dayDuration = 60 / this.currentLevel.timeScale;
        const newDay = Math.floor(this.gameElapsedTime / dayDuration);
        if (newDay > this.currentDayIndex && newDay < this.currentLevel.dayCount) {
            this.currentDayIndex = newDay;
            if (this.onDayChanged) {
                this.onDayChanged(this.currentDayIndex);
            }
        }
    }

    private checkLevelEnd(): void {
        if (!this.currentLevel) return;
        const dayDuration = 60 / this.currentLevel.timeScale;
        const totalDuration = dayDuration * this.currentLevel.dayCount;

        if (this.gameElapsedTime >= totalDuration) {
            this.enterSettlement();
        }
    }

    public enterSettlement(): void {
        this.setState(GameState.SETTLEMENT);
    }

    public enterReview(): void {
        this.setState(GameState.REVIEW);
    }

    public setState(state: GameState): void {
        this.currentState = state;
        if (this.onStateChanged) {
            this.onStateChanged(state);
        }
    }

    public pauseGame(): void {
        if (this.currentState === GameState.PLAYING) {
            this.setState(GameState.PAUSED);
        }
    }

    public resumeGame(): void {
        if (this.currentState === GameState.PAUSED) {
            this.setState(GameState.PLAYING);
        }
    }

    public useItem(itemId: string): boolean {
        const item = this.items.find(i => i.id === itemId);
        if (!item) return false;

        const currentCd = this.itemCooldowns.get(itemId) || 0;
        if (currentCd > 0) return false;

        this.itemCooldowns.set(itemId, item.cooldown);
        return true;
    }

    private updateItemCooldowns(dt: number): void {
        for (const [id, cd] of this.itemCooldowns) {
            const newCd = cd - dt;
            if (newCd <= 0) {
                this.itemCooldowns.delete(id);
            } else {
                this.itemCooldowns.set(id, newCd);
            }
        }
    }

    public getItemCooldown(itemId: string): number {
        return this.itemCooldowns.get(itemId) || 0;
    }

    public addRevenue(amount: number): void {
        this.totalRevenue += amount;
    }

    public addPenalty(amount: number): void {
        this.totalPenalty += amount;
    }

    public addCompletedRoomNights(nights: number): void {
        this.completedRoomNights += Math.max(0, nights);
    }

    public getCompletedRoomNights(): number {
        return this.completedRoomNights;
    }

    public getCompletedOccupancyRate(): number {
        if (!this.currentLevel || !this.roomManager) return 0;
        const totalRooms = this.roomManager.getAllRooms().length;
        const totalNights = totalRooms * this.currentLevel.dayCount;
        return totalNights > 0 ? this.completedRoomNights / totalNights : 0;
    }

    public recordBottleneck(type: string, duration: number, description: string): void {
        this.bottlenecks.push({
            type,
            timestamp: Date.now() - this.gameStartTime,
            duration,
            description
        });
    }

    public generateReviewStats(): ReviewStats {
        const occupancyRate = this.getCompletedOccupancyRate();

        const allOrders = this.orderManager!.getAllOrders();
        const completedOrders = allOrders.filter(o =>
            o.status === OrderStatus.CHECKED_IN || o.status === OrderStatus.CHECKED_OUT
        );
        const failedTasks = this.taskManager!.getAllTasks().filter(t => t.status === TaskStatus.FAILED);
        const completedTasks = this.taskManager!.getAllTasks().filter(t => t.status === TaskStatus.COMPLETED);

        const conflictsResolved = this.bottlenecks.filter(b => b.type === "conflict_resolved").length;
        const conflictsTotal = this.bottlenecks.filter(b => b.type.startsWith("conflict")).length;

        let starRating = 0;
        if (this.currentLevel) {
            for (const s of this.currentLevel.stars) {
                if (occupancyRate >= s.threshold) {
                    starRating = s.stars;
                }
            }
        }

        return {
            occupancyRate,
            avgCheckInTime: 0,
            totalCompletedTasks: completedTasks.length,
            totalFailedTasks: failedTasks.length,
            totalPenalty: this.totalPenalty,
            totalRevenue: this.totalRevenue,
            conflictResolutionRate: conflictsTotal > 0 ? conflictsResolved / conflictsTotal : 1,
            completionTime: this.gameElapsedTime,
            playerBottlenecks: [...this.bottlenecks],
            starRating
        };
    }

    public getRoomManager(): RoomManager | null {
        return this.roomManager;
    }

    public getOrderManager(): OrderManager | null {
        return this.orderManager;
    }

    public getTaskManager(): TaskManager | null {
        return this.taskManager;
    }

    public getCurrentLevel(): LevelConfig | null {
        return this.currentLevel;
    }

    public getCurrentLevelIndex(): number {
        return this.currentLevelIndex;
    }

    public getCurrentState(): GameState {
        return this.currentState;
    }

    public getCurrentDayIndex(): number {
        return this.currentDayIndex;
    }

    public getSettings(): GameSettings {
        return this.settings;
    }

    public updateSettings(partial: Partial<GameSettings>): void {
        this.settings = { ...this.settings, ...partial };
        this.saveSettings();
    }

    public getLevels(): LevelConfig[] {
        return this.levels;
    }

    public getItems(): ItemConfig[] {
        return this.items;
    }

    public getChannels(): Channel[] {
        return this.channels;
    }

    public getAchievements(): AchievementConfig[] {
        return this.achievements;
    }

    public setOnStateChanged(cb: (state: GameState) => void): void {
        this.onStateChanged = cb;
    }

    public setOnDayChanged(cb: (day: number) => void): void {
        this.onDayChanged = cb;
    }

    private saveSettings(): void {
        try {
            localStorage.setItem("inn_manager_settings", JSON.stringify(this.settings));
        } catch (e) {
            console.warn("Failed to save settings:", e);
        }
    }

    private loadSettings(): void {
        try {
            const saved = localStorage.getItem("inn_manager_settings");
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.warn("Failed to load settings:", e);
        }
    }

    public reset(): void {
        this.roomManager?.reset();
        this.orderManager?.reset();
        this.taskManager?.reset();
        this.currentLevel = null;
        this.totalRevenue = 0;
        this.totalPenalty = 0;
        this.bottlenecks = [];
        this.gameElapsedTime = 0;
        this.itemCooldowns.clear();
    }
}
