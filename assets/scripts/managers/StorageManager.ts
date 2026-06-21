import { _decorator, Component, sys } from 'cc';
import { ReplayRecord, Statistics, WrongStep } from '../types/GameTypes';

const { ccclass } = _decorator;

@ccclass('StorageManager')
export class StorageManager extends Component {
    private static instance: StorageManager;
    private readonly STORAGE_KEYS = {
        REPLAY_RECORDS: 'delivery_training_replays',
        STATISTICS: 'delivery_training_stats',
        SETTINGS: 'delivery_training_settings',
    };
    private readonly MAX_REPLAYS = 10;

    static getInstance(): StorageManager {
        if (!StorageManager.instance) {
            StorageManager.instance = new StorageManager();
        }
        return StorageManager.instance;
    }

    saveReplayRecord(record: ReplayRecord): boolean {
        try {
            const replays = this.getReplayRecords();

            const trimmedRecord = {
                ...record,
                gameStateSnapshots: record.gameStateSnapshots.map(snap => ({
                    time: snap.time,
                    score: snap.score,
                    totalCompensation: snap.totalCompensation,
                })),
            };

            replays.unshift(trimmedRecord as ReplayRecord);

            if (replays.length > this.MAX_REPLAYS) {
                replays.length = this.MAX_REPLAYS;
            }

            sys.localStorage.setItem(
                this.STORAGE_KEYS.REPLAY_RECORDS,
                JSON.stringify(replays)
            );

            return true;
        } catch (error) {
            console.error('Failed to save replay record:', error);
            return false;
        }
    }

