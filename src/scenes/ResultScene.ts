import Phaser from 'phaser';
import { GameConfig, CARE_LEVELS } from '../config/GameConfig';
import { UIHelper } from '../utils/UIHelper';
import { GameResult } from '../data/DataManager';
import { SoundManager } from '../data/SoundManager';
import { SettingsManager } from '../data/SettingsManager';

export class ResultScene extends Phaser.Scene {
  private result!: GameResult;
  private levelId: number = 1;

  constructor() {
    super({ key: 'ResultScene' });
  }

  init(data: { result: GameResult; levelId: number }): void {
    this.result = data.result;
    this.levelId = data.levelId;
  }

  create(): void {
    SoundManager.getInstance().setScene(this);

    const centerX = GameConfig.GAME_WIDTH / 2;
    const centerY = GameConfig.GAME_HEIGHT / 2;

    const bg = this.add.graphics();
    bg.fillStyle(GameConfig.COLORS.background, 1);
    bg.fillRect(0, 0, GameConfig.GAME_WIDTH, GameConfig.GAME_HEIGHT);

    this.createParticles();

    const panelWidth = 700;
    const panelHeight = 600;
    const panel = UIHelper.createPanel(this, centerX, centerY, panelWidth, panelHeight, {
      bgColor: GameConfig.COLORS.panel,
      hasBorder: true,
      borderColor: this.result.completed ? GameConfig.COLORS.success : GameConfig.COLORS.error
    });
    UIHelper.animateIn(this, panel, 400);

    const resultIcon = this.add.text(centerX, centerY - panelHeight / 2 + 50, 
      this.result.completed ? '🎉' : '😢', {
      fontSize: '60px'
    });
    resultIcon.setOrigin(0.5);

    const resultTitle = this.add.text(centerX, centerY - panelHeight / 2 + 110,
      this.result.completed ? '关卡完成！' : '挑战失败',
      {
        fontSize: '36px',
        color: this.result.completed ? '#6bcb77' : '#ff6b6b',
        fontStyle: 'bold'
      }
    );
    resultTitle.setOrigin(0.5);

    const levelName = this.add.text(centerX, centerY - panelHeight / 2 + 150,
      this.result.levelName,
      {
        fontSize: '18px',
        color: '#888888'
      }
    );
    levelName.setOrigin(0.5);

    const scoreText = this.add.text(centerX, centerY - panelHeight / 2 + 195,
      `总分：${this.result.totalScore}`,
      {
        fontSize: '42px',
        color: '#ffd93d',
        fontStyle: 'bold'
      }
    );
    scoreText.setOrigin(0.5);
    UIHelper.animatePulse(this, scoreText);

    this.renderStatCards(centerX, centerY - 30);
    this.renderCareLevelStats(centerX, centerY + 85);

    const buttonY = centerY + panelHeight / 2 - 60;
    const buttonWidth = 180;
    const buttonHeight = 50;
    const gap = 25;

    UIHelper.createButton(
      this, centerX - buttonWidth - gap / 2, buttonY, buttonWidth, buttonHeight,
      '再来一局', () => {
        this.scene.start('GameScene', { levelId: this.levelId });
      },
      { bgColor: GameConfig.COLORS.primary, fontSize: 20 }
    );

    UIHelper.createButton(
      this, centerX, buttonY, buttonWidth, buttonHeight,
      '数据复盘', () => {
        this.scene.start('ReviewScene');
      },
      { bgColor: GameConfig.COLORS.secondary, fontSize: 20 }
    );

    UIHelper.createButton(
      this, centerX + buttonWidth + gap / 2, buttonY, buttonWidth, buttonHeight,
      '返回菜单', () => {
        this.scene.start('LevelSelectScene');
      },
      { bgColor: 0x6b7280, fontSize: 20 }
    );

    if (!this.result.completed) {
      const retryHint = this.add.text(centerX, buttonY - 45,
        '💡 按 Enter 或 空格 快速重试',
        {
          fontSize: '16px',
          color: '#ffaa66'
        }
      );
      retryHint.setOrigin(0.5);
    }

    this.input.keyboard?.on('keydown-ENTER', () => {
      this.scene.start('GameScene', { levelId: this.levelId });
    });

    this.input.keyboard?.on('keydown-SPACE', () => {
      this.scene.start('GameScene', { levelId: this.levelId });
    });

    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start('LevelSelectScene');
    });

    const multiplier = SettingsManager.getInstance().getAnimationMultiplier();
    if (multiplier > 0 && this.result.completed) {
      this.tweens.add({
        targets: [resultIcon, resultTitle, scoreText],
        y: '+=5',
        duration: 1000 * multiplier,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1
      });
    }
  }

  private renderStatCards(centerX: number, centerY: number): void {
    const cardWidth = 150;
    const cardHeight = 100;
    const gap = 18;

    const stats = [
      {
        label: '⚡ 速度评分',
        value: this.result.speedScore.toString(),
        subtext: `用时 ${this.result.timeTaken}/${this.result.timeLimit}秒`,
        color: GameConfig.COLORS.primary
      },
      {
        label: '❌ 错误次数',
        value: this.result.errorCount.toString(),
        subtext: this.result.errorCount === 0 ? '完美通关！' : '下次加油',
        color: this.result.errorCount === 0 ? GameConfig.COLORS.success : GameConfig.COLORS.error
      },
      {
        label: '🔥 最高连击',
        value: this.result.maxStreak.toString(),
        subtext: `连击加分 ${this.result.streakScore}`,
        color: GameConfig.COLORS.warning
      },
      {
        label: '🎯 准确率',
        value: `${Math.round(this.result.accuracy * 100)}%`,
        subtext: `${this.result.correctCount}对`,
        color: this.result.errorCount === 0 ? GameConfig.COLORS.success : GameConfig.COLORS.warning
      }
    ];

    stats.forEach((stat, i) => {
      const totalWidth = stats.length * (cardWidth + gap) - gap;
      const x = centerX - totalWidth / 2 + cardWidth / 2 + i * (cardWidth + gap);
      const container = this.add.container(x, centerY);

      const bg = this.add.graphics();
      bg.fillStyle(0x1a1a2e, 0.8);
      bg.fillRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 12);
      bg.lineStyle(2, stat.color, 0.8);
      bg.strokeRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 12);

      const label = this.add.text(0, -cardHeight / 2 + 22, stat.label, {
        fontSize: '15px',
        color: '#aaaaaa'
      });
      label.setOrigin(0.5);

      const value = this.add.text(0, 5, stat.value, {
        fontSize: '32px',
        color: `#${stat.color.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold'
      });
      value.setOrigin(0.5);

      const subtext = this.add.text(0, cardHeight / 2 - 18, stat.subtext, {
        fontSize: '12px',
        color: '#666666'
      });
      subtext.setOrigin(0.5);

      container.add([bg, label, value, subtext]);
      UIHelper.animateIn(this, container, 400 + i * 150);
    });
  }

  private renderCareLevelStats(centerX: number, centerY: number): void {
    const containerWidth = 620;

    this.add.text(centerX - containerWidth / 2, centerY - 45, '📊 护理达标详情：', {
      fontSize: '16px',
      color: '#cccccc',
      fontStyle: 'bold'
    });

    this.result.care达标.forEach((stat, i) => {
      const careLevel = CARE_LEVELS.find((l: { id: number; name: string; color: number; description: string }) => l.id === stat.level);
      if (!careLevel || stat.total === 0) return;

      const itemX = centerX - containerWidth / 2 + i * 155;
      const accuracy = stat.total > 0 ? stat.correct / stat.total : 0;

      const levelBadge = this.add.graphics();
      levelBadge.fillStyle(careLevel.color, 1);
      levelBadge.fillRoundedRect(itemX, centerY - 15, 60, 24, 6);

      const levelName = this.add.text(itemX + 30, centerY - 3, careLevel.name, {
        fontSize: '13px',
        color: '#ffffff',
        fontStyle: 'bold'
      });
      levelName.setOrigin(0.5);

      const progressBg = this.add.graphics();
      progressBg.fillStyle(0x333344, 1);
      progressBg.fillRoundedRect(itemX, centerY + 15, 140, 16, 8);

      const progressFill = this.add.graphics();
      const fillColor = accuracy >= 0.8 ? GameConfig.COLORS.success : accuracy >= 0.5 ? GameConfig.COLORS.warning : GameConfig.COLORS.error;
      progressFill.fillStyle(fillColor, 1);
      progressFill.fillRoundedRect(itemX, centerY + 15, 140 * accuracy, 16, 8);

      const rateText = this.add.text(itemX + 70, centerY + 23, `${stat.correct}/${stat.total} (${Math.round(accuracy * 100)}%)`, {
        fontSize: '11px',
        color: '#ffffff',
        fontStyle: 'bold'
      });
      rateText.setOrigin(0.5);
    });
  }

  private createParticles(): void {
    const multiplier = SettingsManager.getInstance().getAnimationMultiplier();
    if (multiplier === 0) return;

    const color = this.result.completed ? GameConfig.COLORS.success : GameConfig.COLORS.error;
    this.add.particles(0, 0, undefined, {
      speed: { min: 30 * multiplier, max: 80 * multiplier },
      angle: { min: 0, max: 360 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.6, end: 0 },
      tint: color,
      lifespan: 3000 / multiplier,
      quantity: Math.max(1, Math.floor(1 * multiplier)),
      blendMode: 'ADD',
      bounds: { x: 0, y: 0, w: GameConfig.GAME_WIDTH, h: GameConfig.GAME_HEIGHT }
    });
  }
}
