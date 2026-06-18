import type { LeaderboardEntry, Rating, TrainingRecord } from '../models';

const STORAGE_KEY = 'renovation_game_leaderboard_v1';
const MAX_ENTRIES_PER_LEVEL = 100;
const MAX_GLOBAL_ENTRIES = 500;

export interface LeaderboardQuery {
  levelId?: string;
  limit?: number;
  offset?: number;
  minScore?: number;
  maxScore?: number;
  minRating?: Rating;
  playerName?: string;
  sortBy?: 'score' | 'timestamp' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

export interface LeaderboardStats {
  totalEntries: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  scoreDistribution: Record<Rating, number>;
  topPlayer: string | null;
}

export interface PlayerRank {
  rank: number;
  total: number;
  percentile: number;
  entry: LeaderboardEntry;
}

export class Leaderboard {
  private static instance: Leaderboard | null = null;
  private entries: Map<string, LeaderboardEntry> = new Map();
  private levelIndex: Map<string, string[]> = new Map();
  private loaded = false;

  static getInstance(): Leaderboard {
    if (!Leaderboard.instance) {
      Leaderboard.instance = new Leaderboard();
    }
    return Leaderboard.instance;
  }

  private constructor() {}

  load(): void {
    if (this.loaded) return;
    
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const entries: LeaderboardEntry[] = JSON.parse(data);
        for (const entry of entries) {
          this.entries.set(entry.id, entry);
          this.indexEntry(entry);
        }
      }
      this.loaded = true;
    } catch (error) {
      console.error('[Leaderboard] Failed to load:', error);
      this.loaded = true;
    }
  }

  addEntry(entry: Omit<LeaderboardEntry, 'id' | 'timestamp'>): LeaderboardEntry {
    this.ensureLoaded();
    
    const newEntry: LeaderboardEntry = {
      ...entry,
      id: this.generateId(),
      timestamp: Date.now(),
    };
    
    this.entries.set(newEntry.id, newEntry);
    this.indexEntry(newEntry);
    this.save();
    this.trimExcessEntries(newEntry.levelId);
    
    return newEntry;
  }

  addEntryFromRecord(record: TrainingRecord): LeaderboardEntry {
    return this.addEntry({
      playerName: record.playerName,
      levelId: record.levelId,
      score: record.score,
      rating: record.rating,
    });
  }

  getEntry(id: string): LeaderboardEntry | null {
    this.ensureLoaded();
    return this.entries.get(id) || null;
  }

  getEntries(query: LeaderboardQuery = {}): LeaderboardEntry[] {
    this.ensureLoaded();
    
    let entries = Array.from(this.entries.values());
    
    if (query.levelId) {
      entries = entries.filter(e => e.levelId === query.levelId);
    }
    
    if (query.minScore !== undefined) {
      entries = entries.filter(e => e.score >= query.minScore!);
    }
    
    if (query.maxScore !== undefined) {
      entries = entries.filter(e => e.score <= query.maxScore!);
    }
    
    if (query.minRating) {
      const ratingOrder: Rating[] = ['S', 'A', 'B', 'C', 'D'];
      const minIndex = ratingOrder.indexOf(query.minRating);
      entries = entries.filter(e => ratingOrder.indexOf(e.rating) <= minIndex);
    }
    
    if (query.playerName) {
      entries = entries.filter(e => 
        e.playerName.toLowerCase().includes(query.playerName!.toLowerCase())
      );
    }
    
    const sortBy = query.sortBy || 'score';
    const sortOrder = query.sortOrder || 'desc';
    
    entries.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'score':
          comparison = a.score - b.score;
          break;
        case 'timestamp':
          comparison = a.timestamp - b.timestamp;
          break;
        case 'rating':
          const ratingOrder: Rating[] = ['S', 'A', 'B', 'C', 'D'];
          comparison = ratingOrder.indexOf(a.rating) - ratingOrder.indexOf(b.rating);
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    const offset = query.offset || 0;
    const limit = query.limit || entries.length;
    
    return entries.slice(offset, offset + limit);
  }

  getTopEntries(levelId?: string, limit: number = 10): LeaderboardEntry[] {
    return this.getEntries({
      levelId,
      limit,
      sortBy: 'score',
      sortOrder: 'desc',
    });
  }

  getPlayerRank(entryId: string, levelId?: string): PlayerRank | null {
    const entry = this.getEntry(entryId);
    if (!entry) return null;
    
    const allEntries = this.getEntries({
      levelId: levelId || entry.levelId,
      sortBy: 'score',
      sortOrder: 'desc',
    });
    
    const rank = allEntries.findIndex(e => e.id === entryId) + 1;
    
    if (rank === 0) return null;
    
    return {
      rank,
      total: allEntries.length,
      percentile: ((allEntries.length - rank + 1) / allEntries.length) * 100,
      entry,
    };
  }

  getPlayerBest(playerName: string, levelId?: string): LeaderboardEntry | null {
    const entries = this.getEntries({
      levelId,
      playerName,
      sortBy: 'score',
      sortOrder: 'desc',
      limit: 1,
    });
    
    return entries[0] || null;
  }

  getPlayerHistory(playerName: string, levelId?: string): LeaderboardEntry[] {
    return this.getEntries({
      levelId,
      playerName,
      sortBy: 'timestamp',
      sortOrder: 'desc',
    });
  }

  getStats(levelId?: string): LeaderboardStats {
    const entries = levelId 
      ? this.getEntries({ levelId })
      : this.getEntries();
    
    const stats: LeaderboardStats = {
      totalEntries: entries.length,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      scoreDistribution: { S: 0, A: 0, B: 0, C: 0, D: 0 },
      topPlayer: null,
    };
    
    if (entries.length === 0) return stats;
    
    const scores = entries.map(e => e.score);
    stats.averageScore = scores.reduce((a, b) => a + b, 0) / entries.length;
    stats.highestScore = Math.max(...scores);
    stats.lowestScore = Math.min(...scores);
    
    for (const entry of entries) {
      stats.scoreDistribution[entry.rating]++;
    }
    
    const topEntry = this.getTopEntries(levelId, 1)[0];
    stats.topPlayer = topEntry?.playerName || null;
    
    return stats;
  }

  deleteEntry(id: string): boolean {
    this.ensureLoaded();
    
    const entry = this.entries.get(id);
    if (!entry) return false;
    
    this.entries.delete(id);
    this.removeFromIndex(entry);
    this.save();
    
    return true;
  }

  deletePlayerEntries(playerName: string): number {
    this.ensureLoaded();
    
    const playerEntries = this.getEntries({ playerName });
    for (const entry of playerEntries) {
      this.entries.delete(entry.id);
      this.removeFromIndex(entry);
    }
    
    this.save();
    return playerEntries.length;
  }

  clear(levelId?: string): number {
    this.ensureLoaded();
    
    let deletedCount = 0;
    
    if (levelId) {
      const levelEntries = this.getEntries({ levelId });
      for (const entry of levelEntries) {
        this.entries.delete(entry.id);
        this.removeFromIndex(entry);
        deletedCount++;
      }
    } else {
      deletedCount = this.entries.size;
      this.entries.clear();
      this.levelIndex.clear();
    }
    
    this.save();
    return deletedCount;
  }

  getLevels(): string[] {
    this.ensureLoaded();
    return Array.from(this.levelIndex.keys());
  }

  hasEntry(levelId: string, playerName: string): boolean {
    const entries = this.getEntries({ levelId, playerName, limit: 1 });
    return entries.length > 0;
  }

  exportData(): string {
    this.ensureLoaded();
    return JSON.stringify(Array.from(this.entries.values()), null, 2);
  }

  importData(jsonString: string, merge: boolean = true): number {
    try {
      const importedEntries: LeaderboardEntry[] = JSON.parse(jsonString);
      
      if (!Array.isArray(importedEntries)) {
        throw new Error('Invalid data format');
      }
      
      if (!merge) {
        this.entries.clear();
        this.levelIndex.clear();
      }
      
      let importedCount = 0;
      for (const entry of importedEntries) {
        if (this.validateEntry(entry)) {
          const id = merge && this.entries.has(entry.id) 
            ? this.generateId() 
            : entry.id;
          
          const finalEntry = { ...entry, id };
          this.entries.set(id, finalEntry);
          this.indexEntry(finalEntry);
          importedCount++;
        }
      }
      
      this.save();
      return importedCount;
    } catch (error) {
      console.error('[Leaderboard] Failed to import data:', error);
      return 0;
    }
  }

  private ensureLoaded(): void {
    if (!this.loaded) {
      this.load();
    }
  }

  private indexEntry(entry: LeaderboardEntry): void {
    if (!this.levelIndex.has(entry.levelId)) {
      this.levelIndex.set(entry.levelId, []);
    }
    this.levelIndex.get(entry.levelId)!.push(entry.id);
  }

  private removeFromIndex(entry: LeaderboardEntry): void {
    const levelEntries = this.levelIndex.get(entry.levelId);
    if (levelEntries) {
      const index = levelEntries.indexOf(entry.id);
      if (index > -1) {
        levelEntries.splice(index, 1);
      }
      if (levelEntries.length === 0) {
        this.levelIndex.delete(entry.levelId);
      }
    }
  }

  private save(): void {
    try {
      const entries = Array.from(this.entries.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('[Leaderboard] Failed to save:', error);
    }
  }

  private trimExcessEntries(levelId: string): void {
    const levelEntries = this.getEntries({
      levelId,
      sortBy: 'score',
      sortOrder: 'desc',
    });
    
    if (levelEntries.length > MAX_ENTRIES_PER_LEVEL) {
      const toDelete = levelEntries.slice(MAX_ENTRIES_PER_LEVEL);
      for (const entry of toDelete) {
        this.entries.delete(entry.id);
        this.removeFromIndex(entry);
      }
      this.save();
    }
    
    if (this.entries.size > MAX_GLOBAL_ENTRIES) {
      const allEntries = this.getEntries({
        sortBy: 'timestamp',
        sortOrder: 'asc',
      });
      const toDelete = allEntries.slice(0, this.entries.size - MAX_GLOBAL_ENTRIES);
      for (const entry of toDelete) {
        this.entries.delete(entry.id);
        this.removeFromIndex(entry);
      }
      this.save();
    }
  }

  private validateEntry(entry: unknown): entry is LeaderboardEntry {
    if (typeof entry !== 'object' || entry === null) return false;
    
    const e = entry as Record<string, unknown>;
    return (
      typeof e.id === 'string' &&
      typeof e.playerName === 'string' &&
      typeof e.levelId === 'string' &&
      typeof e.score === 'number' &&
      typeof e.rating === 'string' &&
      ['S', 'A', 'B', 'C', 'D'].includes(e.rating as string) &&
      typeof e.timestamp === 'number'
    );
  }

  private generateId(): string {
    return `lb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const leaderboard = Leaderboard.getInstance();
