import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import type { EventOption } from '@/types/game';

export class EventScene extends BaseScene {
  private eventType = 'device_offline';
  private eventTitle!: Phaser.GameObjects.Text;
  private eventDescription!: Phaser.GameObjects.Text;
  private optionsContainer!: Phaser.GameObjects.Container;
  private warningIcon!: Phaser.GameObjects.Text;
  private countdownText!: Phaser.GameObjects.Text;
  private countdownTimer!: Phaser.Time.TimerEvent;
  private remainingTime = 15;

  constructor() {
    super('EventScene');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x000000);
    this.fadeIn(200);

    this.createEventOverlay();
    this.createEventContent();
    this.createCountdown();
    this.setupKeyboardShortcuts();

    this.playSound('warning');
  }

  private createEventOverlay(): void {
    const overlay = this.add.rectangle(
      this.centerX,
      this.centerY,
      this.width,
      this.height,
      0x000000,
      0.85
    ).setAlpha(0);

    this.tweens.add({
      targets: overlay,
      alpha: 0.85,
      duration: 300,
    });

    const flash = this.add.graphics();
    flash.fillStyle(0xD32F2F, 0.3);
    flash.fillRect(0, 0, this.width, this.height);
    flash.setAlpha(0);

    this.tweens.add({
      targets: flash,
      alpha: 0.3,
      duration: 150,
      yoyo: true,
      repeat: 3,
      onComplete: () => flash.destroy(),
    });
  }

  private createEventContent(): void {
    const state = this.gameStore.getState();
    const activeEvent = state.activeEvent;
    if (!activeEvent) return;

    const affectedPoint = state.points.find(p => p.id === activeEvent.pointId);

    const panelWidth = 600;
    const panelHeight = 480;

    const panel = this.addPanel(this.centerX, this.centerY, panelWidth, panelHeight, {
      bgColor: 0x2D1B1B,
      strokeColor: 0xD32F2F,
      strokeWidth: 3,
    });

    this.warningIcon = this.add.text(this.centerX, this.centerY - 180, '⚠️', {
      fontSize: '64px',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: this.warningIcon,
      scale: 1.2,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    this.eventTitle = this.add.text(this.centerX, this.centerY - 100, '设备离线警报！', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#D32F2F',
    }).setOrigin(0.5);

    const storeInfo = affectedPoint
      ? `【${affectedPoint.storeName}】${affectedPoint.name}`
      : '未知设备';

    this.eventDescription = this.add.text(
      this.centerX,
      this.centerY - 50,
      `检测到设备离线：\n${storeInfo}\n\n请立即选择处理方案：`,
      {
        fontFamily: 'Inter, sans-serif',
        fontSize: '18px',
        color: '#FFFFFF',
        align: 'center',
        lineSpacing: 8,
      }
    ).setOrigin(0.5);

    this.createOptionButtons(activeEvent.options, this.centerX, this.centerY + 40);
  }

  private createOptionButtons(options: EventOption[], centerX: number, startY: number): void {
    this.optionsContainer = this.add.container(centerX, startY);

    const buttonWidth = 400;
    const buttonHeight = 70;
    const spacing = 20;

    options.forEach((option, index) => {
      const y = index * (buttonHeight + spacing);

      const isRecommended = option.id === 'remote_restart';
      const isRisky = option.id === 'ignore';

      let bgColor = 0x4A4A4A;
      let hoverColor = 0x5A5A5A;
      let borderColor = 0x666666;

      if (isRecommended) {
        bgColor = 0x2E5D2E;
        hoverColor = 0x3E7D3E;
        borderColor = 0x4CAF50;
      } else if (isRisky) {
        bgColor = 0x5D2E2E;
        hoverColor = 0x7D3E3E;
        borderColor = 0xD32F2F;
      }

      const container = this.add.container(0, y);

      const bg = this.add.graphics();
      bg.fillStyle(bgColor, 0.9);
      bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 12);
      bg.lineStyle(2, borderColor, 1);
      bg.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 12);

      const label = this.add.text(-buttonWidth / 2 + 25, -15, option.label, {
        fontFamily: 'Inter, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#FFFFFF',
      }).setOrigin(0);

      const desc = this.add.text(-buttonWidth / 2 + 25, 15, option.description, {
        fontFamily: 'Inter, sans-serif',
        fontSize: '13px',
        color: '#AAAAAA',
      }).setOrigin(0);

      const scoreText = option.scoreImpact >= 0
        ? `+${option.scoreImpact}分`
        : `${option.scoreImpact}分`;
      const timeText = option.timeImpact !== 0
        ? `${option.timeImpact > 0 ? '+' : ''}${option.timeImpact}秒`
        : '';

      const impactText = this.add.text(
        buttonWidth / 2 - 25,
        0,
        timeText ? `${scoreText} · ${timeText}` : scoreText,
        {
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
          fontStyle: 'bold',
          color: option.scoreImpact >= 0 ? '#4CAF50' : '#D32F2F',
        }
      ).setOrigin(1, 0.5);

      if (isRecommended) {
        const badge = this.add.text(buttonWidth / 2 - 25, -22, '推荐', {
          fontFamily: 'Inter, sans-serif',
          fontSize: '11px',
          fontStyle: 'bold',
          color: '#4CAF50',
          backgroundColor: '#1A3A1A',
          padding: { x: 8, y: 2 },
        }).setOrigin(1, 0.5);
        container.add(badge);
      }

      const shortcut = this.add.text(-buttonWidth / 2 + 25, -buttonHeight / 2 + 12, `[${index + 1}]`, {
        fontFamily: 'Inter, sans-serif',
        fontSize: '11px',
        color: '#888888',
      }).setOrigin(0);

      container.add([bg, label, desc, impactText, shortcut]);
      container.setSize(buttonWidth, buttonHeight);
      container.setInteractive({ useHandCursor: true });

      container.on('pointerover', () => {
        bg.clear();
        bg.fillStyle(hoverColor, 0.95);
        bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 12);
        bg.lineStyle(2, borderColor, 1);
        bg.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 12);
      });

      container.on('pointerout', () => {
        bg.clear();
        bg.fillStyle(bgColor, 0.9);
        bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 12);
        bg.lineStyle(2, borderColor, 1);
        bg.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 12);
      });

      container.on('pointerdown', () => {
        this.selectOption(option.id);
      });

      container.setName(`option_${index}`);
      this.optionsContainer.add(container);
    });
  }

  private createCountdown(): void {
    this.countdownText = this.add.text(this.centerX, this.centerY + 200, '', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#FF9800',
    }).setOrigin(0.5);

    this.updateCountdownDisplay();

    this.countdownTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.remainingTime--;
        this.updateCountdownDisplay();

        if (this.remainingTime <= 0) {
          this.countdownTimer.remove();
          this.selectOption('ignore');
        }
      },
      loop: true,
    });
  }

  private updateCountdownDisplay(): void {
    const urgency = this.remainingTime <= 5 ? '#D32F2F' : '#FF9800';
    this.countdownText.setColor(urgency);
    this.countdownText.setText(`⏱ 自动处理倒计时：${this.remainingTime}秒`);

    if (this.remainingTime <= 5) {
      this.tweens.add({
        targets: this.countdownText,
        scale: 1.1,
        duration: 200,
        yoyo: true,
      });
    }
  }

  private selectOption(optionId: string): void {
    if (this.countdownTimer) {
      this.countdownTimer.remove();
    }

    this.playSound('click');

    const state = this.gameStore.getState();
    const option = state.activeEvent?.options.find(o => o.id === optionId);

    if (option) {
      if (option.scoreImpact >= 0) {
        this.addParticles(this.centerX, this.centerY, 0x4CAF50, 25);
        this.playSound('success');
      } else {
        this.shake(150, 0.005);
        this.playSound('error');
      }
    }

    this.gameStore.getState().handleEventChoice(optionId);

    this.tweens.add({
      targets: [this.warningIcon, this.eventTitle, this.eventDescription, this.optionsContainer, this.countdownText],
      alpha: 0,
      scale: 0.9,
      duration: 300,
      ease: 'Back.In',
      onComplete: () => {
        this.fadeOut(200, () => {
          this.scene.resume('GameScene');
          this.scene.stop();
        });
      },
    });
  }

  private setupKeyboardShortcuts(): void {
    this.input.keyboard!.on('keydown-ONE', () => {
      this.selectOption('remote_restart');
    });

    this.input.keyboard!.on('keydown-TWO', () => {
      this.selectOption('onsite');
    });

    this.input.keyboard!.on('keydown-THREE', () => {
      this.selectOption('ignore');
    });

    this.input.keyboard!.on('keydown-ENTER', () => {
      this.selectOption('remote_restart');
    });

    this.input.keyboard!.on('keydown-ESC', () => {
      this.selectOption('ignore');
    });
  }
}
