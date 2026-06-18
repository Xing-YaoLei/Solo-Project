import { gameCore } from './core/GameCore';
import { SceneManager, SceneEventListener } from './scene/SceneManager';
import { PhysicsManager } from './physics/PhysicsManager';
import { UIManager, UICallbacks } from './ui/UIManager';
import { Level, GameState, GameResult, PlayerAction, TaskStep } from './models';

class GameApplication implements SceneEventListener, UICallbacks {
  private sceneManager: SceneManager;
  private physicsManager: PhysicsManager;
  private uiManager: UIManager;
  private uiRoot: HTMLElement;
  private initialized: boolean = false;

  constructor() {
    const canvas = document.getElementById('application-canvas') as HTMLCanvasElement;
    this.uiRoot = document.getElementById('ui-root') as HTMLElement;

    if (!canvas || !this.uiRoot) {
      throw new Error('Required DOM elements not found');
    }

    this.sceneManager = new SceneManager({ canvas, enablePhysics: true });
    this.physicsManager = new PhysicsManager();
    this.uiManager = new UIManager(this.uiRoot, this);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    gameCore.initialize();
    await this.physicsManager.initialize();
    await this.sceneManager.initialize();
    this.sceneManager.addListener(this);

    this.render();

    gameCore.gameManager.addListener({
      onStateChange: () => this.render(),
      onStepChange: (step: TaskStep, index: number) => {
        this.sceneManager.showMaterialsForStep(index);
      }
    });

    this.initialized = true;
    console.log('🎮 二手车过户培训系统已启动');
  }

  private render(): void {
    const state = gameCore.gameManager.getState();
    this.uiManager.render(state);
  }

  onInitialized(): void {
    console.log('3D场景初始化完成');
  }

  onMaterialClicked(materialName: string): void {
    console.log('点击材料:', materialName);
    this.sceneManager.highlightMaterial(materialName, true);
    setTimeout(() => {
      this.sceneManager.highlightMaterial(materialName, false);
    }, 1000);
  }

  onUpdate(dt: number): void {
    if (this.physicsManager.isReady()) {
      this.physicsManager.update(dt);
    }
  }

  onStartLevel(level: Level): void {
    gameCore.gameManager.startLevel(level);
  }

  onSelectAction(actionId: string): void {
    try {
      gameCore.gameManager.submitAction(actionId);
    } catch (error) {
      console.error('Action submission error:', error);
    }
  }

  onGameComplete(result: GameResult): void {
    console.log('游戏完成:', result);
  }

  onBackToMenu(): void {
    this.sceneManager.clearAllMaterials();
    gameCore.gameManager.goToMenu();
  }

  onRetryLevel(): void {
    this.sceneManager.clearAllMaterials();
    gameCore.gameManager.retryLevel();
  }

  onStartGameplay(): void {
    gameCore.gameManager.startGameplay();
  }

  onGoToLevelSelect(): void {
    gameCore.gameManager.goToLevelSelect();
  }

  onShowReplay(replayId: string): void {
    const state = gameCore.gameManager.getState();
    gameCore.gameManager.getState();
    const replay = gameCore.replayManager.getReplayById(replayId);
    if (replay) {
      console.log('回放:', replay);
    }
    this.uiManager.renderReplay();
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  try {
    const app = new GameApplication();
    await app.initialize();
    (window as any).gameApp = app;
  } catch (error) {
    console.error('Failed to initialize game:', error);
    const container = document.getElementById('ui-root');
    if (container) {
      container.innerHTML = `
        <div style="padding: 40px; color: #fff; background: #1a1a2e; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <h1 style="color: #ff6b6b; margin-bottom: 16px;">启动失败</h1>
          <p style="color: rgba(255,255,255,0.7);">${error instanceof Error ? error.message : '未知错误'}</p>
          <p style="color: rgba(255,255,255,0.5); margin-top: 24px;">请运行 npm install 后再试</p>
        </div>
      `;
    }
  }
});
