import { EventManager, GameEvents } from './EventManager';
import { TimeManager } from './TimeManager';
import { ConfigManager, ConfigKeys } from './ConfigManager';
import { GameStats, LevelResult, PlayerCardPoint } from '../models/GameStats';

export class GameManager {
    private static _instance: GameManager | null = null;

    private _isPlaying: boolean = false;
    private _currentLevelId: string | null = null;
    private _capital: number = 0;
    private _startTime: number = 0;
    private _stats: GameStats = this.createEmptyStats();
    private _cardPoints: PlayerCardPoint[] = [];

    public static getInstance(): GameManager {
        if (!this._instance) {
            this._instance = new GameManager();
        }
        return this._instance;
    }

    private createEmptyStats(): GameStats {
        return {
            totalOrders: 0,
            totalSpent: 0,
            perfectInventoryCount: 0,
            inventoryDifferenceCount: 0,
            shortageCount: 0,
            averageTurnoverDays: 0,
            fastestLevelCompletionTime: 0,
            levelsCompleted: 0,
            eventsResolved: 0
        };
    }

    public startLevel(levelId: string): void {
        const levelConfig = ConfigManager.getInstance().findById(ConfigKeys.LEVELS, levelId);
        if (!levelConfig) {
            console.error(`[GameManager] Level ${levelId} not found`);
            return;
        }

        this._currentLevelId = levelId;
        this._capital = levelConfig.initialCapital || 10000;
        this._startTime = Date.now();
        this._stats = this.createEmptyStats();
        this._cardPoints = [];
        this._isPlaying = true;

        TimeManager.getInstance().init(
            levelConfig.durationDays || 30,
            1
        );

        EventManager.getInstance().emit(GameEvents.GAME_START, {
            levelId,
            capital: this._capital
        });
    }

    public endLevel(isPassed: boolean, objectiveScores: Record<string, number>, totalScore: number): LevelResult {
        this._isPlaying = false;
        const endTime = Date.now();

        const result: LevelResult = {
            levelId: this._currentLevelId!,
            isPassed,
            totalScore,
            objectiveScores,
            startTime: this._startTime,
            endTime,
            completionTimeSeconds: Math.floor((endTime - this._startTime) / 1000),
            averageTurnoverDays: this._stats.averageTurnoverDays,
            totalCost: this._stats.totalSpent,
            inventoryAccuracy: this._stats.inventoryDifferenceCount > 0
                ? Math.max(0, 100 - (this._stats.inventoryDifferenceCount / (this._stats.inventoryDifferenceCount + this._stats.perfectInventoryCount)) * 100)
                : 100,
            shortageCount: this._stats.shortageCount,
            cardPoints: [...this._cardPoints],
            unlockedAchievements: []
        };

        if (isPassed) {
            this._stats.levelsCompleted++;
        }

        EventManager.getInstance().emit(GameEvents.GAME_END, result);

        return result;
    }

    public addCardPoint(point: Omit<PlayerCardPoint, 'time'>): void {
        this._cardPoints.push({
            ...point,
            time: Date.now()
        });
    }

    public getStats(): GameStats {
        return { ...this._stats };
    }

    public incrementStat(key: keyof GameStats, value: number = 1): void {
        if (typeof this._stats[key] === 'number') {
            (this._stats as any)[key] += value;
        }
    }

    public setStat(key: keyof GameStats, value: number): void {
        if (typeof this._stats[key] === 'number') {
            (this._stats as any)[key] = value;
        }
    }

    public getCapital(): number {
        return this._capital;
    }

    public addCapital(amount: number): void {
        this._capital += amount;
    }

    public spendCapital(amount: number): boolean {
        if (this._capital < amount) return false;
        this._capital -= amount;
        return true;
    }

    public getCurrentLevelId(): string | null {
        return this._currentLevelId;
    }

    public isPlaying(): boolean {
        return this._isPlaying;
    }

    public getPlayTimeSeconds(): number {
        return Math.floor((Date.now() - this._startTime) / 1000);
    }

    public getCardPoints(): PlayerCardPoint[] {
        return [...this._cardPoints];
    }

    public reset(): void {
        this._isPlaying = false;
        this._currentLevelId = null;
        this._capital = 0;
        this._startTime = 0;
        this._stats = this.createEmptyStats();
        this._cardPoints = [];
    }
}
