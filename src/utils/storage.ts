import type { ReplayData, Achievement, Settings, AnalyticsEvent, GameStats } from '@/types';
import { GAME_CONFIG } from '@/config/difficulty';

const STORAGE_KEYS = {
  REPLAYS: 'parking_game_replays',
  ACHIEVEMENTS: 'parking_game_achievements',
  SETTINGS: 'parking_game_settings',
  ANALYTICS: 'parking_game_analytics',
  STATS: 'parking_game_stats',
};

export const loadReplays = (): ReplayData[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.REPLAYS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveReplay = (replay: ReplayData): ReplayData[] => {
  const replays = loadReplays();
  replays.unshift(replay);
  if (replays.length > GAME_CONFIG.maxReplayCount) {
    replays.pop();
  }
  localStorage.setItem(STORAGE_KEYS.REPLAYS, JSON.stringify(replays));
  return replays;
};

export const getReplayById = (id: string): ReplayData | undefined => {
  const replays = loadReplays();
  return replays.find(r => r.id === id);
};

export const deleteReplay = (id: string): ReplayData[] => {
  const replays = loadReplays().filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEYS.REPLAYS, JSON.stringify(replays));
  return replays;
};

export const loadAchievements = (): Achievement[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveAchievements = (achievements: Achievement[]): void => {
  localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
};

export const updateAchievement = (achievementId: string, unlocked: boolean): Achievement | null => {
  const achievements = loadAchievements();
  const achievement = achievements.find(a => a.id === achievementId);
  if (achievement) {
    achievement.isUnlocked = unlocked;
    if (unlocked) {
      achievement.unlockedAt = Date.now();
    }
    saveAchievements(achievements);
    return achievement;
  }
  return null;
};

export const loadSettings = (): Settings => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : {
      soundEnabled: true,
      musicEnabled: true,
      analyticsEnabled: true,
      postProcessingEnabled: true,
    };
  } catch {
    return {
      soundEnabled: true,
      musicEnabled: true,
      analyticsEnabled: true,
      postProcessingEnabled: true,
    };
  }
};

export const saveSettings = (settings: Settings): void => {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
};

export const loadAnalytics = (): AnalyticsEvent[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ANALYTICS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveAnalyticsEvent = (event: AnalyticsEvent): void => {
  const events = loadAnalytics();
  events.push(event);
  if (events.length > 1000) {
    events.shift();
  }
  localStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify(events));
};

export const loadStats = (): GameStats => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.STATS);
    return data ? JSON.parse(data) : {
      totalGames: 0,
      wins: 0,
      bestScore: 0,
      bestTime: Infinity,
      currentStreak: 0,
      bestStreak: 0,
      totalEmergenciesHandled: 0,
      totalPlayTime: 0,
    };
  } catch {
    return {
      totalGames: 0,
      wins: 0,
      bestScore: 0,
      bestTime: Infinity,
      currentStreak: 0,
      bestStreak: 0,
      totalEmergenciesHandled: 0,
      totalPlayTime: 0,
    };
  }
};

export const saveStats = (stats: GameStats): void => {
  localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
};

export const updateStats = (updates: Partial<GameStats>): GameStats => {
  const stats = loadStats();
  const newStats = { ...stats, ...updates };
  localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(newStats));
  return newStats;
};

export const clearAllData = (): void => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};
