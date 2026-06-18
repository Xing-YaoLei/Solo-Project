import Phaser from 'phaser';
import { gameInstance } from './GameInstance';
import { TRANSITION_CONFIG, GAME_DIMENSIONS } from './GameConfig';
import { eventBus } from '../core';

export type TransitionType = 'fade' | 'slide' | 'fadeSlide' | 'instant';

export type SlideDirection = 'left' | 'right' | 'up' | 'down';

export interface SceneTransitionConfig {
  type: TransitionType;
  duration?: number;
  ease?: string;
  color?: string;
  direction?: SlideDirection;
}

export interface SceneSwitchOptions {
  transition?: SceneTransitionConfig;
  data?: unknown;
  clearPrevious?: boolean;
  sleepPrevious?: boolean;
}

export interface SceneHistoryEntry {
  key: string;
  data?: unknown;
  timestamp: number;
}

export interface SceneLifecycleHandlers {
  onBeforeEnter?: (data?: unknown) => void;
  onEnter?: (data?: unknown) => void;
  onBeforeLeave?: () => void;
  onLeave?: () => void;
  onResume?: () => void;
  onPause?: () => void;
}

export type SceneLifecycleEvent = 'beforeEnter' | 'enter' | 'beforeLeave' | 'leave' | 'resume' | 'pause';

type SceneLifecycleCallback = (data?: unknown) => void;

export class SceneManager {
  private static instance: SceneManager | null = null;
  private currentScene: string | null = null;
  private sceneData: Map<string, unknown> = new Map();
  private history: SceneHistoryEntry[] = [];
  private maxHistorySize = 50;
  private transitioning = false;
  private transitionOverlay: Phaser.GameObjects.Graphics | null = null;
  private lifecycleHandlers: Map<string, Map<SceneLifecycleEvent, Set<SceneLifecycleCallback>>> = new Map();

  static getInstance(): SceneManager {
    if (!SceneManager.instance) {
      SceneManager.instance = new SceneManager();
    }
    return SceneManager.instance;
  }

  private constructor() {}

  switchScene(sceneKey: string, options: SceneSwitchOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.transitioning) {
        reject(new Error('Scene transition already in progress'));
        return;
      }

      if (!gameInstance.hasScene(sceneKey)) {
        reject(new Error(`Scene "${sceneKey}" not registered`));
        return;
      }

      if (sceneKey === this.currentScene) {
        resolve();
        return;
      }

      this.transitioning = true;

      const transitionConfig = this.mergeTransitionConfig(options.transition);

