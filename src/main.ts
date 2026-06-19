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
    
    if (!this.physicsManager.isReady()) {
      throw new Error('物理引擎初始化失败，请刷新页面重试');
    }
    
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
    console.log('🔧 物理引擎状态:', this.physicsManager.isReady() ? '正常运行' : '未启动');
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
    this.physicsManager.update(dt);
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
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      container.innerHTML = `
        <div style="padding: 40px; color: #fff; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <h1 style="color: #ff6b6b; margin-bottom: 16px; font-size: 28px;">启动失败</h1>
          <p style="color: rgba(255,255,255,0.8); font-size: 16px; text-align: center; max-width: 500px; line-height: 1.6;">${errorMsg}</p>
          <div style="margin-top: 32px; padding: 16px 24px; background: rgba(255,255,255,0.05); border-radius: 10px;">
            <p style="color: rgba(255,255,255,0.5); font-size: 14px;">请尝试以下解决方案：</p>
            <ul style="color: rgba(255,255,255,0.6); font-size: 14px; margin-top: 8px; padding-left: 20px; line-height: 1.8;">
              <li>刷新页面重试</li>
              <li>检查网络连接</li>
              <li>清除浏览器缓存后再试</li>
              <li>确保已正确安装依赖 (npm install)</li>
            </ul>
          </div>
          <button onclick="location.reload()" style="margin-top: 32px; padding: 12px 32px; font-size: 16px; background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; border: none; border-radius: 25px; cursor: pointer; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
            重新加载
          </button>
        </div>
      `;
    }
  }
});
