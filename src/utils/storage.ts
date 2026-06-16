import { STORAGE_KEYS, TUTORIAL_CONFIG } from '../config/gameConfig';

interface LevelProgress {
  stars: number;
  bestScore: number;
  completed: boolean;
}

interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  tutorialCompleted: boolean;
}

const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  musicEnabled: true,
  tutorialCompleted: false,
};

export function saveLevelProgress(levelId: string, progress: LevelProgress): void {
  try {
    const allProgress = getLevelProgress();
    allProgress[levelId] = progress;
    localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(allProgress));
  } catch (e) {
    console.error('Failed to save level progress:', e);
  }
}

export function getLevelProgress(): Record<string, LevelProgress> {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.progress);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    console.error('Failed to get level progress:', e);
    return {};
  }
}

export function getLevelProgressById(levelId: string): LevelProgress | null {
  const allProgress = getLevelProgress();
  return allProgress[levelId] || null;
}

export function saveSettings(settings: Partial<GameSettings>): void {
  try {
    const current = getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function getSettings(): GameSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.settings);
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : { ...DEFAULT_SETTINGS };
  } catch (e) {
    console.error('Failed to get settings:', e);
    return { ...DEFAULT_SETTINGS };
  }
}

export function isTutorialCompleted(): boolean {
  try {
    return localStorage.getItem(TUTORIAL_CONFIG.storageKey) === 'true';
  } catch {
    return false;
  }
}

export function markTutorialCompleted(): void {
  try {
    localStorage.setItem(TUTORIAL_CONFIG.storageKey, 'true');
  } catch (e) {
    console.error('Failed to mark tutorial completed:', e);
  }
}

export function resetAllProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.progress);
    localStorage.removeItem(STORAGE_KEYS.highScores);
    localStorage.removeItem(TUTORIAL_CONFIG.storageKey);
  } catch (e) {
    console.error('Failed to reset progress:', e);
  }
}
