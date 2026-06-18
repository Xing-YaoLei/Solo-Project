import Phaser from 'phaser';
import { gameInstance } from './game/GameInstance';
import { sceneManager } from './game/SceneManager';
import { BootScene, MainMenuScene } from './scenes';
import { TaskHallScene } from './scenes/TaskHallScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { ConstructionSiteScene } from './scenes/ConstructionSiteScene';
import { InspectionScene } from './scenes/InspectionScene';
import { SettlementScene } from './scenes/SettlementScene';
import { RecordsScene } from './scenes/RecordsScene';
import { LeaderboardScene } from './scenes/LeaderboardScene';
import { TutorialScene } from './scenes/TutorialScene';
import { configManager } from './core/ConfigManager';
import { saveSystem } from './core/SaveSystem';
import { audioManager } from './core/AudioManager';
import { leaderboard } from './core/Leaderboard';
import { taskSystem } from './systems/TaskSystem';
import { clueSystem } from './systems/ClueSystem';
import { actionSystem } from './systems/ActionSystem';
import { inspectionSystem } from './systems/InspectionSystem';
import { changeOrderSystem } from './systems/ChangeOrderSystem';
import { trainingRecorder } from './systems/TrainingRecorder';


console.log('[main] 启动工地指挥家 - 设计变更经营模拟游戏');

const gameContainer = document.getElementById('game-container');

if (!gameContainer) {
  console.error('[main] 未找到游戏容器元素 game-container');
}

const game = gameInstance.init({
  parent: gameContainer || undefined,
  backgroundColor: '#0a1628',
  pixelArt: false,
  antialias: true,
});

gameInstance.registerScenes([
  { key: 'BootScene', scene: BootScene, autoStart: true },
  { key: 'MainMenuScene', scene: MainMenuScene },
  { key: 'TaskHallScene', scene: TaskHallScene },
  { key: 'LevelSelectScene', scene: LevelSelectScene },
  { key: 'ConstructionSiteScene', scene: ConstructionSiteScene },
  { key: 'InspectionScene', scene: InspectionScene },
  { key: 'SettlementScene', scene: SettlementScene },
  { key: 'RecordsScene', scene: RecordsScene },
  { key: 'LeaderboardScene', scene: LeaderboardScene },
  { key: 'TutorialScene', scene: TutorialScene },
]);

const initSystems = async () => {
  try {
    await configManager.loadAll();
    leaderboard.load();

    const gameConfig = configManager.getGameConfig();
    saveSystem.init(gameConfig.defaultSettings);

    const currentSave = saveSystem.getCurrentSave();
    if (currentSave) {
      trainingRecorder.setPlayerName(currentSave.playerName);
    }

    const levels = configManager.getAllLevels();
    const tasks = configManager.getAllTasks();
    taskSystem.initialize(tasks, levels);

    const playerSave = saveSystem.getCurrentSave();
    if (playerSave && playerSave.unlockedLevels.length > 0) {
      console.log(`[main] 玩家已解锁 ${playerSave.unlockedLevels.length} 个关卡`);
    }

    console.log('[main] 所有系统初始化完成');
  } catch (error) {
    console.error('[main] 系统初始化失败:', error);
  }
};

game.events.once(Phaser.Core.Events.READY, () => {
  console.log('[main] Phaser 游戏实例已就绪');
  initSystems();
});

window.addEventListener('resize', () => {
  if (game.scale) {
    game.scale.refresh();
  }
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'F11') {
    e.preventDefault();
    gameInstance.toggleFullscreen();
  }

  if (e.key === 'Escape') {
    const currentScene = gameInstance.getCurrentScene();
    if (currentScene && currentScene.scene.key !== 'MainMenuScene') {
      gameInstance.toggleFullscreen();
    }
  }
});

export {
  gameInstance,
  sceneManager,
  configManager,
  saveSystem,
  audioManager,
  leaderboard,
  taskSystem,
  clueSystem,
  actionSystem,
  inspectionSystem,
  changeOrderSystem,
  trainingRecorder,
};
