import { EventManager, GameEventType } from './EventManager';
import { SaveManager } from './SaveManager';

export type GameState = 'menu' | 'tutorial' | 'playing' | 'paused' | 'levelComplete' | 'gameOver';

export interface IGameStateData {
    currentLevel: number;
    score: number;
    state: GameState;
    isNewRecord: boolean;
}

export class GameManager {
    private static instance: GameManager;
    private currentState: GameState = 'menu';
    private currentLevel: number = 1;
    private currentScore: number = 0;
    private levelStartTime: number = 0;
    private isPaused: boolean = false;
    private eventManager: EventManager;
    private saveManager: SaveManager;

    private constructor() {
        this.eventManager = EventManager.getInstance();
        this.saveManager = SaveManager.getInstance();
        this.saveManager.loadFromStorage();
    }

    public static getInstance(): GameManager {
        if (!GameManager.instance) {
            GameManager.instance = new GameManager();
        }
        return GameManager.instance;
    }

    public startGame(levelId: number = 1): void {
        if (!this.saveManager.isLevelUnlocked(levelId)) {
            console.warn(`Level ${levelId} is not unlocked`);
            return;
        }
        this.currentLevel = levelId;
        this.currentScore = 0;
        this.levelStartTime = Date.now();
        this.isPaused = false;
        this.changeState('playing');
        this.eventManager.emit(GameEventType.GAME_START, { levelId });
    }

    public pauseGame(): void {
        if (this.currentState === 'playing' && !this.isPaused) {
            this.isPaused = true;
            this.changeState('paused');
            this.eventManager.emit(GameEventType.GAME_PAUSE);
        }
    }

    public resumeGame(): void {
        if (this.currentState === 'paused' && this.isPaused) {
            this.isPaused = false;
            this.changeState('playing');
            this.eventManager.emit(GameEventType.GAME_RESUME);
        }
    }

    public completeLevel(score: number): void {
        this.currentScore += score;
        const completionTime = (Date.now() - this.levelStartTime) / 1000;
        
        this.eventManager.emit(GameEventType.LEVEL_COMPLETE, {
            levelId: this.currentLevel,
            score: this.currentScore,
            completionTime
        });
        
        this.saveManager.recordScore(this.currentLevel, {
            orderId: `level_${this.currentLevel}_${Date.now()}`,
            score: this.currentScore,
            isFirstTime: this.saveManager.getLevelRecord(this.currentLevel)?.playCount === 0,
            reviewPassed: true,
            timestamp: Date.now(),
            completionTime
        });

        const nextLevel = this.currentLevel + 1;
        this.saveManager.unlockLevel(nextLevel);
        this.saveManager.addPlayTime(completionTime);
        this.changeState('levelComplete');
    }

    public failLevel(reason: string): void {
        const completionTime = (Date.now() - this.levelStartTime) / 1000;
        
        this.eventManager.emit(GameEventType.LEVEL_FAIL, {
            levelId: this.currentLevel,
            reason,
            completionTime
        });
        
        this.saveManager.recordScore(this.currentLevel, {
            orderId: `level_${this.currentLevel}_${Date.now()}`,
            score: 0,
            isFirstTime: this.saveManager.getLevelRecord(this.currentLevel)?.playCount === 0,
            errorType: reason,
            errorDescription: `关卡失败：${reason}`,
            reviewPassed: false,
            timestamp: Date.now(),
            completionTime
        });

        this.saveManager.addPlayTime(completionTime);
        this.changeState('gameOver');
    }

    public addScore(points: number): void {
        this.currentScore += points;
        this.eventManager.emit(GameEventType.SCORE_UPDATED, { score: this.currentScore });
    }

    public deductScore(points: number, reason: string): void {
        this.currentScore = Math.max(0, this.currentScore - points);
        this.eventManager.emit(GameEventType.SCORE_UPDATED, { 
            score: this.currentScore, 
            deduction: points, 
            reason 
        });
    }

    public getCurrentScore(): number {
        return this.currentScore;
    }

    public getCurrentLevel(): number {
        return this.currentLevel;
    }

    public getCurrentState(): GameState {
        return this.currentState;
    }

    public getElapsedTime(): number {
        return (Date.now() - this.levelStartTime) / 1000;
    }

    public isGamePlaying(): boolean {
        return this.currentState === 'playing' && !this.isPaused;
    }

    public isPaused(): boolean {
        return this.isPaused;
    }

    public returnToMenu(): void {
        this.currentState = 'menu';
        this.currentScore = 0;
        this.eventManager.emit(GameEventType.GAME_PAUSE);
    }

    public startTutorial(): void {
        this.changeState('tutorial');
    }

    public completeTutorial(): void {
        this.saveManager.completeTutorial();
        this.eventManager.emit(GameEventType.TUTORIAL_COMPLETE);
        this.changeState('menu');
    }

    public shouldShowTutorial(): boolean {
        return !this.saveManager.isTutorialCompleted();
    }

    private changeState(newState: GameState): void {
        const oldState = this.currentState;
        this.currentState = newState;
        console.log(`Game state changed: ${oldState} -> ${newState}`);
    }

    public getStateData(): IGameStateData {
        return {
            currentLevel: this.currentLevel,
            score: this.currentScore,
            state: this.currentState,
            isNewRecord: false
        };
    }

    public getSaveManager(): SaveManager {
        return this.saveManager;
    }

    public getEventManager(): EventManager {
        return this.eventManager;
    }
}
