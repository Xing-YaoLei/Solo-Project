import { _decorator, Component, Node } from 'cc';
import { LevelResult } from './data/ElderlyData';
const { ccclass } = _decorator;

export interface GameSettings {
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    animationIntensity: number;
}

const DEFAULT_SETTINGS: GameSettings = {
    soundEnabled: true,
    vibrationEnabled: false,
    animationIntensity: 1,
};

const SETTINGS_KEY = 'elderly_care_settings';
const RESULTS_KEY = 'elderly_care_results';
const TUTORIAL_KEY = 'elderly_care_tutorial';

@ccclass('GameManager')
export class GameManager extends Component {
    private static _instance: GameManager | null = null;

    public static get instance(): GameManager {
        if (!this._instance) {
            this._instance = new GameManager();
        }
        return this._instance;
    }

    private _settings: GameSettings;
    private _levelResults: Map<number, LevelResult>;
    private _tutorialCompleted: boolean;
    private _currentLevelId: number = 1;

    constructor() {
        super();
        this._settings = this.loadSettings();
        this._levelResults = this.loadResults();
        this._tutorialCompleted = this.loadTutorialStatus();
    }

    onLoad() {
        if (GameManager._instance) {
            this.destroy();
            return;
        }
        GameManager._instance = this;
    }

    get settings(): GameSettings {
        return { ...this._settings };
    }

    updateSettings(settings: Partial<GameSettings>): void {
        this._settings = { ...this._settings, ...settings };
        this.saveSettings();
    }

    get currentLevelId(): number {
        return this._currentLevelId;
    }

    set currentLevelId(id: number) {
        this._currentLevelId = id;
    }

    getLevelResult(levelId: number): LevelResult | null {
        return this._levelResults.get(levelId) || null;
    }

    saveLevelResult(result: LevelResult): void {
        const existing = this._levelResults.get(result.levelId);
        if (!existing || result.score > existing.score) {
            this._levelResults.set(result.levelId, result);
            this.saveResults();
        }
    }

    getAllResults(): LevelResult[] {
        return Array.from(this._levelResults.values()).sort((a, b) => a.levelId - b.levelId);
    }

    isLevelUnlocked(levelId: number): boolean {
        if (levelId === 1) return true;
        const prevResult = this._levelResults.get(levelId - 1);
        return prevResult ? prevResult.passed : false;
    }

    get tutorialCompleted(): boolean {
        return this._tutorialCompleted;
    }

    set tutorialCompleted(value: boolean) {
        this._tutorialCompleted = value;
        this.saveTutorialStatus();
    }

    private loadSettings(): GameSettings {
        try {
            const saved = localStorage.getItem(SETTINGS_KEY);
            if (saved) {
                return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.error('Failed to load settings:', e);
        }
        return { ...DEFAULT_SETTINGS };
    }

    private saveSettings(): void {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(this._settings));
        } catch (e) {
            console.error('Failed to save settings:', e);
        }
    }

    private loadResults(): Map<number, LevelResult> {
        const map = new Map<number, LevelResult>();
        try {
            const saved = localStorage.getItem(RESULTS_KEY);
            if (saved) {
                const arr: LevelResult[] = JSON.parse(saved);
                arr.forEach(r => map.set(r.levelId, r));
            }
        } catch (e) {
            console.error('Failed to load results:', e);
        }
        return map;
    }

    private saveResults(): void {
        try {
            const arr = Array.from(this._levelResults.values());
            localStorage.setItem(RESULTS_KEY, JSON.stringify(arr));
        } catch (e) {
            console.error('Failed to save results:', e);
        }
    }

    private loadTutorialStatus(): boolean {
        try {
            return localStorage.getItem(TUTORIAL_KEY) === 'true';
        } catch (e) {
            return false;
        }
    }

    private saveTutorialStatus(): void {
        try {
            localStorage.setItem(TUTORIAL_KEY, String(this._tutorialCompleted));
        } catch (e) {
            console.error('Failed to save tutorial status:', e);
        }
    }

    playSound(soundType: 'click' | 'correct' | 'wrong' | 'combo' | 'levelComplete'): void {
        if (!this._settings.soundEnabled) return;
        console.log(`[Sound] ${soundType}`);
    }

    vibrate(duration: number = 50): void {
        if (!this._settings.vibrationEnabled) return;
        if (navigator && navigator.vibrate) {
            navigator.vibrate(duration);
        }
    }

    getAnimationMultiplier(): number {
        return this._settings.animationIntensity;
    }

    resetAllData(): void {
        this._settings = { ...DEFAULT_SETTINGS };
        this._levelResults.clear();
        this._tutorialCompleted = false;
        localStorage.removeItem(SETTINGS_KEY);
        localStorage.removeItem(RESULTS_KEY);
        localStorage.removeItem(TUTORIAL_KEY);
        this.saveSettings();
    }
}
