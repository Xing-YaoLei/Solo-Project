import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { UIHelper } from '../utils/UIHelper';
import { DataManager, LevelConfig } from '../data/DataManager';
import { SoundManager } from '../data/SoundManager';
import { SettingsManager } from '../data/SettingsManager';

export class LevelSelectScene extends Phaser.Scene {

  constructor() {
    super({ key: 'LevelSelectScene' });
  }

  create(): void {
    SoundManager.getInstance().setScene(this);

    const centerX = GameConfig.GAME_WIDTH / 2;

    const bg = this.add.graphics();
    bg.fillStyle(GameConfig.COLORS.background, 1);
    bg.fillRect(0, 0, GameConfig.GAME_WIDTH, GameConfig.GAME_HEIGHT);

    const title = this.add.text(centerX, 60, '选择关卡', {
      fontSize: '40px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);
    UIHelper.animateIn(this, title);

    UIHelper.createButton(
      this, 80, 60, 100, 44, '返回',
      () => this.scene.start('MenuScene'),
      { bgColor: 0x6b7280, fontSize: 18 }
    );

    const levels = DataManager.getInstance().getLevels();
    this.renderLevelCards(levels);

    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start('MenuScene');
    });

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      const num = parseInt(event.key);
      if (num >= 1 && num <= levels.length) {
        const level = levels[num - 1];
        if (level.unlocked) {
          this.startLevel(level);
        }
      }
    });
  }

  private renderLevelCards(levels: LevelConfig[]): void {
    const startY = 180;
    const cardWidth = 300;
    const cardHeight = 200;
    const gap = 30;
    const cardsPerRow = 3;

    levels.forEach((level, index) => {
      const row = Math.floor(index / cardsPerRow);
      const col = index % cardsPerRow;
      const x = GameConfig.GAME_WIDTH / 2 - (cardsPerRow * (cardWidth + gap) - gap) / 2 + col * (cardWidth + gap) + cardWidth / 2;
      const y = startY + row * (cardHeight + gap);

      this.createLevelCard(x, y, cardWidth, cardHeight, level, index + 1);
    });
  }

  private createLevelCard(x: number, y: number, width: number, height: number, level: LevelConfig, levelNum: number): void {
    const container = this.add.container(x, y);
    container.setSize(width, height);

    const isUnlocked = level.unlocked;

    const bg = this.add.graphics();
    const bgColor = isUnlocked ? GameConfig.COLORS.panel : 0x1a1a1a;
    bg.fillStyle(bgColor, 0.95);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 16);

    if (isUnlocked) {
      const levelColors = [GameConfig.COLORS.level1, GameConfig.COLORS.level2, GameConfig.COLORS.level3, GameConfig.COLORS.level4];
      const accentColor = levelColors[Math.min(level.maxCareLevel - 1, levelColors.length - 1)];
      bg.lineStyle(3, accentColor, 1);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 16);
    }

    const levelBadge = this.add.graphics();
    levelBadge.fillStyle(isUnlocked ? GameConfig.COLORS.primary : 0x444444, 1);
    levelBadge.fillCircle(-width / 2 + 35, -height / 2 + 35, 22);

    const levelNumText = this.add.text(-width / 2 + 35, -height / 2 + 35, isUnlocked ? levelNum.toString() : '🔒', {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    levelNumText.setOrigin(0.5);

    const nameText = this.add.text(-width / 2 + 20, -height / 2 + 80, level.name, {
      fontSize: '24px',
      color: isUnlocked ? '#ffffff' : '#666666',
      fontStyle: 'bold'
    });

    const descText = this.add.text(-width / 2 + 20, -height / 2 + 115, level.description, {
      fontSize: '14px',
      color: isUnlocked ? '#aaaaaa' : '#444444',
      wordWrap: { width: width - 40 }
    });

    const statsText = this.add.text(-width / 2 + 20, -height / 2 + 160, 
      isUnlocked ? `⏱ ${level.timeLimit}秒  🛏 ${level.bedCount}床  🎯 目标${level.targetCorrect}正确` : '完成前一关卡解锁',
      {
        fontSize: '13px',
        color: isUnlocked ? '#888888' : '#444444'
      }
    );

    container.add([bg, levelBadge, levelNumText, nameText, descText, statsText]);

    if (isUnlocked) {
      container.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);
      
      container.on('pointerover', () => {
        this.input.setDefaultCursor('pointer');
        const multiplier = SettingsManager.getInstance().getAnimationMultiplier();
        if (multiplier > 0) {
          this.tweens.add({
            targets: container,
            scale: 1 + 0.03 * multiplier,
            duration: 150 * multiplier,
            ease: 'Power2'
          });
        } else {
          container.scale = 1;
        }
      });

      container.on('pointerout', () => {
        this.input.setDefaultCursor('default');
        const multiplier = SettingsManager.getInstance().getAnimationMultiplier();
        if (multiplier > 0) {
          this.tweens.add({
            targets: container,
            scale: 1,
            duration: 150 * multiplier,
            ease: 'Power2'
          });
        } else {
          container.scale = 1;
        }
      });

      container.on('pointerdown', () => {
        this.startLevel(level);
      });
    }

    UIHelper.animateIn(this, container, 200 + levelNum * 100);
  }

  private startLevel(level: LevelConfig): void {
    SoundManager.getInstance().playClick();
    this.scene.start('GameScene', { levelId: level.id });
  }
}
