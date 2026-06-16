import { _decorator, sys, log, error } from 'cc';
import { GameTypes } from '../types/GameTypes';
import { ConfigTypes } from '../types/ConfigTypes';

const { ccclass } = _decorator;

@ccclass('SaveManager')
export class SaveManager {

    private static _instance: SaveManager | null = null;
    public static get instance(): SaveManager {
        if (!SaveManager._instance) {
            SaveManager._instance = new SaveManager();
        }
        return SaveManager._instance;
    }

    private readonly PROFILE_KEY = 'rehab_center_player_profile_v1';
    private readonly LEADERBOARD_KEY = 'rehab_center_leaderboard_v1';
    private readonly REPLAY_PREFIX = 'rehab_center_replay_';

    private profile: GameTypes.PlayerProfile | null = null;
    private leaderboard: GameTypes.LeaderboardEntry[] = [];

    private constructor() {
        this.loadProfile();
        this.loadLeaderboard();
    }

    public getPlayerProfile(): GameTypes.PlayerProfile {
        if (!this.profile) {
            this.profile = this.createDefaultProfile();
        }
        return this.profile;
    }

    private createDefaultProfile(): GameTypes.PlayerProfile {
        const now = Date.now();
        return {
            playerId: `player_${now}_${Math.random().toString(36).substring(2, 8)}`,
            playerName: '治疗师学徒',
            level: 1,
            totalExp: 0,
            coins: 0,
            unlockedLevels: ['LV001'],
            ownedItems: [],
            completedLevels: {},
            totalTrainingCount: 0,
            averageScore: 0,
            bestScore: 0,
            insuranceRejectionTotalCount: 0,
            errorDistribution: this.initErrorDistribution(),
            tutorialProgress: {},
            lastLoginTime: now,
            createdAt: now
        };
    }

    private initErrorDistribution(): Record<ConfigTypes.ErrorType, number> {
        const dist: Record<string, number> = {};
        const types: ConfigTypes.ErrorType[] = [
            'PROCEDURAL', 'ADMINISTRATIVE', 'DIAGNOSTIC', 'EVALUATION',
            'DOCUMENTATION', 'OVERTREATMENT', 'TREATMENT', 'BILLING_FRAUD',
            'COMMUNICATION', 'SAFETY', 'COLLABORATION', 'PLANNING'
        ];
        types.forEach(t => dist[t] = 0);
        return dist as Record<ConfigTypes.ErrorType, number>;
    }

    private loadProfile(): void {
        try {
            const saved = sys.localStorage.getItem(this.PROFILE_KEY);
            if (saved) {
                this.profile = JSON.parse(saved) as GameTypes.PlayerProfile;
                if (!this.profile.errorDistribution) {
                    this.profile.errorDistribution = this.initErrorDistribution();
                }
                this.profile.lastLoginTime = Date.now();
            }
        } catch (e) {
            error('[SaveManager] 加载存档失败:', e);
        }
    }

    public saveProfile(): boolean {
        try {
            if (this.profile) {
                sys.localStorage.setItem(this.PROFILE_KEY, JSON.stringify(this.profile));
                return true;
            }
        } catch (e) {
            error('[SaveManager] 保存存档失败:', e);
        }
        return false;
    }

    public updatePlayerName(name: string): void {
        if (this.profile) {
            this.profile.playerName = name;
            this.saveProfile();
        }
    }

    public addExp(amount: number): void {
        if (!this.profile) return;
        this.profile.totalExp += amount;
        const expPerLevel = 500;
        const newLevel = Math.floor(this.profile.totalExp / expPerLevel) + 1;
        this.profile.level = newLevel;
        this.saveProfile();
    }

    public addCoins(amount: number): void {
        if (!this.profile) return;
        this.profile.coins += amount;
        this.saveProfile();
    }

    public unlockLevel(levelId: string): void {
        if (!this.profile) return;
        if (!this.profile.unlockedLevels.includes(levelId)) {
            this.profile.unlockedLevels.push(levelId);
            this.saveProfile();
        }
    }

    public isLevelUnlocked(levelId: string): boolean {
        return this.profile?.unlockedLevels.includes(levelId) || false;
    }

    public addItem(itemId: string): void {
        if (!this.profile) return;
        if (!this.profile.ownedItems.includes(itemId)) {
            this.profile.ownedItems.push(itemId);
            this.saveProfile();
        }
    }

    public hasItem(itemId: string): boolean {
        return this.profile?.ownedItems.includes(itemId) || false;
    }

    public recordLevelCompletion(
        levelId: string,
        sessionId: string,
        score: number,
        passed: boolean,
        insuranceRejections: number,
        errors: ConfigTypes.ErrorType[]
    ): void {
        if (!this.profile) return;

        this.profile.totalTrainingCount++;
        this.profile.insuranceRejectionTotalCount += insuranceRejections;

        errors.forEach(e => {
            if (this.profile) {
                this.profile.errorDistribution[e] = (this.profile.errorDistribution[e] || 0) + 1;
            }
        });

        if (score > this.profile.bestScore) {
            this.profile.bestScore = score;
        }

        const totalScore = this.profile.averageScore * (this.profile.totalTrainingCount - 1) + score;
        this.profile.averageScore = totalScore / this.profile.totalTrainingCount;

        const now = Date.now();
        const existing = this.profile.completedLevels[levelId];
        if (existing) {
            existing.attempts++;
            existing.lastAttemptAt = now;
            if (score > existing.bestScore) {
                existing.bestScore = score;
                existing.bestSessionId = sessionId;
            }
            if (passed && existing.stars < this.calculateStars(score, passed)) {
                existing.stars = this.calculateStars(score, passed);
            }
        } else {
            this.profile.completedLevels[levelId] = {
                levelId,
                bestScore: score,
                bestSessionId: sessionId,
                attempts: 1,
                firstCompletedAt: passed ? now : 0,
                lastAttemptAt: now,
                stars: passed ? this.calculateStars(score, passed) : 0
            };
        }

        this.saveProfile();
    }

