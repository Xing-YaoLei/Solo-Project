import type { LevelResult } from '@/config/types';

const STORAGE_KEY = 'scenic_perf_scheduler_results';

export class ResultStore {
  private _results: LevelResult[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) this._results = JSON.parse(raw) as LevelResult[];
    } catch {
      this._results = [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._results));
    } catch {}
  }

  addResult(result: LevelResult): void {
    const existing = this._results.findIndex(r => r.levelId === result.levelId);
    if (existing >= 0) {
      if (result.score > this._results[existing].score) {
        this._results[existing] = result;
      }
    } else {
      this._results.push(result);
    }
    this.saveToStorage();
  }

  getResultsByLevel(levelId: string): LevelResult[] {
    return this._results.filter(r => r.levelId === levelId);
  }

  getBestResult(levelId: string): LevelResult | null {
    const results = this.getResultsByLevel(levelId);
    if (results.length === 0) return null;
    return results.reduce((best, r) => r.score > best.score ? r : best, results[0]);
  }

  getAllResults(): LevelResult[] {
    return [...this._results];
  }

  getEfficiencyComparison(): { levelId: string; efficiency: number; score: number }[] {
    return this._results.map(r => ({
      levelId: r.levelId,
      efficiency: r.verificationEfficiency,
      score: r.score,
    }));
  }

  clearAll(): void {
    this._results = [];
    this.saveToStorage();
  }
}
