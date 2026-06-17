import { ILeaderboardEntry, IScoreRecord, ILevelRecord, IPlayerProfile } from '../core/SaveManager';
import { SaveManager } from '../core/SaveManager';
import { Logger } from '../core/Logger';

export interface IReviewItem {
    orderId: string;
    errorType: string;
    errorDescription: string;
    timestamp: number;
    levelId: number;
    isFirstTime: boolean;
    score: number;
    completionTime: number;
}

export interface IErrorStats {
    errorType: string;
    count: number;
    percentage: number;
    description: string;
    relatedOrders: string[];
}

export interface IReviewSummary {
    totalAttempts: number;
    passedAttempts: number;
    failedAttempts: number;
    firstSolveRate: number;
    averageScore: number;
    averageTime: number;
    errorStats: IErrorStats[];
    topErrors: IErrorStats[];
    reviewItems: IReviewItem[];
}

export interface ILevelRanking {
    levelId: number;
    levelName: string;
    entries: ILevelRecord[];
}

export const ERROR_TYPE_DESCRIPTIONS: Record<string, string> = {
    WRONG_CATEGORY: '错误判断工单类型',
    SKILL_MISMATCH: '派单技能不匹配',
    WORKLOAD_EXCEEDED: '派单人员工作量超载',
    PRIORITY_VIOLATION: '紧急工单处理不当',
    DELAYED_RESPONSE: '紧急工单响应延迟',
    DISPATCH_VIOLATION: '违反派单规则',
    TIME_EXPIRED: '工单处理超时',
    TIME_WARNING: '处理时间过长',
    WRONG_CHOICE: '错误选择',
    UNKNOWN: '未知错误'
};

export class LeaderboardManager {
    private static instance: LeaderboardManager;
    private saveManager: SaveManager;
    private localEntries: ILeaderboardEntry[] = [];
    private readonly MAX_ENTRIES = 100;

    private constructor() {
        this.saveManager = SaveManager.getInstance();
        this.initializeLocalLeaderboard();
    }

    public static getInstance(): LeaderboardManager {
        if (!LeaderboardManager.instance) {
            LeaderboardManager.instance = new LeaderboardManager();
        }
        return LeaderboardManager.instance;
    }

    private initializeLocalLeaderboard(): void {
        try {
            const saved = localStorage.getItem('prs_leaderboard');
            if (saved) {
                this.localEntries = JSON.parse(saved);
            } else {
                this.localEntries = this.generateMockLeaderboard();
                this.saveLeaderboard();
            }
        } catch (error) {
            Logger.error('Failed to load leaderboard:', error);
            this.localEntries = this.generateMockLeaderboard();
        }
    }

    private generateMockLeaderboard(): ILeaderboardEntry[] {
        const mockNames = ['物业达人', '维修专家', '调度高手', '效率王', '金牌管家', '服务之星', '园区卫士', '抢修先锋', '贴心管家', '技术能手'];
        return mockNames.map((name, index) => ({
            rank: index + 1,
            playerId: `mock_${index}`,
            playerName: name,
            totalScore: 5000 - index * 300 + Math.floor(Math.random() * 200),
            firstSolveRate: 0.95 - index * 0.03 + Math.random() * 0.02,
            levelsCompleted: 6 - Math.floor(index / 2),
            averageTime: 120 + index * 15 + Math.random() * 20,
            lastUpdate: Date.now() - index * 86400000
        }));
    }

    private saveLeaderboard(): void {
        try {
            localStorage.setItem('prs_leaderboard', JSON.stringify(this.localEntries));
        } catch (error) {
            Logger.error('Failed to save leaderboard:', error);
        }
    }

