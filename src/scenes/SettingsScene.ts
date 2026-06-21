import Phaser from 'phaser';
import { COLORS } from '../config/gameConfig';
import { AudioManager } from '../managers/AudioManager';
import { GameStateManager } from '../managers/GameStateManager';

export class SettingsScene extends Phaser.Scene {
  private audioManager: AudioManager;
  private stateManager: GameStateManager;

  constructor() {
    super('SettingsScene');
    this.audioManager = AudioManager.getInstance();
    this.stateManager = GameStateManager.getInstance();
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.add.rectangle(width / 2, height / 2, width, height, COLORS.background);

    this.add.text(width / 2, 60, '游戏设置', {
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

    const panelX = width / 2;
    const panelY = height / 2 + 20;
    const panelWidth = 500;
    const panelHeight = 380;

    this.add.rectangle(panelX, panelY, panelWidth, panelHeight, COLORS.cardBg)
      .setStrokeStyle(2, COLORS.cardBorder, 1);

    const settings = this.stateManager.getSettings();

    const startY = panelY - 130;
    const gap = 90;

    this.createSoundToggle(panelX, startY, settings.soundEnabled);
    this.createVibrationToggle(panelX, startY + gap, settings.vibrationEnabled);
    this.createTutorialReset(panelX, startY + gap * 2);
  }

  private createSoundToggle(x: number, y: number, enabled: boolean): void {
    this.add.text(x - 180, y, '🔊 音效', {
      fontSize: '22px',
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    const toggleBg = this.add.rectangle(x + 150, y, 70, 36, COLORS.cardBorder, 1)
      .setInteractive({ useHandCursor: true });

    const toggleX = x + 150;
    const toggleKnob = this.add.circle(
      enabled ? toggleX + 18 : toggleX - 18,
      y,
      14,
      enabled ? COLORS.success : COLORS.textSecondary
    );

    const updateToggle = (newEnabled: boolean) => {
      this.tweens.add({
        targets: toggleKnob,
        x: newEnabled ? toggleX + 18 : toggleX - 18,
        duration: 200,
        ease: 'Sine.easeInOut',
        onUpdate: () => {
          toggleKnob.setFillStyle(newEnabled ? COLORS.success : COLORS.textSecondary);
        }
      });
      toggleBg.setFillStyle(newEnabled ? COLORS.success : COLORS.cardBorder);
      this.stateManager.updateSettings({ soundEnabled: newEnabled });
      if (newEnabled) {
        this.audioManager.playClick();
      }
    };

    toggleBg.on('pointerdown', () => {
      const newEnabled = !this.stateManager.isSoundEnabled();
      updateToggle(newEnabled);
    });
  }

  private createVibrationToggle(x: number, y: number, enabled: boolean): void {
    this.add.text(x - 180, y, '📳 震动反馈', {
      fontSize: '22px',
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    const toggleBg = this.add.rectangle(x + 150, y, 70, 36, COLORS.cardBorder, 1)
      .setInteractive({ useHandCursor: true });

    const toggleX = x + 150;
    const toggleKnob = this.add.circle(
      enabled ? toggleX + 18 : toggleX - 18,
      y,
      14,
      enabled ? COLORS.success : COLORS.textSecondary
    );

    const updateToggle = (newEnabled: boolean) => {
      this.tweens.add({
        targets: toggleKnob,
        x: newEnabled ? toggleX + 18 : toggleX - 18,
        duration: 200,
        ease: 'Sine.easeInOut',
        onUpdate: () => {
          toggleKnob.setFillStyle(newEnabled ? COLORS.success : COLORS.textSecondary);
        }
      });
      toggleBg.setFillStyle(newEnabled ? COLORS.success : COLORS.cardBorder);
      this.stateManager.updateSettings({ vibrationEnabled: newEnabled });
      if (newEnabled) {
        this.audioManager.vibrate(30);
      }
    };

    toggleBg.on('pointerdown', () => {
      const newEnabled = !this.stateManager.isVibrationEnabled();
      updateToggle(newEnabled);
    });

    this.add.text(x - 180, y + 25, '办公模式建议关闭', {
      fontSize: '13px',
      color: COLORS.textSecondary.toString(16)
    }).setOrigin(0, 0.5);
  }

  private createTutorialReset(x: number, y: number): void {
    this.add.text(x - 180, y, '📖 新手引导', {
      fontSize: '22px',
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    const resetBtn = this.add.rectangle(x + 150, y, 120, 40, COLORS.warning)
      .setStrokeStyle(2, 0xffffff, 0.3)
      .setInteractive({ useHandCursor: true });

    this.add.text(x + 150, y, '重新开始', {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    resetBtn.on('pointerover', () => {
      resetBtn.setScale(1.05);
    });

    resetBtn.on('pointerout', () => {
      resetBtn.setScale(1);
    });

    resetBtn.on('pointerdown', () => {
      this.audioManager.playClick();
      this.stateManager.updateSettings({ tutorialCompleted: false });
      this.scene.start('TutorialScene');
    });
  }
}
