import type { Task, Level, GameSettings } from '../models';

export interface AssetConfig {
  id: string;
  type: 'image' | 'audio' | 'spritesheet' | 'json';
  key: string;
  path: string;
  config?: unknown;
}

export interface TutorialStep {
  id: string;
  target?: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  highlight?: { x: number; y: number; width: number; height: number };
  nextCondition?: { type: 'click' | 'event'; target: string };
  autoNext?: boolean;
  delay?: number;
}

export interface TutorialConfig {
  id: string;
  name: string;
  steps: TutorialStep[];
  skippable: boolean;
}

export interface GameConfig {
  version: string;
  autoSaveInterval: number;
  maxSaveSlots: number;
  defaultSettings: GameSettings;
  scoring: {
    qualityWeight: number;
    costWeight: number;
    timeWeight: number;
    perfectThreshold: number;
    ratingThresholds: Record<string, number>;
  };
  physics: {
    gravity: number;
    friction: number;
    restitution: number;
  };
}

type ConfigType = 'level' | 'task' | 'asset' | 'tutorial' | 'gameConfig';

interface LoadResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class ConfigManager {
  private static instance: ConfigManager | null = null;
  private cache: Map<string, unknown> = new Map();
  private loadPromises: Map<string, Promise<unknown>> = new Map();
  private basePath = '/src/config';
  private loaded = false;
  private devMode = false;

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private constructor() {}

  async loadAll(): Promise<void> {
    if (this.loaded && !this.devMode) return;

    try {
      await Promise.all([
        this.loadGameConfig(),
        this.loadAssets(),
        this.loadTutorial(),
        this.loadAllLevels(),
        this.loadAllTasks(),
      ]);
      this.loaded = true;
    } catch (error) {
      console.error('[ConfigManager] Failed to load configs:', error);
      throw error;
    }
  }

  async preload(configType: ConfigType, id?: string): Promise<void> {
    const cacheKey = id ? `${configType}:${id}` : configType;
    
    if (this.cache.has(cacheKey)) return;
    
    if (this.loadPromises.has(cacheKey)) {
      await this.loadPromises.get(cacheKey);
      return;
    }

    let loadPromise: Promise<unknown>;
    
    switch (configType) {
      case 'level':
        loadPromise = id ? this.loadLevel(id) : this.loadAllLevels();
        break;
      case 'task':
        loadPromise = id ? this.loadTask(id) : this.loadAllTasks();
        break;
      case 'asset':
        loadPromise = this.loadAssets();
        break;
      case 'tutorial':
        loadPromise = this.loadTutorial();
        break;
      case 'gameConfig':
        loadPromise = this.loadGameConfig();
        break;
      default:
        throw new Error(`Unknown config type: ${configType}`);
    }

    this.loadPromises.set(cacheKey, loadPromise);
    await loadPromise;
    this.loadPromises.delete(cacheKey);
  }

  getLevel(id: string): Level {
    const level = this.cache.get(`level:${id}`) as Level | undefined;
    if (!level) {
      throw new Error(`Level config not found: ${id}. Call preload('level', '${id}') first.`);
    }
    return level;
  }

  getTask(id: string): Task {
    const task = this.cache.get(`task:${id}`) as Task | undefined;
    if (!task) {
      throw new Error(`Task config not found: ${id}. Call preload('task', '${id}') first.`);
    }
    return task;
  }

  getLevelById(id: string): Level {
    return this.getLevel(id);
  }

  getTaskById(id: string): Task {
    return this.getTask(id);
  }

  getLevelsByTaskId(taskId: string): Level[] {
    const levels = this.getAllLevels();
    return levels.filter(level => level.taskId === taskId);
  }

  getAllLevels(): Level[] {
    const levels = this.cache.get('levels') as Level[] | undefined;
    if (!levels) {
      throw new Error('Levels not loaded. Call preload(\'level\') first.');
    }
    return levels;
  }

  getAllTasks(): Task[] {
    const tasks = this.cache.get('tasks') as Task[] | undefined;
    if (!tasks) {
      throw new Error('Tasks not loaded. Call preload(\'task\') first.');
    }
    return tasks;
  }

  getAsset(id: string): AssetConfig {
    const assets = this.cache.get('assets') as AssetConfig[] | undefined;
    if (!assets) {
      throw new Error('Assets not loaded. Call preload(\'asset\') first.');
    }
    const asset = assets.find(a => a.id === id);
    if (!asset) {
      throw new Error(`Asset config not found: ${id}`);
    }
    return asset;
  }

  getAssetsByType(type: AssetConfig['type']): AssetConfig[] {
    const assets = this.cache.get('assets') as AssetConfig[] | undefined;
    if (!assets) {
      throw new Error('Assets not loaded. Call preload(\'asset\') first.');
    }
    return assets.filter(a => a.type === type);
  }

  getTutorial(): TutorialConfig {
    const tutorial = this.cache.get('tutorial') as TutorialConfig | undefined;
    if (!tutorial) {
      throw new Error('Tutorial config not loaded. Call preload(\'tutorial\') first.');
    }
    return tutorial;
  }

