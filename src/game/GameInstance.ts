import Phaser from 'phaser';
import { GAME_CONFIG, GAME_DIMENSIONS, PHYSICS_CONFIG } from './GameConfig';
import { eventBus, GameEvent, configManager } from '../core';
import type { GameSettings } from '../models';

export interface GameInstanceConfig {
  parent?: string | HTMLElement;
  backgroundColor?: string;
  pixelArt?: boolean;
  antialias?: boolean;
  zoom?: number;
}

export type SceneConstructor = new (...args: unknown[]) => Phaser.Scene;

export interface SceneRegistration {
  key: string;
  scene: SceneConstructor;
  autoStart?: boolean;
}

export class GameInstance {
  private static instance: GameInstance | null = null;
  private game: Phaser.Game | null = null;
  private scenes: Map<string, SceneConstructor> = new Map();
  private initialized = false;
  private settings: GameSettings | null = null;

  static getInstance(): GameInstance {
    if (!GameInstance.instance) {
      GameInstance.instance = new GameInstance();
    }
    return GameInstance.instance;
  }

  private constructor() {}

  init(config: GameInstanceConfig = {}): Phaser.Game {
    if (this.initialized && this.game) {
      return this.game;
    }

    try {
      this.settings = configManager.getGameConfig().defaultSettings;
    } catch {
      this.settings = {
        soundVolume: 0.7,
        musicVolume: 0.5,
        difficulty: 'medium',
        language: 'zh-CN',
        fullscreen: false,
      };
    }

    const phaserConfig: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: GAME_DIMENSIONS.width,
      height: GAME_DIMENSIONS.height,
      parent: config.parent || 'game-container',
      backgroundColor: config.backgroundColor || GAME_CONFIG.colors.background,
      pixelArt: config.pixelArt ?? false,
      antialias: config.antialias ?? true,
      zoom: config.zoom ?? 1,
      physics: {
        default: 'matter',
        matter: {
          gravity: PHYSICS_CONFIG.gravity,
          enableSleeping: PHYSICS_CONFIG.enableSleeping,
          debug: false,
        },
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: GAME_DIMENSIONS.width,
        height: GAME_DIMENSIONS.height,
      },
      input: {
        keyboard: true,
        mouse: true,
        touch: true,
      },
      render: {
        antialiasGL: config.antialias ?? true,
        pixelArt: config.pixelArt ?? false,
      },
    };

    this.game = new Phaser.Game(phaserConfig);

    this.setupGameEvents();

    this.initialized = true;

    console.log('[GameInstance] Initialized');

