import { sys } from 'cc';
import type { PlayerData, LevelRecord } from '../data/PlayerData';
import { createDefaultPlayerData, getAccuracy, formatTime } from '../data/PlayerData';
import { PharmacistRole } from '../data/enums/PharmacistRole';
import type { TaskResult } from '../data/GameState';
import { ScoringService } from './ScoringService';

const STORAGE_KEY = 'pharmacy_game_player_data';

export class PlayerDataService {
    private static _instance: PlayerDataService | null = null;
    private playerData: PlayerData | null = null;

    public static get instance(): PlayerDataService {
        if (!PlayerDataService._instance) {
            PlayerDataService._instance = new PlayerDataService();
        }
        return PlayerDataService._instance;
    }

    public loadPlayerData(): PlayerData {
        if (this.playerData) {
            return { ...this.playerData };
        }

        try {
            const stored = sys.localStorage.getItem(STORAGE_KEY);
            if (stored) {
                this.playerData = JSON.parse(stored);
                return { ...this.playerData! };
            }
        } catch (error) {
            console.error('Failed to load player data:', error);
        }

        this.playerData = createDefaultPlayerData();
        this.savePlayerData();
        return { ...this.playerData };
    }

    public savePlayerData(): void {
        if (!this.playerData) return;

        try {
            sys.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.playerData));
        } catch (error) {
            console.error('Failed to save player data:', error);
        }
    }

    public updatePlayerName(name: string): void {
        if (!this.playerData) {
            this.loadPlayerData();
        }
        this.playerData!.playerName = name;
        this.savePlayerData();
    }

    public updatePlayerRole(role: PharmacistRole): void {
        if (!this.playerData) {
            this.loadPlayerData();
        }
        this.playerData!.role = role;
        this.savePlayerData();
    }

    public recordLevelCompletion(levelId: string, results: TaskResult[], timeSpent: number): void {
        if (!this.playerData) {
            this.loadPlayerData();
        }

        const data = this.playerData!;
        const score = ScoringService.instance.calculateFinalScore(results);
        const correctCount = ScoringService.instance.getCorrectCount(results);

        data.totalTrainingTime += Math.floor(timeSpent);
        data.totalTaskCount += results.length;
        data.totalCorrectCount += correctCount;

        if (!data.levelRecords[levelId]) {
            data.levelRecords[levelId] = {
                levelId,
                bestScore: 0,
                completionCount: 0,
                lastPlayedAt: ''
            };
        }

        const record = data.levelRecords[levelId];
        record.completionCount++;
        record.bestScore = Math.max(record.bestScore, score);
        record.lastPlayedAt = new Date().toISOString();

        this.savePlayerData();
    }

    public getLevelRecord(levelId: string): LevelRecord | null {
        if (!this.playerData) {
            this.loadPlayerData();
        }
        return this.playerData!.levelRecords[levelId] || null;
    }

    public getPlayerStats(): {
        totalTrainingTime: string;
        accuracy: number;
        totalTasks: number;
        totalLevels: number;
    } {
        if (!this.playerData) {
            this.loadPlayerData();
        }

        const data = this.playerData!;
        return {
            totalTrainingTime: formatTime(data.totalTrainingTime),
            accuracy: getAccuracy(data),
            totalTasks: data.totalTaskCount,
            totalLevels: Object.keys(data.levelRecords).length
        };
    }

    public resetPlayerData(): void {
        this.playerData = createDefaultPlayerData();
        this.savePlayerData();
    }

    public isLevelUnlocked(levelId: string, currentLevelIndex: number): boolean {
        if (!this.playerData) {
            this.loadPlayerData();
        }

        if (currentLevelIndex === 0) return true;

        const levels = Object.keys(this.playerData!.levelRecords).sort();
        if (currentLevelIndex >= levels.length) return true;

        const prevLevelId = levels[currentLevelIndex - 1];
        const prevRecord = this.playerData!.levelRecords[prevLevelId];
        return prevRecord && prevRecord.completionCount > 0;
    }
}
