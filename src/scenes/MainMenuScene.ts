import Phaser from 'phaser';
import { COLORS } from '../config/gameConfig';
import { AudioManager } from '../managers/AudioManager';
import { GameStateManager } from '../managers/GameStateManager';

export class MainMenuScene extends Phaser.Scene {
  private audioManager: AudioManager;
  private stateManager: GameStateManager;

  constructor() {
    super('MainMenuScene');
    this.audioManager = AudioManager.getInstance();
    this.stateManager = GameStateManager.getInstance();
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.add.rectangle(width / 2, height / 2, width, height, COLORS.background);

    const title = this.add.text(width / 2, 120, '商户结算大师', {
      fontSize: '48px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    const subtitle = this.add.text(width / 2, 170, '本地跑腿经营模拟', {
      fontSize: '20px',
      color: '#a0a0a0'
    }).setOrigin(0.5);

    const coinIcon = this.add.circle(width / 2 - 180, 130, 20, COLORS.gold);
    coinIcon.setStrokeStyle(3, 0xffffff);
    this.add.text(width / 2 - 180, 130, '¥', {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#1a1a2e'
    }).setOrigin(0.5);

    const startY = 260;
    const buttonGap = 70;

    this.createButton(width / 2, startY, '开始游戏', () => {
      this.audioManager.playClick();
      this.scene.start('LevelSelectScene');
    }, COLORS.primary);

    if (!this.stateManager.isTutorialCompleted()) {
      this.createButton(width / 2, startY + buttonGap, '新手引导', () => {
        this.audioManager.playClick();
        this.scene.start('TutorialScene');
      }, COLORS.warning);
    } else {
      this.createButton(width / 2, startY + buttonGap, '复盘记录', () => {
        this.audioManager.playClick();
        this.scene.start('ReviewScene');
      }, COLORS.success);
    }

    this.createButton(width / 2, startY + buttonGap * 2, '游戏设置', () => {
      this.audioManager.playClick();
      this.scene.start('SettingsScene');
    }, COLORS.secondary);

    const footer = this.add.text(width / 2, height - 40, '在办公环境中也能轻松练习', {
      fontSize: '14px',
      color: '#666666'
    }).setOrigin(0.5);

    const soundIcon = this.add.text(width - 50, 30, this.stateManager.isSoundEnabled() ? '🔊' : '🔇', {
      fontSize: '24px'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    soundIcon.on('pointerdown', () => {
      const newSound = !this.stateManager.isSoundEnabled();
      this.stateManager.updateSettings({ soundEnabled: newSound });
      soundIcon.setText(newSound ? '🔊' : '🔇');
    });

    this.tweens.add({
      targets: title,
      y: 110,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private createButton(
    x: number,
    y: number,
    text: string,
    callback: () => void,
    color: number
  ): void {
    const buttonWidth = 280;
    const buttonHeight = 56;

    const button = this.add.rectangle(x, y, buttonWidth, buttonHeight, color)
      .setStrokeStyle(2, 0xffffff, 0.3)
      .setInteractive({ useHandCursor: true });

    const buttonText = this.add.text(x, y, text, {
      fontSize: '22px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    button.on('pointerover', () => {
      button.setScale(1.05);
      button.setStrokeStyle(2, 0xffffff, 0.6);
    });

    button.on('pointerout', () => {
      button.setScale(1);
      button.setStrokeStyle(2, 0xffffff, 0.3);
    });

    button.on('pointerdown', callback);
  }
}