    return this.game;
  }

  registerScene(key: string, scene: SceneConstructor, autoStart = false): void {
    if (!this.game) {
      throw new Error('Game not initialized. Call init() first.');
    }

    if (this.scenes.has(key)) {
      console.warn(`[GameInstance] Scene "${key}" already registered`);
      return;
    }

    this.scenes.set(key, scene);
    this.game.scene.add(key, scene, autoStart);

    console.log(`[GameInstance] Scene "${key}" registered`);
  }

  registerScenes(registrations: SceneRegistration[]): void {
    for (const reg of registrations) {
      this.registerScene(reg.key, reg.scene, reg.autoStart ?? false);
    }
  }

  start(sceneKey?: string, data?: unknown): void {
    if (!this.game) {
      throw new Error('Game not initialized. Call init() first.');
    }

    const sceneData = data !== undefined ? (data as object) : undefined;

    if (sceneKey) {
      if (!this.scenes.has(sceneKey)) {
        throw new Error(`Scene "${sceneKey}" not registered`);
      }
      this.game.scene.start(sceneKey, sceneData);
    } else if (this.scenes.size > 0) {
      const firstKey = this.scenes.keys().next().value;
      if (firstKey) {
        this.game.scene.start(firstKey, sceneData);
      }
    }

    console.log('[GameInstance] Game started');
  }

  getGame(): Phaser.Game | null {
    return this.game;
  }

  getScene(key: string): Phaser.Scene | null {
    if (!this.game) return null;
    return this.game.scene.getScene(key) || null;
  }

  getCurrentScene(): Phaser.Scene | null {
    if (!this.game) return null;
    const scenes = this.game.scene.getScenes(true);
    return scenes.length > 0 ? scenes[0] : null;
  }

  isSceneActive(key: string): boolean {
    if (!this.game) return false;
    return this.game.scene.isActive(key);
  }

  pause(): void {
    if (!this.game) return;
    this.game.scene.pause(this.getCurrentSceneKey()!);
    eventBus.emit(GameEvent.GAME_PAUSED);
    console.log('[GameInstance] Game paused');
  }

  resume(): void {
    if (!this.game) return;
    this.game.scene.resume(this.getCurrentSceneKey()!);
    eventBus.emit(GameEvent.GAME_RESUMED);
    console.log('[GameInstance] Game resumed');
  }

  restart(): void {
    if (!this.game) return;
    const currentKey = this.getCurrentSceneKey();
    if (currentKey) {
      const currentData = this.getCurrentScene()?.scene.settings.data;
      this.game.scene.stop(currentKey);
      this.game.scene.start(currentKey, currentData);
      console.log('[GameInstance] Scene restarted');
    }
  }

  toggleFullscreen(): void {
    if (!this.game) return;

    const canvas = this.game.canvas;
    if (!canvas) return;

    if (this.isFullscreen()) {
      this.exitFullscreen();
    } else {
      this.enterFullscreen();
    }
  }

  enterFullscreen(): void {
    if (!this.game || this.isFullscreen()) return;

    const canvas = this.game.canvas;
    if (!canvas) return;

    if (canvas.requestFullscreen) {
      canvas.requestFullscreen().catch((error) => {
        console.error('[GameInstance] Failed to enter fullscreen:', error);
      });
    }

    this.updateSettingsFullscreen(true);
    console.log('[GameInstance] Entered fullscreen');
  }

  exitFullscreen(): void {
    if (!this.game || !this.isFullscreen()) return;

    if (document.exitFullscreen) {
      document.exitFullscreen().catch((error) => {
        console.error('[GameInstance] Failed to exit fullscreen:', error);
      });
    }

    this.updateSettingsFullscreen(false);
    console.log('[GameInstance] Exited fullscreen');
  }

  isFullscreen(): boolean {
    return !!document.fullscreenElement;
  }

  setZoom(zoom: number): void {
    if (!this.game) return;
    this.game.scale.setZoom(zoom);
  }

  getZoom(): number {
    return this.game?.scale.zoom ?? 1;
  }

  resize(width: number, height: number): void {
    if (!this.game) return;
    this.game.scale.resize(width, height);
  }

  destroy(): void {
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }
    this.scenes.clear();
    this.initialized = false;
    this.settings = null;
    console.log('[GameInstance] Destroyed');
  }

  isInitialized(): boolean {
    return this.initialized && this.game !== null;
  }

  getRegisteredScenes(): string[] {
    return Array.from(this.scenes.keys());
  }

  hasScene(key: string): boolean {
    return this.scenes.has(key);
  }

  private getCurrentSceneKey(): string | null {
    const currentScene = this.getCurrentScene();
    return currentScene?.scene.key || null;
  }

  private setupGameEvents(): void {
    if (!this.game) return;

    this.game.events.on(Phaser.Core.Events.READY, () => {
      console.log('[GameInstance] Game ready');
    });

    this.game.events.on(Phaser.Core.Events.DESTROY, () => {
      console.log('[GameInstance] Game destroyed');
    });

    document.addEventListener('fullscreenchange', () => {
      const isFullscreen = this.isFullscreen();
      if (this.settings && this.settings.fullscreen !== isFullscreen) {
        this.updateSettingsFullscreen(isFullscreen);
      }
    });
  }

  private updateSettingsFullscreen(fullscreen: boolean): void {
    if (!this.settings) return;
    this.settings = { ...this.settings, fullscreen };
    eventBus.emit(GameEvent.SETTINGS_CHANGED, this.settings);
  }
}

export const gameInstance = GameInstance.getInstance();
