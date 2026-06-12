const STORAGE_KEYS = {
  PLAYER: 'coffee_game_player',
  SAVE: 'coffee_game_save',
  RECORDS: 'coffee_game_records',
  REPLAYS: 'coffee_game_replays',
  LEADERBOARD: 'coffee_game_leaderboard',
  UNLOCKED_LEVELS: 'coffee_game_unlocked',
  TUTORIAL_COMPLETED: 'coffee_game_tutorial',
} as const;

export function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to storage:', error);
  }
}

export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Failed to load from storage:', error);
    return defaultValue;
  }
}

export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove from storage:', error);
  }
}

export const storage = {
  savePlayer: (data: unknown) => saveToStorage(STORAGE_KEYS.PLAYER, data),
  loadPlayer: <T>(defaultValue: T) => loadFromStorage<T>(STORAGE_KEYS.PLAYER, defaultValue),
  saveSave: (data: unknown) => saveToStorage(STORAGE_KEYS.SAVE, data),
  loadSave: <T>(defaultValue: T) => loadFromStorage<T>(STORAGE_KEYS.SAVE, defaultValue),
  saveRecords: (data: unknown) => saveToStorage(STORAGE_KEYS.RECORDS, data),
  loadRecords: <T>(defaultValue: T) => loadFromStorage<T>(STORAGE_KEYS.RECORDS, defaultValue),
  saveReplays: (data: unknown) => saveToStorage(STORAGE_KEYS.REPLAYS, data),
  loadReplays: <T>(defaultValue: T) => loadFromStorage<T>(STORAGE_KEYS.REPLAYS, defaultValue),
  saveLeaderboard: (data: unknown) => saveToStorage(STORAGE_KEYS.LEADERBOARD, data),
  loadLeaderboard: <T>(defaultValue: T) => loadFromStorage<T>(STORAGE_KEYS.LEADERBOARD, defaultValue),
  saveUnlockedLevels: (data: unknown) => saveToStorage(STORAGE_KEYS.UNLOCKED_LEVELS, data),
  loadUnlockedLevels: <T>(defaultValue: T) => loadFromStorage<T>(STORAGE_KEYS.UNLOCKED_LEVELS, defaultValue),
  saveTutorialCompleted: (completed: boolean) => saveToStorage(STORAGE_KEYS.TUTORIAL_COMPLETED, completed),
  loadTutorialCompleted: () => loadFromStorage<boolean>(STORAGE_KEYS.TUTORIAL_COMPLETED, false),
  removeFromStorage: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove from storage:', error);
    }
  },
};
