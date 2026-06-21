const KEY_PREFIX = 'paotui';

const buildKey = (namespace: string, key: string): string => {
  return `${KEY_PREFIX}:${namespace}:${key}`;
};

export const storage = {
  get<T>(namespace: string, key: string, defaultValue: T): T {
    try {
      const raw = localStorage.getItem(buildKey(namespace, key));
      if (raw === null) return defaultValue;
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  },

  set<T>(namespace: string, key: string, value: T): void {
    try {
      localStorage.setItem(buildKey(namespace, key), JSON.stringify(value));
    } catch (e) {
      console.warn('Storage write failed:', e);
    }
  },

  remove(namespace: string, key: string): void {
    localStorage.removeItem(buildKey(namespace, key));
  },

  listKeys(namespace: string): string[] {
    const prefix = `${KEY_PREFIX}:${namespace}:`;
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const fullKey = localStorage.key(i);
      if (fullKey && fullKey.startsWith(prefix)) {
        keys.push(fullKey.slice(prefix.length));
      }
    }
    return keys;
  },

  clearNamespace(namespace: string): void {
    const keys = this.listKeys(namespace);
    keys.forEach(k => this.remove(namespace, k));
  },
};

export const RecordStorage = {
  KEY: 'records',

  getAll<T>(): T[] {
    return storage.get<T[]>('records', this.KEY, [] as T[]);
  },

  save<T>(records: T[]): void {
    storage.set<T[]>('records', this.KEY, records);
  },

  add<T extends object>(record: T): void {
    const all = storage.get<T[]>('records', this.KEY, [] as T[]);
    all.unshift(record);
    storage.set<T[]>('records', this.KEY, all);
  },

  getById<T extends { id: string }>(id: string): T | undefined {
    const all = storage.get<T[]>('records', this.KEY, [] as T[]);
    return all.find((r: T) => r.id === id);
  },
};

export const ConfigStorage = {
  QUESTIONS_KEY: 'questions',
  ASSETS_KEY: 'assets',
  REWARDS_KEY: 'rewards',
  SCHEDULE_KEY: 'schedule',
  MODES_KEY: 'modes',
  LEVELS_KEY: 'levels',

  getQuestions<T>(): T[] {
    return storage.get<T[]>('config', this.QUESTIONS_KEY, []);
  },

  saveQuestions<T>(questions: T[]): void {
    storage.set('config', this.QUESTIONS_KEY, questions);
  },

  getRewards<T>(defaultValue: T): T {
    return storage.get<T>('config', this.REWARDS_KEY, defaultValue);
  },

  saveRewards<T>(rewards: T): void {
    storage.set('config', this.REWARDS_KEY, rewards);
  },

  getLevels<T>(defaultValue: T): T {
    return storage.get<T>('config', this.LEVELS_KEY, defaultValue);
  },

  saveLevels<T>(levels: T): void {
    storage.set('config', this.LEVELS_KEY, levels);
  },
};

export const UserStorage = {
  PROGRESS_KEY: 'progress',
  CURRENT_USER: { id: 'user-001', name: '张运营', role: 'trainee', avatar: '👨‍💼' },

  getProgress<T>(defaultValue: T): T {
    return storage.get<T>('user', this.PROGRESS_KEY, defaultValue);
  },

  saveProgress<T>(progress: T): void {
    storage.set('user', this.PROGRESS_KEY, progress);
  },
};
