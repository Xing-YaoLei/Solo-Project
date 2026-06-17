import Phaser from 'phaser';
import { GameConfig } from '../config/GameConfig';
import { UIHelper } from '../utils/UIHelper';
import { SoundManager } from '../data/SoundManager';
import { SettingsManager } from '../data/SettingsManager';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    SoundManager.getInstance().setScene(this);

    const centerX = GameConfig.GAME_WIDTH / 2;
    const centerY = GameConfig.GAME_HEIGHT / 2;

    const bg = this.add.graphics();
    bg.fillGradientStyle(
      GameConfig.COLORS.background,
      GameConfig.COLORS.background,
      0x0f0f1a,
      0x0f0f1a,
      1
    );
    bg.fillRect(0, 0, GameConfig.GAME_WIDTH, GameConfig.GAME_HEIGHT);

    this.addAnimatedBackground();

    const titleContainer = this.add.container(centerX, 150);
    
    const titleIcon = this.add.text(0, -30, '🏥', {
      fontSize: '80px'
    });
    titleIcon.setOrigin(0.5);

    const title = this.add.text(0, 40, '养老护理床位排班模拟', {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);

    const subtitle = this.add.text(0, 95, '专业护理 · 精准排班 · 温暖守护', {
      fontSize: '20px',
      color: '#9a9a9a'
    });
    subtitle.setOrigin(0.5);

    titleContainer.add([titleIcon, title, subtitle]);
    UIHelper.animateIn(this, titleContainer, 500);
    UIHelper.animatePulse(this, titleIcon);

    const buttonY = centerY + 50;
    const buttonWidth = 280;
    const buttonHeight = 60;

    const startBtn = UIHelper.createButton(
      this, centerX, buttonY, buttonWidth, buttonHeight,
      '开始游戏', () => {
        this.scene.start('LevelSelectScene');
      },
      { bgColor: GameConfig.COLORS.primary, fontSize: 26 }
    );
    UIHelper.animateIn(this, startBtn, 400);

    const reviewBtn = UIHelper.createButton(
      this, centerX, buttonY + 85, buttonWidth, buttonHeight,
      '数据复盘', () => {
        this.scene.start('ReviewScene');
      },
      { bgColor: GameConfig.COLORS.secondary, fontSize: 26 }
    );
    UIHelper.animateIn(this, reviewBtn, 500);

    const settingsBtn = UIHelper.createButton(
      this, centerX, buttonY + 170, buttonWidth, buttonHeight,
      '游戏设置', () => {
        this.scene.start('SettingsScene', { from: 'MenuScene' });
      },
      { bgColor: 0x6b7280, fontSize: 26 }
    );
    UIHelper.animateIn(this, settingsBtn, 600);

    const version = this.add.text(GameConfig.GAME_WIDTH - 20, GameConfig.GAME_HEIGHT - 20, 'v1.0.0', {
      fontSize: '14px',
      color: '#555555'
    });
    version.setOrigin(1, 1);

    this.input.keyboard?.on('keydown-ENTER', () => {
      this.scene.start('LevelSelectScene');
    });

    this.input.keyboard?.on('keydown-SPACE', () => {
      this.scene.start('LevelSelectScene');
    });
  }

  private addAnimatedBackground(): void {
    const multiplier = SettingsManager.getInstance().getAnimationMultiplier();
    if (multiplier === 0) return;

    this.add.particles(0, 0, undefined, {
      speed: { min: 20 * multiplier, max: 40 * multiplier },
      angle: { min: 0, max: 360 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.5, end: 0 },
      tint: [GameConfig.COLORS.primary, GameConfig.COLORS.secondary],
      lifespan: 4000 / multiplier,
      quantity: Math.max(1, Math.floor(2 * multiplier)),
      blendMode: 'ADD',
      bounds: { x: 0, y: 0, w: GameConfig.GAME_WIDTH, h: GameConfig.GAME_HEIGHT }
    });
  }
}