    private calculateStars(score: number, passed: boolean): number {
        if (!passed) return 0;
        if (score >= 90) return 3;
        if (score >= 75) return 2;
        return 1;
    }

    public isTutorialCompleted(tutorialId: string): boolean {
        return this.profile?.tutorialProgress[tutorialId] || false;
    }

    public markTutorialCompleted(tutorialId: string): void {
        if (!this.profile) return;
        this.profile.tutorialProgress[tutorialId] = true;
        this.saveProfile();
    }

    public getCompletedLevelIds(): string[] {
        if (!this.profile) return [];
        return Object.keys(this.profile.completedLevels).filter(
            id => this.profile!.completedLevels[id].firstCompletedAt > 0
        );
    }

    public getTotalScore(): number {
        if (!this.profile) return 0;
        let total = 0;
        for (const id in this.profile.completedLevels) {
            total += this.profile.completedLevels[id].bestScore;
        }
        return total;
    }

    private loadLeaderboard(): void {
        try {
            const saved = sys.localStorage.getItem(this.LEADERBOARD_KEY);
            if (saved) {
                this.leaderboard = JSON.parse(saved) as GameTypes.LeaderboardEntry[];
            }
        } catch (e) {
            error('[SaveManager] 加载排行榜失败:', e);
            this.leaderboard = [];
        }
    }

    public saveLeaderboard(): boolean {
        try {
            sys.localStorage.setItem(this.LEADERBOARD_KEY, JSON.stringify(this.leaderboard));
            return true;
        } catch (e) {
            error('[SaveManager] 保存排行榜失败:', e);
            return false;
        }
    }

    public getLeaderboard(levelId?: string, limit: number = 100): GameTypes.LeaderboardEntry[] {
        let entries = [...this.leaderboard];
        if (levelId) {
            entries = entries.filter(e => e.levelId === levelId);
        }
        entries.sort((a, b) => b.compositeScore - a.compositeScore);
        entries.forEach((e, i) => e.rank = i + 1);
        return entries.slice(0, limit);
    }

    public submitLeaderboardEntry(entry: Omit<GameTypes.LeaderboardEntry, 'rank'>): void {
        const newEntry: GameTypes.LeaderboardEntry = {
            ...entry,
            rank: 0,
            updatedAt: Date.now()
        };
        this.leaderboard.push(newEntry);
        this.leaderboard.sort((a, b) => b.compositeScore - a.compositeScore);
        this.leaderboard = this.leaderboard.slice(0, 500);
        this.saveLeaderboard();
    }

    public saveReplaySession(replay: GameTypes.ReplaySession): boolean {
        try {
            const key = this.REPLAY_PREFIX + replay.sessionId;
            sys.localStorage.setItem(key, JSON.stringify(replay));
            const indexKey = this.REPLAY_PREFIX + 'INDEX';
            let index: string[] = [];
            const savedIndex = sys.localStorage.getItem(indexKey);
            if (savedIndex) {
                index = JSON.parse(savedIndex);
            }
            if (!index.includes(replay.sessionId)) {
                index.unshift(replay.sessionId);
                index = index.slice(0, 50);
                sys.localStorage.setItem(indexKey, JSON.stringify(index));
            }
            return true;
        } catch (e) {
            error('[SaveManager] 保存回放失败:', e);
            return false;
        }
    }

    public loadReplaySession(sessionId: string): GameTypes.ReplaySession | null {
        try {
            const key = this.REPLAY_PREFIX + sessionId;
            const saved = sys.localStorage.getItem(key);
            if (saved) {
                return JSON.parse(saved) as GameTypes.ReplaySession;
            }
        } catch (e) {
            error('[SaveManager] 加载回放失败:', e);
        }
        return null;
    }

    public getAllReplaySummaries(): Array<{ sessionId: string; levelId: string; totalScore: number; completedAt: number; passed: boolean }> {
        const result: Array<{ sessionId: string; levelId: string; totalScore: number; completedAt: number; passed: boolean }> = [];
        try {
            const indexKey = this.REPLAY_PREFIX + 'INDEX';
            const savedIndex = sys.localStorage.getItem(indexKey);
            if (savedIndex) {
                const index: string[] = JSON.parse(savedIndex);
                index.forEach(sid => {
                    const replay = this.loadReplaySession(sid);
                    if (replay) {
                        result.push({
                            sessionId: replay.sessionId,
                            levelId: replay.levelId,
                            totalScore: replay.totalScore,
                            completedAt: replay.completedAt,
                            passed: replay.passed
                        });
                    }
                });
            }
        } catch (e) {
            error('[SaveManager] 加载回放列表失败:', e);
        }
        return result;
    }

    public resetAllData(): void {
        sys.localStorage.removeItem(this.PROFILE_KEY);
        sys.localStorage.removeItem(this.LEADERBOARD_KEY);
        const indexKey = this.REPLAY_PREFIX + 'INDEX';
        const savedIndex = sys.localStorage.getItem(indexKey);
        if (savedIndex) {
            const index: string[] = JSON.parse(savedIndex);
            index.forEach(sid => sys.localStorage.removeItem(this.REPLAY_PREFIX + sid));
            sys.localStorage.removeItem(indexKey);
        }
        this.profile = null;
        this.leaderboard = [];
        log('[SaveManager] 所有数据已重置');
    }
}