  getGameConfig(): GameConfig {
    const gameConfig = this.cache.get('gameConfig') as GameConfig | undefined;
    if (!gameConfig) {
      throw new Error('Game config not loaded. Call preload(\'gameConfig\') first.');
    }
    return gameConfig;
  }

  isLoaded(configType?: ConfigType, id?: string): boolean {
    if (!configType) return this.loaded;
    const cacheKey = id ? `${configType}:${id}` : configType;
    return this.cache.has(cacheKey);
  }

  invalidate(configType?: ConfigType, id?: string): void {
    if (!configType) {
      this.cache.clear();
      this.loaded = false;
      return;
    }
    
    const cacheKey = id ? `${configType}:${id}` : configType;
    this.cache.delete(cacheKey);
    
    if (!id && configType === 'level') {
      this.cache.delete('levels');
    }
    if (!id && configType === 'task') {
      this.cache.delete('tasks');
    }
  }

  private async loadJson<T>(path: string): Promise<LoadResult<T>> {
    try {
      const response = await fetch(path, {
        cache: this.devMode ? 'no-store' : 'default',
      });
      
      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  private async loadGameConfig(): Promise<void> {
    const result = await this.loadJson<GameConfig>(`${this.basePath}/gameConfig.json`);
    if (result.success && result.data) {
      this.cache.set('gameConfig', result.data);
    } else {
      console.warn('[ConfigManager] Using default game config:', result.error);
      this.cache.set('gameConfig', this.getDefaultGameConfig());
    }
  }

  private async loadAssets(): Promise<void> {
    const result = await this.loadJson<AssetConfig[]>(`${this.basePath}/assets.json`);
    if (result.success && result.data) {
      this.cache.set('assets', result.data);
    } else {
      console.warn('[ConfigManager] Using empty assets:', result.error);
      this.cache.set('assets', []);
    }
  }

  private async loadTutorial(): Promise<void> {
    const result = await this.loadJson<TutorialConfig>(`${this.basePath}/tutorial.json`);
    if (result.success && result.data) {
      this.cache.set('tutorial', result.data);
    } else {
      console.warn('[ConfigManager] Using default tutorial:', result.error);
      this.cache.set('tutorial', this.getDefaultTutorial());
    }
  }

  private async loadAllLevels(): Promise<void> {
    const levels: Level[] = [];
    let levelIndex = 1;
    
    while (true) {
      const levelId = `level_${String(levelIndex).padStart(3, '0')}`;
      const result = await this.loadLevel(levelId, true);
      
      if (!result.success || !result.data) break;
      
      levels.push(result.data);
      levelIndex++;
    }
    
    this.cache.set('levels', levels);
  }

  private async loadAllTasks(): Promise<void> {
    const tasks: Task[] = [];
    const levels = this.cache.get('levels') as Level[] || [];
    
    for (const level of levels) {
      const result = await this.loadTask(level.taskId, true);
      if (result.success && result.data) {
        tasks.push(result.data);
      }
    }
    
    this.cache.set('tasks', tasks);
  }

  private async loadLevel(id: string, silent = false): Promise<LoadResult<Level>> {
    const cacheKey = `level:${id}`;
    
    if (this.cache.has(cacheKey)) {
      return { success: true, data: this.cache.get(cacheKey) as Level };
    }

    const result = await this.loadJson<Level>(`${this.basePath}/levels/${id}.json`);
    
    if (result.success && result.data) {
      this.cache.set(cacheKey, result.data);
    } else if (!silent) {
      console.error(`[ConfigManager] Failed to load level ${id}:`, result.error);
    }
    
    return result;
  }

  private async loadTask(id: string, silent = false): Promise<LoadResult<Task>> {
    const cacheKey = `task:${id}`;
    
    if (this.cache.has(cacheKey)) {
      return { success: true, data: this.cache.get(cacheKey) as Task };
    }

    const result = await this.loadJson<Task>(`${this.basePath}/tasks/${id}.json`);
    
    if (result.success && result.data) {
      this.cache.set(cacheKey, result.data);
    } else if (!silent) {
      console.error(`[ConfigManager] Failed to load task ${id}:`, result.error);
    }
    
    return result;
  }

  private getDefaultGameConfig(): GameConfig {
    return {
      version: '1.0.0',
      autoSaveInterval: 30000,
      maxSaveSlots: 5,
      defaultSettings: {
        soundVolume: 0.7,
        musicVolume: 0.5,
        difficulty: 'medium',
        language: 'zh-CN',
        fullscreen: false,
      },
      scoring: {
        qualityWeight: 0.4,
        costWeight: 0.3,
        timeWeight: 0.3,
        perfectThreshold: 95,
        ratingThresholds: { S: 90, A: 80, B: 70, C: 60, D: 0 },
      },
      physics: {
        gravity: 1,
        friction: 0.1,
        restitution: 0.2,
      },
    };
  }

  private getDefaultTutorial(): TutorialConfig {
    return {
      id: 'default',
      name: '新手引导',
      steps: [],
      skippable: true,
    };
  }
}

export const configManager = ConfigManager.getInstance();
