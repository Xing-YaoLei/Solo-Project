import { PharmacistRole } from './enums/PharmacistRole';

export interface LevelRecord {
    levelId: string;
    bestScore: number;
    completionCount: number;
    lastPlayedAt: string;
}

export interface PlayerData {
    playerId: string;
    playerName: string;
    role: PharmacistRole;
    totalTrainingTime: number;
    totalCorrectCount: number;
    totalTaskCount: number;
    levelRecords: Record<string, LevelRecord>;
}

export function createDefaultPlayerData(): PlayerData {
    return {
        playerId: 'player_001',
        playerName: '新员工',
        role: PharmacistRole.REVIEWER,
        totalTrainingTime: 0,
        totalCorrectCount: 0,
        totalTaskCount: 0,
        levelRecords: {}
    };
}

export function getAccuracy(player: PlayerData): number {
    if (player.totalTaskCount === 0) return 0;
    return Math.round((player.totalCorrectCount / player.totalTaskCount) * 100);
}

export function formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
        return `${hours}小时${minutes}分钟`;
    }
    return `${minutes}分钟${secs}秒`;
}
