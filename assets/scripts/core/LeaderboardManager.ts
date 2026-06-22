import { _decorator, Component, sys } from 'cc';
import { ILeaderboardEntry, ITrainingRecord } from './GameInterfaces';
const { ccclass, property } = _decorator;

@ccclass('LeaderboardManager')
export class LeaderboardManager extends Component {

    private static _instance: LeaderboardManager | null = null;

    public static get instance(): LeaderboardManager {
        if (!LeaderboardManager._instance) {
            LeaderboardManager._instance = new LeaderboardManager();
        }
        return LeaderboardManager._instance;
    }

    private static readonly LEADERBOARD_KEY = 'legal_game_leaderboard_v1';
    private static readonly MAX_ENTRIES = 100;

    private _entries: ILeaderboardEntry[] = [];

    constructor() {
        super();
        this.loadLeaderboard();
    }

    private loadLeaderboard(): void {
        try {
            const data = sys.localStorage.getItem(LeaderboardManager.LEADERBOARD_KEY);
            if (data) {
                this._entries = JSON.parse(data);
                this.sortEntries();
            }
        } catch (e) {
            console.error('[LeaderboardManager] Failed to load leaderboard:', e);
            this._entries = [];
        }
    }

    private saveLeaderboard(): void {
        try {
            sys.localStorage.setItem(
                LeaderboardManager.LEADERBOARD_KEY,
                JSON.stringify(this._entries)
            );
        } catch (e) {
            console.error('[LeaderboardManager] Failed to save leaderboard:', e);
        }
    }

    private sortEntries(): void {
        this._entries.sort((a, b) => {
            if (b.totalScore !== a.totalScore) {
                return b.totalScore - a.totalScore;
            }
            if (b.perfectCases !== a.perfectCases) {
                return b.perfectCases - a.perfectCases;
            }
            return b.casesCompleted - a.casesCompleted;
        });

        this._entries.forEach((entry, index) => {
            entry.rank = index + 1;
        });

        if (this._entries.length > LeaderboardManager.MAX_ENTRIES) {
            this._entries = this._entries.slice(0, LeaderboardManager.MAX_ENTRIES);
        }
    }

    public submitScore(playerId: string, playerName: string, 
                       totalScore: number, casesCompleted: number, 
                       perfectCases: number): number {
        let entry = this._entries.find(e => e.playerId === playerId);
        
        if (entry) {
            entry.playerName = playerName;
            entry.totalScore = Math.max(entry.totalScore, totalScore);
            entry.casesCompleted = Math.max(entry.casesCompleted, casesCompleted);
            entry.perfectCases = Math.max(entry.perfectCases, perfectCases);
            entry.updateTime = Date.now();
        } else {
            entry = {
                playerId,
                playerName,
                totalScore,
                casesCompleted,
                perfectCases,
                rank: 0,
                updateTime: Date.now()
            };
            this._entries.push(entry);
        }

        this.sortEntries();
        this.saveLeaderboard();

        return entry.rank;
    }

    public getTopEntries(count: number = 10): ILeaderboardEntry[] {
        return this._entries.slice(0, count);
    }

    public getPlayerRank(playerId: string): ILeaderboardEntry | null {
        return this._entries.find(e => e.playerId === playerId) || null;
    }

    public getAllEntries(): ILeaderboardEntry[] {
        return [...this._entries];
    }

    public clearLeaderboard(): void {
        this._entries = [];
        this.saveLeaderboard();
        console.log('[LeaderboardManager] Leaderboard cleared');
    }

    public getTotalPlayers(): number {
        return this._entries.length;
    }
}
