const PREFIX = 'property-game-';

export const storage = {
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(PREFIX + key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
    }
  },

  clear(): void {
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  },
};

export interface GameProgress {
  levelId: string;
  bestScore: number;
  bestTime: number;
  completed: boolean;
  stars: number;
  attempts: number;
}

export const progressStorage = {
  getAll(): Record<string, GameProgress> {
    return storage.get<Record<string, GameProgress>>('progress') ?? {};
  },

  get(levelId: string): GameProgress | null {
    const all = this.getAll();
    return all[levelId] ?? null;
  },

  save(levelId: string, progress: Omit<GameProgress, 'levelId'>): void {
    const all = this.getAll();
    all[levelId] = { levelId, ...progress };
    storage.set('progress', all);
  },

  updateScore(levelId: string, score: number, time: number): void {
    const existing = this.get(levelId);
    const stars = calculateStars(score);
    
    if (!existing) {
      this.save(levelId, {
        bestScore: score,
        bestTime: time,
        completed: true,
        stars,
        attempts: 1,
      });
    } else {
      this.save(levelId, {
        bestScore: Math.max(existing.bestScore, score),
        bestTime: Math.min(existing.bestTime, time),
        completed: true,
        stars: Math.max(existing.stars, stars),
        attempts: existing.attempts + 1,
      });
    }
  },

  isCompleted(levelId: string): boolean {
    return this.get(levelId)?.completed ?? false;
  },

  getBestScore(levelId: string): number {
    return this.get(levelId)?.bestScore ?? 0;
  },

  saveProgress(levelId: string, score: number, time: number): void {
    this.updateScore(levelId, score, time);
  },
};

function calculateStars(score: number): number {
  if (score >= 90) return 3;
  if (score >= 70) return 2;
  if (score >= 50) return 1;
  return 0;
}
