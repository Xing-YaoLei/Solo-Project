import Phaser from 'phaser';
import { SettingsSystem } from '@/systems/SettingsSystem';

const BG = 0x1a1a2e;
const GOLD = 0xffd54f;

const INTENSITY_LABELS: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
  off: '关',
};

export class MenuScene extends Phaser.Scene {
  private settings!: SettingsSystem;
  private overlayContainer!: Phaser.GameObjects.Container;
  private settingsContainer!: Phaser.GameObjects.Container;
  private soundIcon!: Phaser.GameObjects.Image;
  private vibrationIcon!: Phaser.GameObjects.Image;
  private animLabel!: Phaser.GameObjects.Text;
  private title!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'Menu' });
  }

  create(): void {
    this.settings = new SettingsSystem();

    const { width, height } = this.cameras.main;
    const cx = width / 2;

    this.cameras.main.setBackgroundColor(BG);

    this.title = this.add.text(cx, height * 0.22, '景区演出排期', {
      fontSize: '48px',
      color: '#' + GOLD.toString(16).padStart(6, '0'),
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(cx, height * 0.22 + 56, '经营模拟', {
      fontSize: '24px',
      color: '#cccccc',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.createButton(cx, height * 0.48, 'btn_primary', '开始游戏', () => {
      this.scene.start('LevelSelect');
    });

    this.createButton(cx, height * 0.58, 'btn_success', '复盘统计', () => {
      this.scene.start('Review');
    });

    this.createButton(cx, height * 0.68, 'btn_danger', '设置', () => {
      this.openSettings();
    });

    this.overlayContainer = this.add.container(0, 0).setVisible(false).setDepth(10);
    this.settingsContainer = this.add.container(0, 0).setVisible(false).setDepth(11);

    this.startTitleTween();
  }

  private createButton(
    x: number,
    y: number,
    texture: string,
    label: string,
    onClick: () => void,
  ): void {
    const btn = this.add.image(x, y, texture).setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    btn.on('pointerover', () => btn.setAlpha(0.85));
    btn.on('pointerout', () => btn.setAlpha(1));
    btn.on('pointerdown', () => btn.setAlpha(0.7));
    btn.on('pointerup', () => {
      btn.setAlpha(1);
      onClick();
    });
  }

  private openSettings(): void {
    const { width, height } = this.cameras.main;
    const cx = width / 2;
    const cy = height / 2;

    const bg = this.add.rectangle(cx, cy, width, height, 0x000000, 0.5)
      .setInteractive()
      .setDepth(10);
    this.overlayContainer.add(bg);
    this.overlayContainer.setVisible(true);

    const panelW = 360;
    const panelH = 320;
    const panel = this.add.rectangle(cx, cy, panelW, panelH, 0x2a2a4a, 0.95)
      .setStrokeStyle(1, 0xffffff, 0.1)
      .setDepth(11);

    const panelTitle = this.add.text(cx, cy - 120, '设置', {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(11);

    const startY = cy - 60;
    const rowSpacing = 64;

    this.soundIcon = this.add.image(cx - 80, startY, this.settings.soundEnabled ? 'icon_sound_on' : 'icon_sound_off')
      .setInteractive({ useHandCursor: true })
      .setDepth(11);
    const soundLabel = this.add.text(cx - 56, startY, '音效', {
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0, 0.5).setDepth(11);
    const soundState = this.add.text(cx + 100, startY, this.settings.soundEnabled ? '开' : '关', {
      fontSize: '20px',
      color: this.settings.soundEnabled ? '#66bb6a' : '#ef5350',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(11).setName('soundState');

    this.soundIcon.on('pointerup', () => {
      const on = this.settings.toggleSound();
      this.soundIcon.setTexture(on ? 'icon_sound_on' : 'icon_sound_off');
      const stateText = this.settingsContainer.getByName('soundState') as Phaser.GameObjects.Text;
      stateText.setText(on ? '开' : '关');
      stateText.setColor(on ? '#66bb6a' : '#ef5350');
    });

    const animIcon = this.add.image(cx - 80, startY + rowSpacing, 'icon_anim')
      .setInteractive({ useHandCursor: true })
      .setDepth(11);
    this.add.text(cx - 56, startY + rowSpacing, '动画强度', {
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0, 0.5).setDepth(11);
    this.animLabel = this.add.text(cx + 100, startY + rowSpacing, INTENSITY_LABELS[this.settings.animationIntensity], {
      fontSize: '20px',
      color: '#4fc3f7',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(11).setName('animLabel');

    animIcon.on('pointerup', () => {
      const intensity = this.settings.cycleAnimationIntensity();
      const label = this.settingsContainer.getByName('animLabel') as Phaser.GameObjects.Text;
      label.setText(INTENSITY_LABELS[intensity]);
      this.startTitleTween();
    });

    this.vibrationIcon = this.add.image(cx - 80, startY + rowSpacing * 2, this.settings.vibrationEnabled ? 'icon_vibration_on' : 'icon_vibration_off')
      .setInteractive({ useHandCursor: true })
      .setDepth(11);
    this.add.text(cx - 56, startY + rowSpacing * 2, '震动', {
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0, 0.5).setDepth(11);
    const vibState = this.add.text(cx + 100, startY + rowSpacing * 2, this.settings.vibrationEnabled ? '开' : '关', {
      fontSize: '20px',
      color: this.settings.vibrationEnabled ? '#66bb6a' : '#ef5350',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(11).setName('vibState');

    this.vibrationIcon.on('pointerup', () => {
      const on = this.settings.toggleVibration();
      this.vibrationIcon.setTexture(on ? 'icon_vibration_on' : 'icon_vibration_off');
      const stateText = this.settingsContainer.getByName('vibState') as Phaser.GameObjects.Text;
      stateText.setText(on ? '开' : '关');
      stateText.setColor(on ? '#66bb6a' : '#ef5350');
    });

    const closeBtn = this.add.image(cx, cy + 120, 'btn_small')
      .setInteractive({ useHandCursor: true })
      .setDepth(11);
    const closeTxt = this.add.text(cx, cy + 120, '关闭', {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(11);

    closeBtn.on('pointerover', () => closeBtn.setAlpha(0.85));
    closeBtn.on('pointerout', () => closeBtn.setAlpha(1));
    closeBtn.on('pointerdown', () => closeBtn.setAlpha(0.7));
    closeBtn.on('pointerup', () => {
      closeBtn.setAlpha(1);
      this.closeSettings();
    });

    this.settingsContainer.add([
      panel, panelTitle,
      this.soundIcon, soundLabel, soundState,
      animIcon, this.animLabel,
      this.vibrationIcon, vibState,
      closeBtn, closeTxt,
    ]);
    this.settingsContainer.setVisible(true);
  }

  private closeSettings(): void {
    this.overlayContainer.removeAll(true);
    this.settingsContainer.removeAll(true);
    this.overlayContainer.setVisible(false);
    this.settingsContainer.setVisible(false);
  }

  private startTitleTween(): void {
    if (this.tweens.isTweening(this.title)) {
      this.tweens.killTweensOf(this.title);
    }
    this.title.y = this.cameras.main.height * 0.22;

    if (!this.settings.shouldAnimate()) return;

    const mult = this.settings.getAnimDurationMultiplier();
    const duration = 2000 * mult;

    this.tweens.add({
      targets: this.title,
      y: this.title.y - 8,
      duration,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}
