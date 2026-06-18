import { StorageManager } from '../utils/StorageManager';

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  levelId: string;
  score: number;
  stars: number;
  time: number;
  timestamp: number;
}

export class LeaderboardManager {
  private static _instance: LeaderboardManager | null = null;
  private _entries: LeaderboardEntry[] = [];
  private _playerName: string = '玩家';
  private _inited = false;

  public static get instance(): LeaderboardManager {
    if (!this._instance) {
      this._instance = new LeaderboardManager();
    }
    return this._instance;
  }

  public get playerName(): string {
    return this._playerName;
  }

  public init(): void {
    if (this._inited) return;
    this._inited = true;

    this._entries = StorageManager.instance.load<LeaderboardEntry[]>('leaderboard', []);
    this._playerName = StorageManager.instance.load<string>('player_name', '玩家');
  }

  public setPlayerName(name: string): void {
    this._playerName = name;
    StorageManager.instance.save('player_name', name);
  }

  public addScore(levelId: string, score: number, stars: number, time: number): LeaderboardEntry {
    const entry: LeaderboardEntry = {
      id: `lb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      playerName: this._playerName,
      levelId,
      score,
      stars,
      time,
      timestamp: Date.now(),
    };

    this._entries.push(entry);
    this.save();

    return entry;
  }

  public getLevelLeaderboard(levelId: string, limit: number = 10): LeaderboardEntry[] {
    const levelEntries = this._entries
      .filter(e => e.levelId === levelId)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.time - b.time;
      });

    return levelEntries.slice(0, limit);
  }

  public getPlayerRankByScore(levelId: string, score: number, time: number): number {
    const levelEntries = this._entries.filter(e => e.levelId === levelId);
    let rank = 1;
    for (const entry of levelEntries) {
      if (entry.score > score || (entry.score === score && entry.time < time)) {
        rank++;
      }
    }
    return rank;
  }

  public getGlobalLeaderboard(limit: number = 10): LeaderboardEntry[] {
    const playerTotals = new Map<string, { totalScore: number; totalStars: number; entries: number }>();

    for (const entry of this._entries) {
      const existing = playerTotals.get(entry.playerName);
      if (!existing) {
        playerTotals.set(entry.playerName, {
          totalScore: entry.score,
          totalStars: entry.stars,
          entries: 1,
        });
      } else {
        existing.totalScore += entry.score;
        existing.totalStars += entry.stars;
        existing.entries++;
      }
    }

    const sorted = Array.from(playerTotals.entries())
      .sort((a, b) => {
        if (b[1].totalScore !== a[1].totalScore) return b[1].totalScore - a[1].totalScore;
        return b[1].totalStars - a[1].totalStars;
      })
      .slice(0, limit)
      .map(([name, data], index) => ({
        id: `global_${index}`,
        playerName: name,
        levelId: 'global',
        score: data.totalScore,
        stars: data.totalStars,
        time: 0,
        timestamp: 0,
      }));

    return sorted;
  }

  public clearLevelLeaderboard(levelId: string): void {
    this._entries = this._entries.filter(e => e.levelId !== levelId);
    this.save();
  }

  public clearAll(): void {
    this._entries = [];
    this.save();
  }

  public getPlayerRank(playerName: string, levelId: string): number {
    const levelEntries = this._entries
      .filter(e => e.levelId === levelId && e.playerName === playerName)
      .sort((a, b) => b.score - a.score);

    if (levelEntries.length === 0) return 0;

    const bestScore = levelEntries[0].score;
    const allEntries = this._entries
      .filter(e => e.levelId === levelId)
      .sort((a, b) => b.score - a.score);

    return allEntries.findIndex(e => e.score <= bestScore) + 1;
  }

  public getPlayerBestScore(playerName: string, levelId: string): number {
    const levelEntries = this._entries
      .filter(e => e.levelId === levelId && e.playerName === playerName)
      .sort((a, b) => b.score - a.score);

    return levelEntries.length > 0 ? levelEntries[0].score : 0;
  }

  private save(): void {
    StorageManager.instance.save('leaderboard', this._entries.slice(-500));
  }
}
