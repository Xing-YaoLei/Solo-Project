import { Scene } from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, ProgressRecord, GameStage } from '../types';
import { gameStateManager } from '../utils/GameStateManager';
import { inputManager } from '../utils/InputManager';
import { formatPercentage, formatTime, calculateAverage } from '../utils';
import { getLevelById } from '../data/levels';
import { UIButton } from '../components/UIButton';
import { UIProgressBar } from '../components/UIProgressBar';

export class ReviewScene extends Scene {
  private gameState = gameStateManager.getState();
  private saveData = gameStateManager.getSaveData();
  private chartContainer: Phaser.GameObjects.Container | null = null;
  private inputListeners: (() => void)[] = [];

  constructor() {
    super('ReviewScene');
  }

  create(): void {
    gameStateManager.setPhase('review');
    inputManager.initialize(this);
    this.createUI();
    this.setupInput();

    this.cameras.main.fadeIn(300, 26, 32, 44);
  }

  private createUI(): void {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    this.add.rectangle(centerX, centerY, GAME_WIDTH, GAME_HEIGHT, COLORS.background);

    const title = this.add.text(centerX, 50, '📊 关卡复盘', {
      fontSize: '36px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    const levelData = getLevelById(this.gameState.currentLevelId);
    if (levelData) {
      this.add.text(centerX, 90, `${levelData.courseName} - ${levelData.title}`, {
        fontSize: '18px',
        color: '#a0aec0',
        fontFamily: 'Arial, sans-serif'
      }).setOrigin(0.5, 0.5);
    }

    this.createSummaryPanel();
    this.createProgressChart();
    this.createStageBreakdown();
    this.createButtons();
  }

  private createSummaryPanel(): void {
    const panelX = GAME_WIDTH / 2;
    const panelY = 160;
    const panelWidth = 800;
    const panelHeight = 120;

    const panel = this.add.container(panelX, panelY);

    const bg = this.add.rectangle(0, 0, panelWidth, panelHeight, COLORS.surface)
      .setOrigin(0.5, 0.5)
      .setStrokeStyle(2, COLORS.primary);

    const state = this.gameState;
    const levelData = getLevelById(state.currentLevelId);

    const statItems = [
      {
        label: '总得分',
        value: state.totalScore.toString(),
        color: '#4a90d9',
        icon: '🏆'
      },
      {
        label: '完成率',
        value: formatPercentage(state.completionRate),
        color: state.completionRate >= (levelData?.targetCompletionRate || 0.7) ? '#48bb78' : '#e53e3e',
        icon: '📈'
      },
      {
        label: '已评作业',
        value: `${state.assignmentsGraded.length}份`,
        color: '#ffffff',
        icon: '✏️'
      },
      {
        label: '剩余时间',
        value: formatTime(Math.ceil(state.timeRemaining)),
        color: state.timeRemaining < 60 ? '#e53e3e' : '#ffffff',
        icon: '⏱️'
      }
    ];

    const itemWidth = panelWidth / statItems.length;
    statItems.forEach((item, index) => {
      const x = -panelWidth / 2 + index * itemWidth + itemWidth / 2;

      const icon = this.add.text(x, -25, item.icon, {
        fontSize: '28px',
        fontFamily: 'Arial, sans-serif'
      }).setOrigin(0.5, 0.5);

      const value = this.add.text(x, 10, item.value, {
        fontSize: '24px',
        color: item.color,
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      }).setOrigin(0.5, 0.5);

      const label = this.add.text(x, 40, item.label, {
        fontSize: '14px',
        color: '#a0aec0',
        fontFamily: 'Arial, sans-serif'
      }).setOrigin(0.5, 0.5);

      panel.add([icon, value, label]);
    });

    panel.add(bg);

    if (levelData && state.completionRate >= levelData.targetCompletionRate) {
      const successBadge = this.add.text(panelWidth / 2 - 20, -panelHeight / 2 + 20, '✅ 目标达成！', {
        fontSize: '16px',
        color: '#48bb78',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      }).setOrigin(1, 0.5);
      panel.add(successBadge);
    }
  }

  private createProgressChart(): void {
    const chartX = GAME_WIDTH / 2;
    const chartY = 360;
    const chartWidth = 800;
    const chartHeight = 200;

    this.chartContainer = this.add.container(chartX, chartY);

    const title = this.add.text(0, -chartHeight / 2 - 20, '📈 完成率变化趋势', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    const bg = this.add.rectangle(0, 0, chartWidth, chartHeight, COLORS.surface)
      .setOrigin(0.5, 0.5)
      .setStrokeStyle(2, COLORS.border);

    const padding = 50;
    const innerWidth = chartWidth - padding * 2;
    const innerHeight = chartHeight - padding * 2;

    const xAxis = this.add.line(-innerWidth / 2, innerHeight / 2, 0, 0, innerWidth, 0, COLORS.border)
      .setOrigin(0, 0);

    const yAxis = this.add.line(-innerWidth / 2, -innerHeight / 2, 0, 0, 0, innerHeight, COLORS.border)
      .setOrigin(0, 0);

    this.chartContainer.add([bg, xAxis, yAxis]);

    for (let i = 0; i <= 4; i++) {
      const y = -innerHeight / 2 + i * (innerHeight / 4);
      const gridLine = this.add.line(-innerWidth / 2, y, 0, 0, innerWidth, 0, COLORS.surfaceLight)
        .setOrigin(0, 0)
        .setAlpha(0.5);

      const label = this.add.text(-padding / 2, y, `${100 - i * 25}%`, {
        fontSize: '12px',
        color: '#718096',
        fontFamily: 'Arial, sans-serif'
      }).setOrigin(1, 0.5);

      this.chartContainer?.add([gridLine, label]);
    }

    const progressHistory = this.gameState.progressHistory;
    if (progressHistory.length > 1) {
      const points: { x: number; y: number }[] = [];
      const stageColors: Record<GameStage, number> = {
        feedback: COLORS.primary,
        rules: COLORS.warning,
        scoring: COLORS.success
      };

      progressHistory.forEach((record, index) => {
        const x = -innerWidth / 2 + (index / (progressHistory.length - 1)) * innerWidth;
        const y = innerHeight / 2 - record.completionRate * innerHeight;
        points.push({ x, y });

        const dotColor = stageColors[record.stage] || COLORS.primary;
        const dot = this.add.circle(x, y, 5, dotColor)
          .setStrokeStyle(2, COLORS.surface);

        if (index === 0 || index === progressHistory.length - 1 || record.stage !== progressHistory[index - 1]?.stage) {
          const stageLabel = this.add.text(x, y - 15, this.getStageLabel(record.stage), {
            fontSize: '10px',
            color: '#' + dotColor.toString(16).padStart(6, '0'),
            fontFamily: 'Arial, sans-serif'
          }).setOrigin(0.5, 1);
          this.chartContainer?.add(stageLabel);
        }

        this.chartContainer?.add(dot);
      });

      const graphics = this.add.graphics();
      graphics.setPosition(0, 0);
      graphics.lineStyle(3, COLORS.primary, 0.8);
      graphics.beginPath();
      graphics.moveTo(points[0].x, points[0].y);

      for (let i = 1; i < points.length; i++) {
        const curr = points[i];
        graphics.lineTo(curr.x, curr.y);
      }
      graphics.strokePath();

      const fillGraphics = this.add.graphics();
      fillGraphics.setPosition(0, 0);
      fillGraphics.fillStyle(COLORS.primary, 0.2);
      fillGraphics.beginPath();
      fillGraphics.moveTo(points[0].x, innerHeight / 2);
      fillGraphics.lineTo(points[0].x, points[0].y);

      for (let i = 1; i < points.length; i++) {
        const curr = points[i];
        fillGraphics.lineTo(curr.x, curr.y);
      }

      fillGraphics.lineTo(points[points.length - 1].x, innerHeight / 2);
      fillGraphics.closePath();
      fillGraphics.fillPath();

      this.chartContainer?.add(graphics);
      this.chartContainer?.add(fillGraphics);
    }

    const avgCompletion = calculateAverage(progressHistory.map(r => r.completionRate));
    const avgLine = this.add.line(
      -innerWidth / 2,
      innerHeight / 2 - avgCompletion * innerHeight,
      0, 0,
      innerWidth, 0,
      COLORS.warning,
      0.5
    ).setOrigin(0, 0);

    const avgLabel = this.add.text(
      innerWidth / 2 + 10,
      innerHeight / 2 - avgCompletion * innerHeight,
      `平均: ${formatPercentage(avgCompletion)}`,
      {
        fontSize: '12px',
        color: '#ed8936',
        fontFamily: 'Arial, sans-serif'
      }
    ).setOrigin(0, 0.5);

    const legendItems = [
      { color: COLORS.primary, label: '成绩反馈' },
      { color: COLORS.warning, label: '提醒规则' },
      { color: COLORS.success, label: '章节评分' }
    ];

    legendItems.forEach((item, index) => {
      const lx = -innerWidth / 2 + index * 120;
      const ly = innerHeight / 2 + 25;

      const legendDot = this.add.circle(lx, ly, 6, item.color);
      const legendText = this.add.text(lx + 12, ly, item.label, {
        fontSize: '12px',
        color: '#a0aec0',
        fontFamily: 'Arial, sans-serif'
      }).setOrigin(0, 0.5);

      this.chartContainer?.add([legendDot, legendText]);
    });

    this.chartContainer.add([title, avgLine, avgLabel]);
  }

  private getStageLabel(stage: GameStage): string {
    switch (stage) {
      case 'feedback': return '成绩反馈';
      case 'rules': return '提醒规则';
      case 'scoring': return '章节评分';
    }
  }

  private createStageBreakdown(): void {
    const panelX = GAME_WIDTH / 2;
    const panelY = 530;
    const panelWidth = 800;
    const panelHeight = 80;

    const panel = this.add.container(panelX, panelY);

    const bg = this.add.rectangle(0, 0, panelWidth, panelHeight, COLORS.surface)
      .setOrigin(0.5, 0.5)
      .setStrokeStyle(2, COLORS.border);

    const title = this.add.text(-panelWidth / 2 + 20, -panelHeight / 2 + 15, '📋 各阶段完成情况', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    const stages: { key: GameStage; label: string; color: number }[] = [
      { key: 'feedback', label: '成绩反馈', color: COLORS.primary },
      { key: 'rules', label: '提醒规则', color: COLORS.warning },
      { key: 'scoring', label: '章节评分', color: COLORS.success }
    ];

    const progressHistory = this.gameState.progressHistory;

    stages.forEach((stage, index) => {
      const stageRecords = progressHistory.filter(r => r.stage === stage.key);
      const stageCompletion = stageRecords.length > 0
        ? stageRecords[stageRecords.length - 1].completionRate
        : (index === 0 ? 1 : 0);

      const barX = -panelWidth / 2 + 20 + index * 260;
      const barY = 10;

      const barLabel = this.add.text(barX, barY - 15, stage.label, {
        fontSize: '12px',
        color: '#a0aec0',
        fontFamily: 'Arial, sans-serif'
      }).setOrigin(0, 0.5);

      const progressBar = new UIProgressBar(
        this,
        barX,
        barY,
        200,
        20,
        stage.color,
        false,
        true
      ).setShowPercentage(true).setValue(stageCompletion * 100, false);

      panel.add(progressBar);
    });

    panel.add([bg, title]);
  }

  private createButtons(): void {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT - 60;

    const menuButton = new UIButton(
      this,
      centerX - 170,
      centerY,
      200,
      50,
      '🏠 返回菜单',
      18,
      COLORS.surfaceLight
    ).setOnClick(() => this.returnToMenu());

    const retryButton = new UIButton(
      this,
      centerX,
      centerY,
      200,
      50,
      '🔄 重新挑战',
      18,
      COLORS.warning
    ).setOnClick(() => this.retryLevel());

    const state = this.gameState;
    const currentLevelIndex = parseInt(state.currentLevelId.replace('level_', ''));
    const saveData = this.saveData;
    const nextLevelId = `level_${currentLevelIndex + 1}`;
    const hasNextLevel = saveData.unlockedLevels.includes(nextLevelId) && currentLevelIndex < 3;

    let nextButton: UIButton | null = null;
    if (hasNextLevel) {
      nextButton = new UIButton(
        this,
        centerX + 170,
        centerY,
        200,
        50,
        '➡️ 下一关',
        18,
        COLORS.success
      ).setOnClick(() => this.nextLevel(nextLevelId));
    }

    const tipText = this.add.text(centerX, 20, '⌨️ Enter重玩 | Esc返回菜单', {
      fontSize: '14px',
      color: '#718096',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5, 0.5);
  }

  private setupInput(): void {
    this.inputListeners.push(
      inputManager.onKeyboard('CONFIRM', () => {
        this.retryLevel();
      }),

      inputManager.onKeyboard('CANCEL', () => {
        this.returnToMenu();
      }),

      inputManager.onTouch((input) => {
        if (input === 'TAP') {
        }
      })
    );
  }

  private returnToMenu(): void {
    this.cameras.main.fadeOut(300, 26, 32, 44);
    this.time.delayedCall(300, () => {
      gameStateManager.goToMenu();
      this.scene.start('MenuScene');
    });
  }

  private retryLevel(): void {
    this.cameras.main.fadeOut(300, 26, 32, 44);
    this.time.delayedCall(300, () => {
      gameStateManager.restartLevel();
      this.scene.start('GameScene');
    });
  }

  private nextLevel(levelId: string): void {
    this.cameras.main.fadeOut(300, 26, 32, 44);
    this.time.delayedCall(300, () => {
      gameStateManager.startLevel(levelId);
      this.scene.start('GameScene');
    });
  }

  update(time: number, delta: number): void {
    this.gameState = gameStateManager.getState();
    this.saveData = gameStateManager.getSaveData();
  }
}
