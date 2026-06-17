export interface IScoreRecord {
    orderId: string;
    score: number;
    isFirstTime: boolean;
    errorType?: string;
    errorDescription?: string;
    reviewPassed: boolean;
    timestamp: number;
    completionTime: number;
}

export interface ILevelRecord {
    levelId: number;
    levelName: string;
    totalScore: number;
    maxScore: number;
    completionRate: number;
    firstSolveRate: number;
    averageTime: number;
    playCount: number;
    bestTime: number;
    records: IScoreRecord[];
}

export interface IPlayerProfile {
    playerId: string;
    playerName: string;
    totalScore: number;
    totalLevelsCompleted: number;
    firstSolveRate: number;
    playTime: number;
    unlockedLevels: number[];
    unlockedRules: string[];
    tutorialCompleted: boolean;
    lastPlayTime: number;
}

export interface IGameSaveData {
    profile: IPlayerProfile;
    levelRecords: Map<number, ILevelRecord>;
    settings: IGameSettings;
}

export interface IGameSettings {
    soundEnabled: boolean;
    musicEnabled: boolean;
    difficulty: 'easy' | 'normal' | 'hard';
    language: string;
    autoSave: boolean;
}

export interface ILeaderboardEntry {
    rank: number;
    playerId: string;
    playerName: string;
    totalScore: number;
    firstSolveRate: number;
    levelsCompleted: number;
    averageTime: number;
    lastUpdate: number;
}

export const STORAGE_KEYS = {
    PLAYER_PROFILE: 'prs_player_profile',
    LEVEL_RECORDS: 'prs_level_records',
    GAME_SETTINGS: 'prs_settings',
    SESSION_DATA: 'prs_session'
} as const;

export class SaveManager {
    private static instance: SaveManager;
    private saveData: IGameSaveData;
    private autoSaveTimer: number | null = null;

    private constructor() {
        this.saveData = this.initializeSaveData();
    }

    public static getInstance(): SaveManager {
        if (!SaveManager.instance) {
            SaveManager.instance = new SaveManager();
        }
        return SaveManager.instance;
    }

    private initializeSaveData(): IGameSaveData {
        return {
            profile: this.getDefaultProfile(),
            levelRecords: new Map(),
            settings: this.getDefaultSettings()
        };
    }

    private getDefaultProfile(): IPlayerProfile {
        return {
            playerId: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            playerName: '新玩家',
            totalScore: 0,
            totalLevelsCompleted: 0,
            firstSolveRate: 0,
            playTime: 0,
            unlockedLevels: [1],
            unlockedRules: [],
            tutorialCompleted: false,
            lastPlayTime: Date.now()
        };
    }

    private getDefaultSettings(): IGameSettings {
        return {
            soundEnabled: true,
            musicEnabled: true,
            difficulty: 'normal',
            language: 'zh-CN',
            autoSave: true
        };
    }

    public loadFromStorage(): void {
        try {
            const profileStr = localStorage.getItem(STORAGE_KEYS.PLAYER_PROFILE);
            if (profileStr) {
                this.saveData.profile = JSON.parse(profileStr);
            }

            const recordsStr = localStorage.getItem(STORAGE_KEYS.LEVEL_RECORDS);
            if (recordsStr) {
                const recordsObj = JSON.parse(recordsStr);
                this.saveData.levelRecords = new Map(Object.entries(recordsObj).map(([k, v]) => [Number(k), v as ILevelRecord]));
            }

            const settingsStr = localStorage.getItem(STORAGE_KEYS.GAME_SETTINGS);
            if (settingsStr) {
                this.saveData.settings = JSON.parse(settingsStr);
            }
        } catch (error) {
            console.error('Failed to load save data:', error);
            this.saveData = this.initializeSaveData();
        }
    }

    public saveToStorage(): void {
        try {
            localStorage.setItem(STORAGE_KEYS.PLAYER_PROFILE, JSON.stringify(this.saveData.profile));
            const recordsObj: Record<string, ILevelRecord> = {};
            this.saveData.levelRecords.forEach((value, key) => {
                recordsObj[key.toString()] = value;
            });
            localStorage.setItem(STORAGE_KEYS.LEVEL_RECORDS, JSON.stringify(recordsObj));
            localStorage.setItem(STORAGE_KEYS.GAME_SETTINGS, JSON.stringify(this.saveData.settings));
        } catch (error) {
            console.error('Failed to save data:', error);
        }
    }

    public getProfile(): IPlayerProfile {
        return { ...this.saveData.profile };
    }

    public updateProfile(updates: Partial<IPlayerProfile>): void {
        this.saveData.profile = { ...this.saveData.profile, ...updates, lastPlayTime: Date.now() };
        if (this.saveData.settings.autoSave) {
            this.saveToStorage();
        }
    }

    public getSettings(): IGameSettings {
        return { ...this.saveData.settings };
    }

    public updateSettings(updates: Partial<IGameSettings>): void {
        this.saveData.settings = { ...this.saveData.settings, ...updates };
        this.saveToStorage();
    }

