import type { LevelProgress } from '../models';
import { GameMode, PostType } from '../models/GameEnums';

const STORAGE_KEY = 'scenic_ticket_training_progress';
const TUTORIAL_KEY = 'scenic_ticket_training_tutorial';

export class GameSaveManager {
    private static instance: GameSaveManager | null = null;

    private levelProgressMap: Map<string, LevelProgress> = new Map();
    private tutorialCompleted: boolean = false;

    public static getInstance(): GameSaveManager {
        if (!GameSaveManager.instance) {
            GameSaveManager.instance = new GameSaveManager();
        }
        return GameSaveManager.instance;
    }

    private constructor() {
        this.loadProgress();
    }

    public loadProgress(): void {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                if (data.levels && Array.isArray(data.levels)) {
                    for (const level of data.levels) {
                        this.levelProgressMap.set(level.levelId, level);
                    }
                }
            }

            const tutorialSaved = localStorage.getItem(TUTORIAL_KEY);
            this.tutorialCompleted = tutorialSaved === 'true';
        } catch (e) {
            console.error('Failed to load game progress:', e);
        }
    }

    public saveProgress(): void {
        try {
            const levels = Array.from(this.levelProgressMap.values());
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ levels }));
            localStorage.setItem(TUTORIAL_KEY, this.tutorialCompleted.toString());
        } catch (e) {
            console.error('Failed to save game progress:', e);
        }
    }

    public getLevelProgress(levelId: string): LevelProgress {
        if (!this.levelProgressMap.has(levelId)) {
            return {
                levelId,
                unlocked: this.isFirstLevel(levelId),
                bestScore: 0,
                bestTime: 0,
                stars: 0,
                completed: false
            };
        }
        return this.levelProgressMap.get(levelId)!;
    }

    public updateLevelProgress(
        levelId: string,
        score: number,
        time: number,
        stars: number,
        passed: boolean
    ): void {
        const current = this.getLevelProgress(levelId);

        if (score > current.bestScore) {
            current.bestScore = score;
        }
        if (current.bestTime === 0 || time < current.bestTime) {
            current.bestTime = time;
        }
        if (stars > current.stars) {
            current.stars = stars;
        }
        if (passed) {
            current.completed = true;
        }

        current.unlocked = true;
        this.levelProgressMap.set(levelId, current);
        this.saveProgress();
    }

    public unlockNextLevel(currentLevelId: string, allLevelIds: string[]): void {
        const currentIndex = allLevelIds.indexOf(currentLevelId);
        if (currentIndex >= 0 && currentIndex < allLevelIds.length - 1) {
            const nextLevelId = allLevelIds[currentIndex + 1];
            const nextProgress = this.getLevelProgress(nextLevelId);
            nextProgress.unlocked = true;
            this.levelProgressMap.set(nextLevelId, nextProgress);
            this.saveProgress();
        }
    }

    public isFirstLevel(levelId: string): boolean {
        const firstLevels = [
            'formal_ticket_checker_01',
            'formal_reservation_01',
            'free_practice_01',
            'challenge_time_conflict_01'
        ];
        return firstLevels.includes(levelId);
    }

    public isTutorialCompleted(): boolean {
        return this.tutorialCompleted;
    }

    public setTutorialCompleted(completed: boolean): void {
        this.tutorialCompleted = completed;
        localStorage.setItem(TUTORIAL_KEY, completed.toString());
    }

    public resetAllProgress(): void {
        this.levelProgressMap.clear();
        this.tutorialCompleted = false;
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(TUTORIAL_KEY);
    }

    public getTotalStars(): number {
        let total = 0;
        for (const progress of this.levelProgressMap.values()) {
            total += progress.stars;
        }
        return total;
    }

    public getCompletedLevelsCount(): number {
        let count = 0;
        for (const progress of this.levelProgressMap.values()) {
            if (progress.completed) count++;
        }
        return count;
    }
}
