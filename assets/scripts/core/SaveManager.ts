import { _decorator, Component, sys } from 'cc';
import { IGameSave, ITrainingRecord, IErrorRecord, IMaterialMissRecord } from './GameInterfaces';
import { GameConstants } from './GameConstants';
const { ccclass, property } = _decorator;

@ccclass('SaveManager')
export class SaveManager extends Component {

    private static _instance: SaveManager | null = null;

    public static get instance(): SaveManager {
        if (!SaveManager._instance) {
            SaveManager._instance = new SaveManager();
        }
        return SaveManager._instance;
    }

    private static readonly SAVE_KEY = 'legal_game_save_v1';
    private static readonly SAVE_VERSION = '1.0.0';

    private _currentSave: IGameSave | null = null;

    constructor() {
        super();
    }

    public init(): void {
        this.loadSave();
        if (!this._currentSave) {
            this.createNewSave();
        }
    }

    private createNewSave(): void {
        this._currentSave = {
            saveVersion: SaveManager.SAVE_VERSION,
            playerName: 'Player',
            totalScore: 0,
            completedCaseIds: [],
            unlockedLevelIds: ['level_1'],
            unlockedClientIds: ['client_1'],
            currentCaseId: null,
            currentLevelId: 'level_1',
            trainingRecords: [],
            settings: {
                soundEnabled: true,
                musicEnabled: true,
                language: 'zh-CN'
            },
            tutorialProgress: {},
            lastSaveTime: Date.now()
        };
        this.saveGame();
    }

    public loadSave(): IGameSave | null {
        try {
            const saveStr = sys.localStorage.getItem(SaveManager.SAVE_KEY);
            if (saveStr) {
                this._currentSave = JSON.parse(saveStr);
                console.log('[SaveManager] Save loaded successfully');
                return this._currentSave;
            }
        } catch (e) {
            console.error('[SaveManager] Failed to load save:', e);
        }
        return null;
    }

    public saveGame(): void {
        if (!this._currentSave) return;
        try {
            this._currentSave.lastSaveTime = Date.now();
            sys.localStorage.setItem(SaveManager.SAVE_KEY, JSON.stringify(this._currentSave));
            console.log('[SaveManager] Game saved');
        } catch (e) {
            console.error('[SaveManager] Failed to save game:', e);
        }
    }

    public getSave(): IGameSave {
        if (!this._currentSave) {
            this.createNewSave();
        }
        return this._currentSave!;
    }

    public addScore(score: number): void {
        const save = this.getSave();
        save.totalScore += score;
        this.saveGame();
    }

    public completeCase(caseId: string): void {
        const save = this.getSave();
        if (!save.completedCaseIds.includes(caseId)) {
            save.completedCaseIds.push(caseId);
            this.saveGame();
        }
    }

    public unlockLevel(levelId: string): void {
        const save = this.getSave();
        if (!save.unlockedLevelIds.includes(levelId)) {
            save.unlockedLevelIds.push(levelId);
            this.saveGame();
        }
    }

    public unlockClient(clientId: string): void {
        const save = this.getSave();
        if (!save.unlockedClientIds.includes(clientId)) {
            save.unlockedClientIds.push(clientId);
            this.saveGame();
        }
    }

    public setCurrentCase(caseId: string | null): void {
        const save = this.getSave();
        save.currentCaseId = caseId;
        this.saveGame();
    }

    public setCurrentLevel(levelId: string): void {
        const save = this.getSave();
        save.currentLevelId = levelId;
        this.saveGame();
    }

    public addTrainingRecord(record: ITrainingRecord): void {
        const save = this.getSave();
        save.trainingRecords.push(record);
        if (save.trainingRecords.length > 100) {
            save.trainingRecords = save.trainingRecords.slice(-100);
        }
        this.saveGame();
    }

    public getTrainingRecords(caseId?: string): ITrainingRecord[] {
        const save = this.getSave();
        if (caseId) {
            return save.trainingRecords.filter(r => r.caseId === caseId);
        }
        return save.trainingRecords;
    }

    public getBestRecord(caseId: string): ITrainingRecord | null {
        const records = this.getTrainingRecords(caseId);
        if (records.length === 0) return null;
        return records.reduce((best, current) => 
            current.score > best.score ? current : best
        );
    }

    public setTutorialComplete(tutorialId: string): void {
        const save = this.getSave();
        save.tutorialProgress[tutorialId] = true;
        this.saveGame();
    }

    public isTutorialComplete(tutorialId: string): boolean {
        const save = this.getSave();
        return !!save.tutorialProgress[tutorialId];
    }

    public updateSettings(settings: Partial<IGameSave['settings']>): void {
        const save = this.getSave();
        save.settings = { ...save.settings, ...settings };
        this.saveGame();
    }

    public isCaseCompleted(caseId: string): boolean {
        return this.getSave().completedCaseIds.includes(caseId);
    }

    public isLevelUnlocked(levelId: string): boolean {
        return this.getSave().unlockedLevelIds.includes(levelId);
    }

    public isClientUnlocked(clientId: string): boolean {
        return this.getSave().unlockedClientIds.includes(clientId);
    }

    public getTotalScore(): number {
        return this.getSave().totalScore;
    }

    public resetSave(): void {
        this._currentSave = null;
        sys.localStorage.removeItem(SaveManager.SAVE_KEY);
        this.createNewSave();
        console.log('[SaveManager] Save reset');
    }

    public getErrorAnalysis(caseId?: string): { category: GameConstants.ErrorCategory; count: number }[] {
        const records = this.getTrainingRecords(caseId);
        const errorCount: Record<string, number> = {};
        
        records.forEach(record => {
            record.errorRecords.forEach(error => {
                const key = error.errorCategory;
                errorCount[key] = (errorCount[key] || 0) + 1;
            });
        });

        return Object.entries(errorCount)
            .map(([category, count]) => ({ 
                category: category as GameConstants.ErrorCategory, 
                count 
            }))
            .sort((a, b) => b.count - a.count);
    }

    public getMaterialMissAnalysis(caseId?: string): { clueId: string; count: number }[] {
        const records = this.getTrainingRecords(caseId);
        const missCount: Record<string, number> = {};
        
        records.forEach(record => {
            record.materialMissRecords.forEach(miss => {
                missCount[miss.clueId] = (missCount[miss.clueId] || 0) + 1;
            });
        });

        return Object.entries(missCount)
            .map(([clueId, count]) => ({ clueId, count }))
            .sort((a, b) => b.count - a.count);
    }
}