    getReplayRecords(): ReplayRecord[] {
        try {
            const data = sys.localStorage.getItem(this.STORAGE_KEYS.REPLAY_RECORDS);
            if (data) {
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Failed to load replay records:', error);
        }
        return [];
    }

    getRecentFailures(limit: number = 5): ReplayRecord[] {
        const replays = this.getReplayRecords();
        return replays
            .filter(r => !r.isVictory)
            .slice(0, limit);
    }

    deleteReplayRecord(recordId: string): boolean {
        try {
            const replays = this.getReplayRecords();
            const filtered = replays.filter(r => r.id !== recordId);

            sys.localStorage.setItem(
                this.STORAGE_KEYS.REPLAY_RECORDS,
                JSON.stringify(filtered)
            );

            return true;
        } catch (error) {
            console.error('Failed to delete replay record:', error);
            return false;
        }
    }

    clearAllReplays(): boolean {
        try {
            sys.localStorage.removeItem(this.STORAGE_KEYS.REPLAY_RECORDS);
            return true;
        } catch (error) {
            console.error('Failed to clear replays:', error);
            return false;
        }
    }

    updateStatistics(gameResult: {
        isVictory: boolean;
        score: number;
        ordersProcessed: number;
        compensation: number;
        wrongSteps: WrongStep[];
        subsidyStats: Record<string, { used: number; saved: number }>;
        riderStats: Record<string, { orders: number; rejections: number }>;
    }): boolean {
        try {
            const stats = this.getStatistics();

            stats.totalGames++;
            if (gameResult.isVictory) {
                stats.totalVictories++;
            }
            stats.totalOrdersProcessed += gameResult.ordersProcessed;
            stats.totalCompensationPaid += gameResult.compensation;
            stats.avgScore = Math.round(
                (stats.avgScore * (stats.totalGames - 1) + gameResult.score) / stats.totalGames
            );

            gameResult.wrongSteps.forEach(step => {
                if (!stats.wrongStepStats[step.type]) {
                    stats.wrongStepStats[step.type] = 0;
                }
                stats.wrongStepStats[step.type]++;
            });

            Object.entries(gameResult.subsidyStats).forEach(([id, data]) => {
                if (!stats.subsidyEffectiveness[id]) {
                    stats.subsidyEffectiveness[id] = { used: 0, saved: 0 };
                }
                stats.subsidyEffectiveness[id].used += data.used;
                stats.subsidyEffectiveness[id].saved += data.saved;
            });

            Object.entries(gameResult.riderStats).forEach(([id, data]) => {
                if (!stats.riderPerformance[id]) {
                    stats.riderPerformance[id] = { orders: 0, rejections: 0 };
                }
                stats.riderPerformance[id].orders += data.orders;
                stats.riderPerformance[id].rejections += data.rejections;
            });

            sys.localStorage.setItem(
                this.STORAGE_KEYS.STATISTICS,
                JSON.stringify(stats)
            );

            return true;
        } catch (error) {
            console.error('Failed to update statistics:', error);
            return false;
        }
    }

    getStatistics(): Statistics {
        try {
            const data = sys.localStorage.getItem(this.STORAGE_KEYS.STATISTICS);
            if (data) {
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Failed to load statistics:', error);
        }

        return {
            totalGames: 0,
            totalVictories: 0,
            totalOrdersProcessed: 0,
            totalCompensationPaid: 0,
            avgScore: 0,
            wrongStepStats: {},
            subsidyEffectiveness: {},
            riderPerformance: {},
        };
    }

    clearStatistics(): boolean {
        try {
            sys.localStorage.removeItem(this.STORAGE_KEYS.STATISTICS);
            return true;
        } catch (error) {
            console.error('Failed to clear statistics:', error);
            return false;
        }
    }

    saveSettings(settings: Record<string, any>): boolean {
        try {
            sys.localStorage.setItem(
                this.STORAGE_KEYS.SETTINGS,
                JSON.stringify(settings)
            );
            return true;
        } catch (error) {
            console.error('Failed to save settings:', error);
            return false;
        }
    }

    getSettings(): Record<string, any> {
        try {
            const data = sys.localStorage.getItem(this.STORAGE_KEYS.SETTINGS);
            if (data) {
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
        return {
            soundEnabled: true,
            musicEnabled: true,
            vibrationEnabled: true,
            tutorialCompleted: false,
        };
    }

    getCompensationStats(): {
        total: number;
        byType: Record<string, number>;
        byLevel: Record<number, number>;
        avgPerGame: number;
    } {
        const stats = this.getStatistics();
        const replays = this.getReplayRecords();

        const byLevel: Record<number, number> = {};
        replays.forEach(r => {
            if (!byLevel[r.levelId]) {
                byLevel[r.levelId] = 0;
            }
            byLevel[r.levelId] += r.totalCompensation;
        });

        return {
            total: stats.totalCompensationPaid,
            byType: stats.wrongStepStats,
            byLevel,
            avgPerGame: stats.totalGames > 0 ?
                Math.round(stats.totalCompensationPaid / stats.totalGames) : 0,
        };
    }

    getPerformanceInsights(): Array<{
        area: string;
        problem: string;
        suggestion: string;
        frequency: number;
    }> {
        const stats = this.getStatistics();
        const insights: Array<{
            area: string;
            problem: string;
            suggestion: string;
            frequency: number;
        }> = [];

        const wrongStepTypes = [
            { type: 'address', area: '地址处理', problem: '地址选择错误', suggestion: '仔细核对订单地址，使用搜索功能快速定位' },
            { type: 'rider', area: '骑手调度', problem: '骑手拒单频繁', suggestion: '关注拒单预警，提前调整补贴策略' },
            { type: 'subsidy', area: '补贴应用', problem: '补贴使用不当', suggestion: '熟悉补贴规则，在合适的时机应用' },
            { type: 'timing', area: '时间管理', problem: '订单超时', suggestion: '优先处理加急订单，合理分配骑手' },
        ];

        wrongStepTypes.forEach(({ type, area, problem, suggestion }) => {
            const count = stats.wrongStepStats[type] || 0;
            if (count > 0) {
                insights.push({
                    area,
                    problem,
                    suggestion,
                    frequency: count,
                });
            }
        });

        insights.sort((a, b) => b.frequency - a.frequency);

        return insights;
    }
}
