import Phaser from 'phaser';
import { GameConfig, Settings, DEFAULT_SETTINGS } from '../config/GameConfig';
import { UIHelper } from '../utils/UIHelper';
import { SettingsManager } from '../data/SettingsManager';
import { SoundManager } from '../data/SoundManager';

export class SettingsScene extends Phaser.Scene {
  private fromScene: string = 'MenuScene';

  constructor() {
    super({ key: 'SettingsScene' });
  }

  init(data?: { from?: string }): void {
    this.fromScene = data?.from ?? 'MenuScene';
  }

  create(): void {
    SoundManager.getInstance().setScene(this);

    const centerX = GameConfig.GAME_WIDTH / 2;

    const bg = this.add.graphics();
    bg.fillStyle(GameConfig.COLORS.background, 1);
    bg.fillRect(0, 0, GameConfig.GAME_WIDTH, GameConfig.GAME_HEIGHT);

    const title = this.add.text(centerX, 60, '游戏设置', {
      fontSize: '40px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);
    UIHelper.animateIn(this, title);

    UIHelper.createButton(
      this, 80, 60, 100, 44, '返回',
      () => this.scene.start(this.fromScene),
      { bgColor: 0x6b7280, fontSize: 18 }
    );

    const panelWidth = 600;
    const panelHeight = 480;
    const panel = UIHelper.createPanel(this, centerX, GameConfig.GAME_HEIGHT / 2 + 20, panelWidth, panelHeight, {
      bgColor: GameConfig.COLORS.panel,
      hasBorder: true
    });
    UIHelper.animateIn(this, panel, 300);

    const settings = SettingsManager.getInstance().getSettings();

    UIHelper.createToggle(
      this, centerX - 60, 180,
      '🔊 声音',
      settings.soundEnabled,
      (value) => {
        SettingsManager.getInstance().updateSettings({ soundEnabled: value });
        if (value) SoundManager.getInstance().playClick();
      }
    );

    UIHelper.createToggle(
      this, centerX - 60, 240,
      '📳 震动',
      settings.vibrationEnabled,
      (value) => {
        SettingsManager.getInstance().updateSettings({ vibrationEnabled: value });
        SoundManager.getInstance().playClick();
        if (value) {
          SettingsManager.getInstance().vibrate(100);
        }
      }
    );

    const intensityIndex = ['off', 'low', 'medium', 'high'].indexOf(settings.animationIntensity);
    UIHelper.createSlider(
      this, centerX, 330,
      '✨ 动画强度',
      [
        { label: '关闭', value: 'off' },
        { label: '低', value: 'low' },
        { label: '中', value: 'medium' },
        { label: '高', value: 'high' }
      ],
      intensityIndex,
      (_index, value) => {
        SettingsManager.getInstance().updateSettings({ animationIntensity: value as Settings['animationIntensity'] });
      }
    );

    const hintTitle = this.add.text(centerX, 420, '💡 办公室模式提示', {
      fontSize: '18px',
      color: GameConfig.COLORS.warning.toString(16).padStart(6, '0'),
      fontStyle: 'bold'
    });
    hintTitle.setOrigin(0.5);

    const hintText = this.add.text(centerX, 450, '关闭声音和震动，降低动画强度，', {
      fontSize: '14px',
      color: '#888888'
    });
    hintText.setOrigin(0.5);

    const hintText2 = this.add.text(centerX, 475, '在办公室练习时不打扰他人', {
      fontSize: '14px',
      color: '#888888'
    });
    hintText2.setOrigin(0.5);

    UIHelper.createButton(
      this, centerX, 530, 240, 48,
      '一键开启办公室模式',
      () => {
        SettingsManager.getInstance().updateSettings({
          soundEnabled: false,
          vibrationEnabled: false,
          animationIntensity: 'low'
        });
        this.scene.restart({ from: this.fromScene });
      },
      { bgColor: 0x7c3aed, fontSize: 18 }
    );

    UIHelper.createButton(
      this, centerX, 600, 180, 40,
      '恢复默认设置',
      () => {
        SettingsManager.getInstance().updateSettings(DEFAULT_SETTINGS);
        this.scene.restart({ from: this.fromScene });
      },
      { bgColor: 0x555555, fontSize: 16 }
    );

    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start(this.fromScene);
    });
  }
}