    public submitScore(profile: IPlayerProfile): ILeaderboardEntry {
        const entry: ILeaderboardEntry = {
            rank: 0,
            playerId: profile.playerId,
            playerName: profile.playerName,
            totalScore: profile.totalScore,
            firstSolveRate: profile.firstSolveRate,
            levelsCompleted: profile.totalLevelsCompleted,
            averageTime: profile.playTime > 0 ? profile.playTime / Math.max(1, profile.totalLevelsCompleted) : 0,
            lastUpdate: Date.now()
        };

        const existingIndex = this.localEntries.findIndex(e => e.playerId === profile.playerId);
        if (existingIndex >= 0) {
            this.localEntries[existingIndex] = entry;
        } else {
            this.localEntries.push(entry);
        }

        this.localEntries.sort((a, b) => b.totalScore - a.totalScore);
        this.localEntries = this.localEntries.slice(0, this.MAX_ENTRIES);
        this.localEntries.forEach((e, i) => e.rank = i + 1);
        this.saveLeaderboard();

        return this.localEntries.find(e => e.playerId === profile.playerId) || entry;
    }

    public getLeaderboard(limit: number = 20): ILeaderboardEntry[] {
        return this.localEntries.slice(0, limit).map(e => ({ ...e }));
    }

    public getPlayerRank(playerId: string): ILeaderboardEntry | undefined {
        return this.localEntries.find(e => e.playerId === playerId);
    }

    public getTopPlayers(count: number = 10): ILeaderboardEntry[] {
        return this.getLeaderboard(count);
    }

    public getAroundPlayer(playerId: string, range: number = 2): ILeaderboardEntry[] {
        const playerIndex = this.localEntries.findIndex(e => e.playerId === playerId);
        if (playerIndex === -1) {
            return this.getTopPlayers(range * 2 + 1);
        }

        const start = Math.max(0, playerIndex - range);
        const end = Math.min(this.localEntries.length, playerIndex + range + 1);
        return this.localEntries.slice(start, end).map(e => ({ ...e }));
    }
}

export class ReviewManager {
    private static instance: ReviewManager;
    private saveManager: SaveManager;

    private constructor() {
        this.saveManager = SaveManager.getInstance();
    }

    public static getInstance(): ReviewManager {
        if (!ReviewManager.instance) {
            ReviewManager.instance = new ReviewManager();
        }
        return ReviewManager.instance;
    }

    public getReviewItems(): IReviewItem[] {
        const allRecords = this.saveManager.getAllRecords();
        const failedRecords = allRecords.filter(r => !r.reviewPassed);
        
        return failedRecords.map(record => {
            const levelRecord = this.findLevelForRecord(record);
            return {
                orderId: record.orderId,
                errorType: record.errorType || 'UNKNOWN',
                errorDescription: record.errorDescription || '处理失败',
                timestamp: record.timestamp,
                levelId: levelRecord?.levelId || 0,
                isFirstTime: record.isFirstTime,
                score: record.score,
                completionTime: record.completionTime
            };
        }).sort((a, b) => b.timestamp - a.timestamp);
    }

    private findLevelForRecord(record: IScoreRecord): ILevelRecord | undefined {
        for (let i = 1; i <= 100; i++) {
            const levelRecord = this.saveManager.getLevelRecord(i);
            if (levelRecord?.records.some(r => r.orderId === record.orderId)) {
                return levelRecord;
            }
        }
        return undefined;
    }

    public getReviewSummary(): IReviewSummary {
        const allRecords = this.saveManager.getAllRecords();
        const reviewItems = this.getReviewItems();
        const passedRecords = allRecords.filter(r => r.reviewPassed);
        const firstTimeRecords = allRecords.filter(r => r.isFirstTime);

        const errorStats = this.calculateErrorStats(reviewItems);

        return {
            totalAttempts: allRecords.length,
            passedAttempts: passedRecords.length,
            failedAttempts: reviewItems.length,
            firstSolveRate: firstTimeRecords.length > 0 
                ? firstTimeRecords.filter(r => r.reviewPassed).length / firstTimeRecords.length 
                : 0,
            averageScore: allRecords.length > 0 
                ? allRecords.reduce((sum, r) => sum + r.score, 0) / allRecords.length 
                : 0,
            averageTime: allRecords.length > 0 
                ? allRecords.reduce((sum, r) => sum + r.completionTime, 0) / allRecords.length 
                : 0,
            errorStats,
            topErrors: errorStats.slice(0, 5),
            reviewItems: reviewItems.slice(0, 50)
        };
    }

