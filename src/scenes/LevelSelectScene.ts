import Phaser from 'phaser';
import { COLORS } from '../config/gameConfig';
import { AudioManager } from '../managers/AudioManager';
import { GameStateManager } from '../managers/GameStateManager';
import type { LevelConfig } from '../types';

export class LevelSelectScene extends Phaser.Scene {
  private audioManager: AudioManager;
  private stateManager: GameStateManager;

  constructor() {
    super('LevelSelectScene');
    this.audioManager = AudioManager.getInstance();
    this.stateManager = GameStateManager.getInstance();
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.add.rectangle(width / 2, height / 2, width, height, COLORS.background);

    this.add.text(width / 2, 60, '选择关卡', {
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    const backBtn = this.add.text(40, 40, '← 返回', {
      fontSize: '18px',
      color: '#a0a0a0'
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => {
      this.audioManager.playClick();
      this.scene.start('MainMenuScene');
    });

    const levels = this.stateManager.getLevels();
    const cardWidth = 260;
    const cardHeight = 320;
    const startX = width / 2 - (cardWidth + 30) * (levels.length - 1) / 2;

    levels.forEach((level, index) => {
      const x = startX + index * (cardWidth + 30);
      this.createLevelCard(x, height / 2 + 20, level);
    });
  }

  private createLevelCard(x: number, y: number, level: LevelConfig): void {
    const cardWidth = 260;
    const cardHeight = 320;

    const isLocked = !level.unlocked;

    const card = this.add.rectangle(x, y, cardWidth, cardHeight, COLORS.cardBg)
      .setStrokeStyle(2, COLORS.cardBorder, 1);

    const difficultyColors: Record<string, number> = {
      easy: COLORS.success,
      normal: COLORS.warning,
      hard: COLORS.danger
    };

    const difficultyLabels: Record<string, string> = {
      easy: '简单',
      normal: '中等',
      hard: '困难'
    };

    const difficultyColor = difficultyColors[level.difficulty];
    const difficultyLabel = difficultyLabels[level.difficulty];

    const levelNumBg = this.add.circle(x, y - 110, 35, difficultyColor);
    this.add.text(x, y - 110, level.id.toString(), {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(x, y - 50, level.name, {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(x, y - 15, difficultyLabel, {
      fontSize: '14px',
      color: '#' + difficultyColor.toString(16).padStart(6, '0')
    }).setOrigin(0.5);

    const descY = y + 10;
    const descText = this.add.text(x, descY, level.description, {
      fontSize: '13px',
      color: '#a0a0a0',
      wordWrap: { width: cardWidth - 40 }
    }).setOrigin(0.5, 0);

    const infoY = descY + descText.height + 20;
    this.add.text(x, infoY, `⏱ ${level.duration}秒  📋 ${level.billCount}单`, {
      fontSize: '13px',
      color: '#888888'
    }).setOrigin(0.5);

    this.add.text(x, infoY + 25, `💰 回款周期: ${level.payoutCycle}天`, {
      fontSize: '13px',
      color: COLORS.gold.toString(16)
    }).setOrigin(0.5);

    const record = this.stateManager.getLevelRecord(level.id);
    if (record) {
      this.add.text(x, infoY + 55, `最高分: ${record.bestScore}`, {
        fontSize: '13px',
        color: '#' + COLORS.primary.toString(16).padStart(6, '0')
      }).setOrigin(0.5);
    }

    if (isLocked) {
      const overlay = this.add.rectangle(x, y, cardWidth, cardHeight, 0x000000, 0.7);
      this.add.text(x, y + 50, '🔒 通关前一关解锁', {
        fontSize: '16px',
        color: '#888888'
      }).setOrigin(0.5);
    } else {
      const btnY = y + cardHeight / 2 - 40;
      const startBtn = this.add.rectangle(x, btnY, 160, 44, COLORS.primary)
        .setStrokeStyle(2, 0xffffff, 0.3)
        .setInteractive({ useHandCursor: true });

      this.add.text(x, btnY, '开始挑战', {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5);

      startBtn.on('pointerover', () => {
        startBtn.setScale(1.05);
      });

      startBtn.on('pointerout', () => {
        startBtn.setScale(1);
      });

      startBtn.on('pointerdown', () => {
        this.audioManager.playClick();
        this.audioManager.vibrate(30);
        this.stateManager.setCurrentLevel(level);
        this.scene.start('GameScene');
      });
    }
  }
}