      this.executeTransition(
        sceneKey,
        options,
        transitionConfig,
        () => {
          this.transitioning = false;
          resolve();
        },
        (error) => {
          this.transitioning = false;
          reject(error);
        }
      );
    });
  }

  switchToPrevious(options: SceneSwitchOptions = {}): Promise<void> {
    if (this.history.length < 2) {
      return Promise.reject(new Error('No previous scene in history'));
    }

    const currentIndex = this.history.length - 1;
    const previousEntry = this.history[currentIndex - 1];

    return this.switchScene(previousEntry.key, {
      ...options,
      data: previousEntry.data,
    });
  }

  switchToNext(options: SceneSwitchOptions = {}): Promise<void> {
    const currentIndex = this.history.findIndex((entry) => entry.key === this.currentScene);
    if (currentIndex === -1 || currentIndex >= this.history.length - 1) {
      return Promise.reject(new Error('No next scene in history'));
    }

    const nextEntry = this.history[currentIndex + 1];
    return this.switchScene(nextEntry.key, {
      ...options,
      data: nextEntry.data,
    });
  }

  restartScene(options: SceneSwitchOptions = {}): Promise<void> {
    if (!this.currentScene) {
      return Promise.reject(new Error('No active scene'));
    }

    const currentData = this.getSceneData(this.currentScene);
    return this.switchScene(this.currentScene, {
      ...options,
      data: currentData,
    });
  }

  getCurrentScene(): string | null {
    return this.currentScene;
  }

  getSceneData<T = unknown>(sceneKey: string): T | undefined {
    return this.sceneData.get(sceneKey) as T | undefined;
  }

  setSceneData(sceneKey: string, data: unknown): void {
    this.sceneData.set(sceneKey, data);
  }

  clearSceneData(sceneKey?: string): void {
    if (sceneKey) {
      this.sceneData.delete(sceneKey);
    } else {
      this.sceneData.clear();
    }
  }

  getHistory(): SceneHistoryEntry[] {
    return [...this.history];
  }

  clearHistory(): void {
    this.history = [];
  }

  isTransitioning(): boolean {
    return this.transitioning;
  }

  pauseCurrentScene(): void {
    if (!this.currentScene) return;

    const scene = gameInstance.getScene(this.currentScene);
    if (scene) {
      scene.scene.pause();
      this.emitLifecycleEvent(this.currentScene, 'pause');
    }
  }

  resumeCurrentScene(): void {
    if (!this.currentScene) return;

    const scene = gameInstance.getScene(this.currentScene);
    if (scene) {
      scene.scene.resume();
      this.emitLifecycleEvent(this.currentScene, 'resume');
    }
  }

  on(
    sceneKey: string,
    event: SceneLifecycleEvent,
    callback: SceneLifecycleCallback
  ): () => void {
    if (!this.lifecycleHandlers.has(sceneKey)) {
      this.lifecycleHandlers.set(sceneKey, new Map());
    }

    const sceneHandlers = this.lifecycleHandlers.get(sceneKey)!;
    if (!sceneHandlers.has(event)) {
      sceneHandlers.set(event, new Set());
    }

    sceneHandlers.get(event)!.add(callback);

    return () => {
      this.off(sceneKey, event, callback);
    };
  }

  off(sceneKey: string, event: SceneLifecycleEvent, callback: SceneLifecycleCallback): void {
    const sceneHandlers = this.lifecycleHandlers.get(sceneKey);
    if (!sceneHandlers) return;

    const handlers = sceneHandlers.get(event);
    if (handlers) {
      handlers.delete(callback);
      if (handlers.size === 0) {
        sceneHandlers.delete(event);
      }
    }

    if (sceneHandlers.size === 0) {
      this.lifecycleHandlers.delete(sceneKey);
    }
  }

  clearHandlers(sceneKey?: string): void {
    if (sceneKey) {
      this.lifecycleHandlers.delete(sceneKey);
    } else {
      this.lifecycleHandlers.clear();
    }
  }

  private executeTransition(
    targetScene: string,
    options: SceneSwitchOptions,
    config: Required<SceneTransitionConfig>,
    onComplete: () => void,
    onError: (error: Error) => void
  ): void {
    const currentScene = gameInstance.getCurrentScene();

    if (!currentScene) {
      this.startScene(targetScene, options.data, onComplete);
      return;
    }

    this.emitLifecycleEvent(this.currentScene!, 'beforeLeave');

    switch (config.type) {
      case 'fade':
        this.executeFadeTransition(targetScene, options, config, onComplete, onError);
        break;
      case 'slide':
        this.executeSlideTransition(targetScene, options, config, onComplete, onError);
        break;
      case 'fadeSlide':
        this.executeFadeSlideTransition(targetScene, options, config, onComplete, onError);
        break;
      case 'instant':
      default:
        this.executeInstantTransition(targetScene, options, onComplete, onError);
        break;
    }
  }

  private executeInstantTransition(
    targetScene: string,
    options: SceneSwitchOptions,
    onComplete: () => void,
    onError: (error: Error) => void
  ): void {
    try {
      if (this.currentScene) {
        this.emitLifecycleEvent(this.currentScene, 'leave');
        if (options.clearPrevious) {
          gameInstance.getScene(this.currentScene)?.scene.stop();
        } else if (options.sleepPrevious) {
          gameInstance.getScene(this.currentScene)?.scene.sleep();
        }
      }

      this.startScene(targetScene, options.data, onComplete);
    } catch (error) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private executeFadeTransition(
    targetScene: string,
    options: SceneSwitchOptions,
    config: Required<SceneTransitionConfig>,
    onComplete: () => void,
    onError: (error: Error) => void
  ): void {
    const currentScene = gameInstance.getCurrentScene();
    if (!currentScene) {
      this.startScene(targetScene, options.data, onComplete);
      return;
    }

    this.createOverlay(currentScene, config.color);

    currentScene.tweens.add({
      targets: this.transitionOverlay,
      alpha: 1,
      duration: config.duration / 2,
      ease: config.ease,
      onComplete: () => {
        try {
          this.emitLifecycleEvent(this.currentScene!, 'leave');

          if (options.clearPrevious) {
            currentScene.scene.stop();
          } else if (options.sleepPrevious) {
            currentScene.scene.sleep();
          }

          this.startScene(targetScene, options.data, () => {
            const newScene = gameInstance.getCurrentScene();
            if (newScene && this.transitionOverlay) {
              this.transitionOverlay.destroy();
              this.createOverlay(newScene, config.color);
              this.transitionOverlay.alpha = 1;

              newScene.tweens.add({
                targets: this.transitionOverlay,
                alpha: 0,
                duration: config.duration / 2,
                ease: config.ease,
                onComplete: () => {
                  this.destroyOverlay();
                  onComplete();
                },
              });
            } else {
              this.destroyOverlay();
              onComplete();
            }
          });
        } catch (error) {
          this.destroyOverlay();
          onError(error instanceof Error ? error : new Error(String(error)));
        }
      },
    });
  }

  private executeSlideTransition(
    targetScene: string,
    options: SceneSwitchOptions,
    config: Required<SceneTransitionConfig>,
    onComplete: () => void,
    onError: (error: Error) => void
  ): void {
    const currentScene = gameInstance.getCurrentScene();
    if (!currentScene) {
      this.startScene(targetScene, options.data, onComplete);
      return;
    }

    const { width, height } = GAME_DIMENSIONS;
    const direction = config.direction || 'left';

    const getStartOffset = () => {
      switch (direction) {
        case 'left':
          return { x: width, y: 0 };
        case 'right':
          return { x: -width, y: 0 };
        case 'up':
          return { x: 0, y: height };
        case 'down':
          return { x: 0, y: -height };
        default:
          return { x: width, y: 0 };
      }
    };

    try {
      const startOffset = getStartOffset();

      this.emitLifecycleEvent(this.currentScene!, 'leave');

      if (options.clearPrevious) {
        currentScene.scene.stop();
      } else if (options.sleepPrevious) {
        currentScene.scene.sleep();
      }

      this.startScene(targetScene, options.data, () => {
        const newScene = gameInstance.getCurrentScene();
        if (newScene) {
          const camera = newScene.cameras.main;
          camera.setScroll(startOffset.x, startOffset.y);

          newScene.tweens.addCounter({
            from: 0,
            to: 1,
            duration: config.duration,
            ease: config.ease,
            onUpdate: (tween) => {
              const progress = tween.getValue() ?? 0;
              camera.setScroll(
                startOffset.x + (0 - startOffset.x) * progress,
                startOffset.y + (0 - startOffset.y) * progress
              );
            },
            onComplete: () => {
              camera.setScroll(0, 0);
              onComplete();
            },
          });
        } else {
          onComplete();
        }
      });
    } catch (error) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private executeFadeSlideTransition(
    targetScene: string,
    options: SceneSwitchOptions,
    config: Required<SceneTransitionConfig>,
    onComplete: () => void,
    onError: (error: Error) => void
  ): void {
    const currentScene = gameInstance.getCurrentScene();
    if (!currentScene) {
      this.startScene(targetScene, options.data, onComplete);
      return;
    }

    const { width, height } = GAME_DIMENSIONS;
    const direction = config.direction || 'left';

    const getStartOffset = () => {
      switch (direction) {
        case 'left':
          return { x: width, y: 0 };
        case 'right':
          return { x: -width, y: 0 };
        case 'up':
          return { x: 0, y: height };
        case 'down':
          return { x: 0, y: -height };
        default:
          return { x: width, y: 0 };
      }
    };

    this.createOverlay(currentScene, config.color);

    currentScene.tweens.add({
      targets: this.transitionOverlay,
      alpha: 0.8,
      duration: config.duration / 2,
      ease: config.ease,
      onComplete: () => {
        try {
          this.emitLifecycleEvent(this.currentScene!, 'leave');

          if (options.clearPrevious) {
            currentScene.scene.stop();
          } else if (options.sleepPrevious) {
            currentScene.scene.sleep();
          }

          this.startScene(targetScene, options.data, () => {
            const newScene = gameInstance.getCurrentScene();
            if (newScene && this.transitionOverlay) {
              const startOffset = getStartOffset();
              const camera = newScene.cameras.main;
              camera.setScroll(startOffset.x, startOffset.y);
              camera.fadeIn(config.duration / 2);

              this.transitionOverlay.destroy();
              this.createOverlay(newScene, config.color);
              this.transitionOverlay.alpha = 0.8;

              newScene.tweens.add({
                targets: this.transitionOverlay,
                alpha: 0,
                duration: config.duration / 2,
                ease: config.ease,
              });

              newScene.tweens.addCounter({
                from: 0,
                to: 1,
                duration: config.duration / 2,
                ease: config.ease,
                onUpdate: (tween) => {
                  const progress = tween.getValue() ?? 0;
                  camera.setScroll(
                    startOffset.x + (0 - startOffset.x) * progress,
                    startOffset.y + (0 - startOffset.y) * progress
                  );
                },
                onComplete: () => {
                  camera.setScroll(0, 0);
                  this.destroyOverlay();
                  onComplete();
                },
              });
            } else {
              this.destroyOverlay();
              onComplete();
            }
          });
        } catch (error) {
          this.destroyOverlay();
          onError(error instanceof Error ? error : new Error(String(error)));
        }
      },
    });
  }

  private startScene(sceneKey: string, data: unknown, onComplete: () => void): void {
    this.emitLifecycleEvent(sceneKey, 'beforeEnter', data);

    if (data !== undefined) {
      this.sceneData.set(sceneKey, data);
    }

    const sceneData = this.sceneData.get(sceneKey);
    const phaserSceneData = sceneData !== undefined ? (sceneData as object) : undefined;
    gameInstance.getGame()!.scene.start(sceneKey, phaserSceneData);

    this.currentScene = sceneKey;
    this.addToHistory(sceneKey, sceneData);

    this.emitLifecycleEvent(sceneKey, 'enter', sceneData);

    onComplete();
  }

  private addToHistory(sceneKey: string, data: unknown): void {
    const existingIndex = this.history.findIndex((entry) => entry.key === sceneKey);
    if (existingIndex !== -1) {
      this.history = this.history.slice(0, existingIndex);
    }

    this.history.push({
      key: sceneKey,
      data,
      timestamp: Date.now(),
    });

    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  private createOverlay(scene: Phaser.Scene, color: string): void {
    this.destroyOverlay();
    this.transitionOverlay = scene.add.graphics();
    this.transitionOverlay.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 1);
    this.transitionOverlay.fillRect(0, 0, GAME_DIMENSIONS.width, GAME_DIMENSIONS.height);
    this.transitionOverlay.setDepth(Number.MAX_SAFE_INTEGER);
    this.transitionOverlay.alpha = 0;
    this.transitionOverlay.setScrollFactor(0);
  }

  private destroyOverlay(): void {
    if (this.transitionOverlay) {
      this.transitionOverlay.destroy();
      this.transitionOverlay = null;
    }
  }

  private mergeTransitionConfig(config?: SceneTransitionConfig): Required<SceneTransitionConfig> {
    return {
      type: config?.type || 'fade',
      duration: config?.duration ?? TRANSITION_CONFIG.duration,
      ease: config?.ease || TRANSITION_CONFIG.ease,
      color: config?.color || TRANSITION_CONFIG.fadeColor,
      direction: config?.direction || 'left',
    };
  }

  private emitLifecycleEvent(sceneKey: string, event: SceneLifecycleEvent, data?: unknown): void {
    const sceneHandlers = this.lifecycleHandlers.get(sceneKey);
    if (sceneHandlers) {
      const handlers = sceneHandlers.get(event);
      if (handlers) {
        for (const callback of handlers) {
          try {
            callback(data);
          } catch (error) {
            console.error(`[SceneManager] Error in ${event} handler for ${sceneKey}:`, error);
          }
        }
      }
    }

    eventBus.emit(`scene:${event}`, { sceneKey, data });
  }
}

export const sceneManager = SceneManager.getInstance();