    private calculateErrorStats(items: IReviewItem[]): IErrorStats[] {
        const errorMap = new Map<string, { count: number; orders: string[] }>();
        
        items.forEach(item => {
            if (!errorMap.has(item.errorType)) {
                errorMap.set(item.errorType, { count: 0, orders: [] });
            }
            const data = errorMap.get(item.errorType)!;
            data.count++;
            data.orders.push(item.orderId);
        });

        const total = items.length || 1;
        const stats: IErrorStats[] = [];

        errorMap.forEach((data, errorType) => {
            stats.push({
                errorType,
                count: data.count,
                percentage: data.count / total,
                description: ERROR_TYPE_DESCRIPTIONS[errorType] || errorType,
                relatedOrders: data.orders.slice(0, 10)
            });
        });

        return stats.sort((a, b) => b.count - a.count);
    }

    public getLevelReview(levelId: number): IReviewSummary | null {
        const levelRecord = this.saveManager.getLevelRecord(levelId);
        if (!levelRecord) return null;

        const allRecords = levelRecord.records;
        const failedRecords = allRecords.filter(r => !r.reviewPassed);
        const firstTimeRecords = allRecords.filter(r => r.isFirstTime);

        const reviewItems: IReviewItem[] = failedRecords.map(record => ({
            orderId: record.orderId,
            errorType: record.errorType || 'UNKNOWN',
            errorDescription: record.errorDescription || '处理失败',
            timestamp: record.timestamp,
            levelId,
            isFirstTime: record.isFirstTime,
            score: record.score,
            completionTime: record.completionTime
        }));

        const errorStats = this.calculateErrorStats(reviewItems);
        const passedRecords = allRecords.filter(r => r.reviewPassed);

        return {
            totalAttempts: allRecords.length,
            passedAttempts: passedRecords.length,
            failedAttempts: failedRecords.length,
            firstSolveRate: firstTimeRecords.length > 0 
                ? firstTimeRecords.filter(r => r.reviewPassed).length / firstTimeRecords.length 
                : 0,
            averageScore: allRecords.length > 0 
                ? allRecords.reduce((sum, r) => sum + r.score, 0) / allRecords.length 
                : 0,
            averageTime: allRecords.length > 0 
                ? allRecords.reduce((sum, r) => sum + r.completionTime, 0) / allRecords.length 
                : 0,
            errorStats,
            topErrors: errorStats.slice(0, 5),
            reviewItems
        };
    }

    public getFirstSolveRateByLevel(): Map<number, number> {
        const rates = new Map<number, number>();
        for (let i = 1; i <= 100; i++) {
            const record = this.saveManager.getLevelRecord(i);
            if (record) {
                rates.set(i, record.firstSolveRate);
            }
        }
        return rates;
    }

    public getErrorTypeTrend(days: number = 7): Map<string, number[]> {
        const trend = new Map<string, number[]>();
        const now = Date.now();
        const dayMs = 86400000;

        const allItems = this.getReviewItems();
        
        for (let day = days - 1; day >= 0; day--) {
            const dayStart = now - day * dayMs;
            const dayEnd = now - (day - 1) * dayMs;
            
            const dayItems = allItems.filter(item => 
                item.timestamp >= dayStart && item.timestamp < dayEnd
            );

            const dailyErrors = new Map<string, number>();
            dayItems.forEach(item => {
                dailyErrors.set(item.errorType, (dailyErrors.get(item.errorType) || 0) + 1);
            });

            dailyErrors.forEach((count, errorType) => {
                if (!trend.has(errorType)) {
                    trend.set(errorType, new Array(days).fill(0));
                }
                trend.get(errorType)![days - 1 - day] = count;
            });
        }

        return trend;
    }

    public exportReviewData(): string {
        return JSON.stringify({
            summary: this.getReviewSummary(),
            items: this.getReviewItems()
        });
    }

    public getTopErrorTypes(count: number = 5): IErrorStats[] {
        return this.getReviewSummary().topErrors.slice(0, count);
    }

    public getItemsByErrorType(errorType: string): IReviewItem[] {
        return this.getReviewItems().filter(item => item.errorType === errorType);
    }

    public getFirstTimeFailedItems(): IReviewItem[] {
        return this.getReviewItems().filter(item => item.isFirstTime);
    }
}
