import { Scene } from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../types';
import { LEVEL_CONFIGS } from '../data/levels';
import { gameStateManager } from '../utils/GameStateManager';
import { inputManager } from '../utils/InputManager';
import { formatPercentage } from '../utils';
import { UIButton } from '../components/UIButton';
import { UIDialog } from '../components/UIDialog';

export class MenuScene extends Scene {
  private titleText: Phaser.GameObjects.Text | null = null;
  private levelButtons: UIButton[] = [];
  private selectedLevelIndex: number = 0;
  private dialog: UIDialog | null = null;
  private saveData = gameStateManager.getSaveData();

  constructor() {
    super('MenuScene');
  }

  create(): void {
    gameStateManager.setPhase('menu');
    inputManager.initialize(this);
    this.createUI();
    this.setupInput();
  }

  private createUI(): void {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    this.add.rectangle(centerX, centerY, GAME_WIDTH, GAME_HEIGHT, COLORS.background);

    this.add.rectangle(centerX, 100, GAME_WIDTH, 120, COLORS.surface)
      .setOrigin(0.5, 0.5);

    this.titleText = this.add.text(centerX, 80, '📚 教务评教模拟器', {
      fontSize: '42px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    this.add.text(centerX, 120, '高校课程评教经营模拟游戏', {
      fontSize: '18px',
      color: '#a0aec0',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5, 0.5);

    this.add.text(centerX, 180, '选择关卡', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    const saveData = gameStateManager.getSaveData();

    LEVEL_CONFIGS.forEach((config, index) => {
      const isUnlocked = saveData.unlockedLevels.includes(config.id);
      const bestScore = saveData.levelScores[config.id] || 0;
      const bestRate = saveData.levelCompletionRates[config.id] || 0;

      const buttonY = 260 + index * 130;
      const card = this.add.container(centerX, buttonY);

      const bg = this.add.rectangle(0, 0, 600, 110, isUnlocked ? COLORS.surface : COLORS.surfaceLight)
        .setOrigin(0.5, 0.5)
        .setStrokeStyle(2, isUnlocked ? COLORS.border : 0x4a5568);

      const levelNum = this.add.text(-270, 0, `${index + 1}`, {
        fontSize: '36px',
        color: isUnlocked ? '#ffffff' : '#718096',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);

      const title = this.add.text(-200, -30, config.title, {
        fontSize: '20px',
        color: isUnlocked ? '#ffffff' : '#718096',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);

      const desc = this.add.text(-200, 0, config.description, {
        fontSize: '14px',
        color: isUnlocked ? '#a0aec0' : '#4a5568',
        fontFamily: 'Arial, sans-serif',
        wordWrap: { width: 380 }
      }).setOrigin(0, 0.5);

      let statsText = '';
      if (isUnlocked && bestScore > 0) {
        statsText = `最高分: ${bestScore} | 完成率: ${formatPercentage(bestRate)}`;
      } else if (!isUnlocked) {
        statsText = '🔒 未解锁';
      } else {
        statsText = `⏱️ 限时: ${Math.floor(config.timeLimit / 60)}分钟 | 🎯 目标: ${formatPercentage(config.targetCompletionRate)}`;
      }

      const stats = this.add.text(-200, 30, statsText, {
        fontSize: '12px',
        color: isUnlocked ? '#48bb78' : '#4a5568',
        fontFamily: 'Arial, sans-serif'
      }).setOrigin(0, 0.5);

      const startButton = new UIButton(
        this,
        230,
        0,
        100,
        40,
        isUnlocked ? '开始' : '锁定',
        16,
        isUnlocked ? COLORS.primary : COLORS.surfaceLight
      ).setEnabled(isUnlocked).setOnClick(() => {
          if (isUnlocked) {
            this.startLevel(config.id);
          }
        });

      card.add([bg, levelNum, title, desc, stats, startButton]);

      if (isUnlocked) {
        this.levelButtons.push(startButton);
      }
    });

    this.dialog = new UIDialog(this, centerX, centerY, 500, 300);

    const helpButton = new UIButton(
      this,
      centerX - 120,
      GAME_HEIGHT - 50,
      200,
      40,
      '操作说明',
      16,
      COLORS.surfaceLight
    ).setOnClick(() => this.showHelp());

    const resetButton = new UIButton(
      this,
      centerX + 120,
      GAME_HEIGHT - 50,
      200,
      40,
      '重置进度',
      16,
      COLORS.danger
    ).setOnClick(() => this.showResetConfirm());

    this.add.text(20, GAME_HEIGHT - 20, '⌨️ 方向键选择 | Enter确认', {
      fontSize: '14px',
      color: '#718096',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0, 1);
  }

  private setupInput(): void {
    inputManager.setMaxIndex(LEVEL_CONFIGS.length - 1);

    inputManager.onKeyboard('CONFIRM', () => {
      const config = LEVEL_CONFIGS[this.selectedLevelIndex];
      if (this.saveData.unlockedLevels.includes(config.id)) {
        this.startLevel(config.id);
      }
    });

    inputManager.onKeyboard('UP', () => {
      this.updateSelection(-1);
    });

    inputManager.onKeyboard('DOWN', () => {
      this.updateSelection(1);
    });

    inputManager.onKeyboard('HELP', () => {
      this.showHelp();
    });
  }

  private updateSelection(delta: number): void {
    const newIndex = this.selectedLevelIndex + delta;
    if (newIndex >= 0 && newIndex < LEVEL_CONFIGS.length) {
      this.selectedLevelIndex = newIndex;
      inputManager.setSelectedIndex(newIndex);

      this.levelButtons.forEach((btn, idx) => {
        if (idx === this.selectedLevelIndex) {
          btn.setColor(COLORS.primary);
          btn.scale = 1.05;
        } else {
          btn.setColor(COLORS.primary);
          btn.scale = 1;
        }
      });
    }
  }

  private startLevel(levelId: string): void {
    this.cameras.main.fadeOut(300, 26, 32, 44);

    this.time.delayedCall(300, () => {
      gameStateManager.startLevel(levelId);
      this.scene.start('GameScene');
    });
  }

  private showHelp(): void {
    this.dialog?.show({
      title: '📖 操作说明',
      content: '🎮 游戏玩法：\n\n' +
        '第一阶段：观察学生成绩反馈，了解学生表现\n' +
        '第二阶段：设置和管理提醒规则\n' +
        '第三阶段：对课程章节的作业进行评分\n\n' +
        '⌨️ 键盘操作：\n' +
        '方向键/WASD - 导航选择\n' +
        'Enter/Space - 确认\n' +
        'Q/E - 切换标签页\n' +
        '数字键0-9 - 快速输入分数\n' +
        'Esc - 暂停/返回\n\n' +
        '👆 触屏操作：\n' +
        '点击 - 选择/确认\n' +
        '拖拽 - 移动作业卡片\n' +
        '滑动 - 切换页面',
      buttons: [
        { text: '知道了', isPrimary: true, onClick: () => {} }
      ]
    });
  }

  private showResetConfirm(): void {
    this.dialog?.show({
      title: '⚠️ 重置进度',
      content: '确定要重置所有游戏进度吗？这将清除所有已解锁的关卡和最高分记录，此操作无法撤销。',
      buttons: [
        { text: '取消', onClick: () => {} },
        {
          text: '确定重置',
          isPrimary: true,
          onClick: () => {
            gameStateManager.resetProgress();
            this.scene.restart();
          }
        }
      ]
    });
  }

  update(time: number, delta: number): void {
    this.saveData = gameStateManager.getSaveData();
  }
}
