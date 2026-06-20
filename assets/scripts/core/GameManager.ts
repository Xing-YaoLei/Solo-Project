import { _decorator, Component, Node, sys, game, EventTarget } from 'cc';
import { Settings, LevelResult, ReviewRecord } from './GameTypes';
const { ccclass } = _decorator;

export enum GameEvent {
    SETTINGS_CHANGED = 'settings_changed',
    LEVEL_COMPLETED = 'level_completed',
    REVIEW_RECORDS_UPDATED = 'review_records_updated'
}

@ccclass('GameManager')
export class GameManager extends Component {
    private static _instance: GameManager | null = null;

    public static get instance(): GameManager {
        if (!this._instance) {
            const node = new Node('GameManager');
            game.addPersistRootNode(node);
            this._instance = node.addComponent(GameManager);
        }
        return this._instance;
    }

    private _settings: Settings = {
        soundEnabled: true,
        musicVolume: 0.7,
        sfxVolume: 0.8,
        vibrationEnabled: true,
        animationIntensity: 'medium',
        showTooltips: true,
        keyboardShortcuts: true,
        autoCheckAnswers: true
    };

    private _levelResults: LevelResult[] = [];
    private _reviewRecords: ReviewRecord[] = [];
    private _currentLevelId: number = 1;
    private _currentGameSessionId: string = '';

    private eventTarget: EventTarget = new EventTarget();

    onLoad() {
        this.loadSettings();
        this.loadProgress();
    }

    get settings(): Settings {
        return { ...this._settings };
    }

    updateSettings(partial: Partial<Settings>): void {
        this._settings = { ...this._settings, ...partial };
        this.saveSettings();
        this.eventTarget.emit(GameEvent.SETTINGS_CHANGED, this._settings);
    }

    get currentLevelId(): number {
        return this._currentLevelId;
    }

    setCurrentLevel(id: number): void {
        this._currentLevelId = id;
    }

    get currentGameSessionId(): string {
        return this._currentGameSessionId;
    }

    generateSessionId(): string {
        this._currentGameSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        return this._currentGameSessionId;
    }

    getCompletedLevelIds(): number[] {
        return this._levelResults
            .filter(r => r.passed)
            .map(r => r.levelId);
    }

    getLevelResult(levelId: number): LevelResult | null {
        return this._levelResults.find(r => r.levelId === levelId) || null;
    }

    getAllLevelResults(): LevelResult[] {
        return [...this._levelResults];
    }

    recordLevelResult(result: LevelResult): void {
        const idx = this._levelResults.findIndex(r => r.levelId === result.levelId);
        if (idx >= 0) {
            if (result.score > this._levelResults[idx].score) {
                this._levelResults[idx] = result;
            }
        } else {
            this._levelResults.push(result);
        }

        const record: ReviewRecord = {
            levelId: result.levelId,
            levelName: this.getLevelNameById(result.levelId),
            difficulty: this.getDifficultyName(result.stats.levelId),
            ordersPerMinute: (result.stats.ordersProcessed / (result.stats.totalTime / 60)) || 0,
            accuracy: result.stats.ordersProcessed > 0
                ? (result.stats.ordersCorrect / result.stats.ordersProcessed) * 100
                : 0,
            avgProcessingTime: result.stats.averageProcessingTime || 0,
            consecutiveMax: result.stats.maxConsecutiveCorrect,
            efficiency: result.efficiencyScore,
            score: result.score,
            timestamp: result.timestamp
        };

        this._reviewRecords.push(record);
        this.saveProgress();
        this.eventTarget.emit(GameEvent.LEVEL_COMPLETED, result);
        this.eventTarget.emit(GameEvent.REVIEW_RECORDS_UPDATED, this._reviewRecords);
    }

    getReviewRecords(levelId?: number): ReviewRecord[] {
        let records = [...this._reviewRecords];
        if (levelId !== undefined) {
            records = records.filter(r => r.levelId === levelId);
        }
        return records.sort((a, b) => b.timestamp - a.timestamp);
    }

    getBestRecords(): ReviewRecord[] {
        const bestMap = new Map<number, ReviewRecord>();
        for (const record of this._reviewRecords) {
            const existing = bestMap.get(record.levelId);
            if (!existing || record.score > existing.score) {
                bestMap.set(record.levelId, record);
            }
        }
        return Array.from(bestMap.values()).sort((a, b) => a.levelId - b.levelId);
    }

    on(event: GameEvent, callback: Function, target?: any): void {
        this.eventTarget.on(event, callback, target);
    }

    off(event: GameEvent, callback: Function, target?: any): void {
        this.eventTarget.off(event, callback, target);
    }

    private getLevelNameById(id: number): string {
        const names: Record<number, string> = {
            1: '新手入门',
            2: '渐入佳境',
            3: '票房热卖',
            4: '销售达人',
            5: '火爆预售',
            6: '终极挑战'
        };
        return names[id] || `关卡 ${id}`;
    }

    private getDifficultyName(id: number): string {
        const diffs: Record<number, string> = {
            1: '简单',
            2: '简单',
            3: '普通',
            4: '普通',
            5: '困难',
            6: '专家'
        };
        return diffs[id] || '普通';
    }

    private saveSettings(): void {
        try {
            sys.localStorage.setItem('ts_settings', JSON.stringify(this._settings));
        } catch (e) {
            console.error('保存设置失败', e);
        }
    }

    private loadSettings(): void {
        try {
            const saved = sys.localStorage.getItem('ts_settings');
            if (saved) {
                this._settings = { ...this._settings, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.error('加载设置失败', e);
        }
    }

    private saveProgress(): void {
        try {
            sys.localStorage.setItem('ts_level_results', JSON.stringify(this._levelResults));
            sys.localStorage.setItem('ts_review_records', JSON.stringify(this._reviewRecords));
        } catch (e) {
            console.error('保存进度失败', e);
        }
    }

    private loadProgress(): void {
        try {
            const results = sys.localStorage.getItem('ts_level_results');
            if (results) {
                this._levelResults = JSON.parse(results);
            }
            const records = sys.localStorage.getItem('ts_review_records');
            if (records) {
                this._reviewRecords = JSON.parse(records);
            }
        } catch (e) {
            console.error('加载进度失败', e);
        }
    }

    resetAllProgress(): void {
        this._levelResults = [];
        this._reviewRecords = [];
        this.saveProgress();
        this.eventTarget.emit(GameEvent.REVIEW_RECORDS_UPDATED, this._reviewRecords);
    }
}