    public recordScore(levelId: number, record: IScoreRecord): void {
        if (!this.saveData.levelRecords.has(levelId)) {
            this.saveData.levelRecords.set(levelId, this.createEmptyLevelRecord(levelId));
        }

        const levelRecord = this.saveData.levelRecords.get(levelId)!;
        levelRecord.records.push(record);
        levelRecord.playCount++;
        levelRecord.totalScore += record.score;
        levelRecord.maxScore = Math.max(levelRecord.maxScore, record.score);
        
        const firstTimeRecords = levelRecord.records.filter(r => r.isFirstTime);
        const passedFirstTime = firstTimeRecords.filter(r => r.reviewPassed).length;
        levelRecord.firstSolveRate = firstTimeRecords.length > 0 ? passedFirstTime / firstTimeRecords.length : 0;
        
        levelRecord.completionRate = levelRecord.records.filter(r => r.reviewPassed).length / levelRecord.records.length;
        levelRecord.averageTime = levelRecord.records.reduce((sum, r) => sum + r.completionTime, 0) / levelRecord.records.length;
        levelRecord.bestTime = Math.min(levelRecord.bestTime, record.completionTime);

        this.saveData.profile.totalScore += record.score;
        if (record.reviewPassed && !levelRecord.records.some((r, i) => i < levelRecord.records.length - 1 && r.reviewPassed)) {
            this.saveData.profile.totalLevelsCompleted++;
        }

        const allFirstTime = this.getAllRecords().filter(r => r.isFirstTime);
        this.saveData.profile.firstSolveRate = allFirstTime.length > 0 
            ? allFirstTime.filter(r => r.reviewPassed).length / allFirstTime.length 
            : 0;

        if (this.saveData.settings.autoSave) {
            this.saveToStorage();
        }
    }

    private createEmptyLevelRecord(levelId: number): ILevelRecord {
        return {
            levelId,
            levelName: `关卡 ${levelId}`,
            totalScore: 0,
            maxScore: 0,
            completionRate: 0,
            firstSolveRate: 0,
            averageTime: 0,
            playCount: 0,
            bestTime: Number.MAX_VALUE,
            records: []
        };
    }

    public getLevelRecord(levelId: number): ILevelRecord | undefined {
        return this.saveData.levelRecords.get(levelId);
    }

    public getAllRecords(): IScoreRecord[] {
        const allRecords: IScoreRecord[] = [];
        this.saveData.levelRecords.forEach(levelRecord => {
            allRecords.push(...levelRecord.records);
        });
        return allRecords;
    }

    public isLevelUnlocked(levelId: number): boolean {
        return this.saveData.profile.unlockedLevels.includes(levelId);
    }

    public unlockLevel(levelId: number): void {
        if (!this.saveData.profile.unlockedLevels.includes(levelId)) {
            this.saveData.profile.unlockedLevels.push(levelId);
            this.saveData.profile.unlockedLevels.sort((a, b) => a - b);
            if (this.saveData.settings.autoSave) {
                this.saveToStorage();
            }
        }
    }

    public isRuleUnlocked(ruleId: string): boolean {
        return this.saveData.profile.unlockedRules.includes(ruleId);
    }

    public unlockRule(ruleId: string): void {
        if (!this.saveData.profile.unlockedRules.includes(ruleId)) {
            this.saveData.profile.unlockedRules.push(ruleId);
            if (this.saveData.settings.autoSave) {
                this.saveToStorage();
            }
        }
    }

    public completeTutorial(): void {
        this.saveData.profile.tutorialCompleted = true;
        this.saveToStorage();
    }

    public isTutorialCompleted(): boolean {
        return this.saveData.profile.tutorialCompleted;
    }

    public getReviewFailedRecords(): IScoreRecord[] {
        return this.getAllRecords().filter(r => !r.reviewPassed);
    }

    public getErrorTypeStats(): Map<string, number> {
        const stats = new Map<string, number>();
        this.getAllRecords()
            .filter(r => r.errorType)
            .forEach(r => {
                const count = stats.get(r.errorType!) || 0;
                stats.set(r.errorType!, count + 1);
            });
        return stats;
    }

    public resetProgress(): void {
        this.saveData = this.initializeSaveData();
        this.saveToStorage();
    }

    public addPlayTime(seconds: number): void {
        this.saveData.profile.playTime += seconds;
    }

    public exportData(): string {
        const recordsObj: Record<string, ILevelRecord> = {};
        this.saveData.levelRecords.forEach((value, key) => {
            recordsObj[key.toString()] = value;
        });
        return JSON.stringify({
            ...this.saveData,
            levelRecords: recordsObj
        });
    }

    public importData(jsonString: string): boolean {
        try {
            const data = JSON.parse(jsonString);
            this.saveData.profile = data.profile;
            this.saveData.levelRecords = new Map(Object.entries(data.levelRecords).map(([k, v]) => [Number(k), v as ILevelRecord]));
            this.saveData.settings = data.settings;
            this.saveToStorage();
            return true;
        } catch (error) {
            console.error('Failed to import data:', error);
            return false;
        }
    }
}
