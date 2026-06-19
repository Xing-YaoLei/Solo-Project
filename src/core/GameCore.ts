import { GameManager } from '../managers/GameManager';
import { LevelManager } from '../managers/LevelManager';
import { ReplayManager } from '../managers/ReplayManager';

class GameCore {
  private static instance: GameCore;
  private _gameManager: GameManager;
  private _levelManager: LevelManager;
  private _replayManager: ReplayManager;
  private _initialized: boolean = false;

  private constructor() {
    this._gameManager = new GameManager();
    this._levelManager = new LevelManager();
    this._replayManager = new ReplayManager();
  }

  static getInstance(): GameCore {
    if (!GameCore.instance) {
      GameCore.instance = new GameCore();
    }
    return GameCore.instance;
  }

  initialize(): void {
    if (this._initialized) return;
    this._initialized = true;
  }

  get gameManager(): GameManager {
    return this._gameManager;
  }

  get levelManager(): LevelManager {
    return this._levelManager;
  }

  get replayManager(): ReplayManager {
    return this._replayManager;
  }

  isInitialized(): boolean {
    return this._initialized;
  }
}

export const gameCore = GameCore.getInstance();
