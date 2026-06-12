import Phaser from 'phaser';
import { useGameStore } from '@/store/useGameStore';
import { useConfigStore } from '@/store/useConfigStore';
import { useTrackingStore } from '@/store/useTrackingStore';

export abstract class BaseScene extends Phaser.Scene {
  protected gameStore = useGameStore;
  protected configStore = useConfigStore;
  protected trackingStore = useTrackingStore;
  protected centerX: number = 0;
  protected centerY: number = 0;
  protected width: number = 0;
  protected height: number = 0;

  constructor(key: string) {
    super(key);
  }

  init(): void {
    this.width = this.cameras.main.width;
    this.height = this.cameras.main.height;
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
  }

  create(): void {
    this.setupCamera();
    this.createBackground();
  }

  protected setupCamera(): void {
    this.cameras.main.setBackgroundColor('#1A1A2E');
  }

  protected createBackground(): void {
    const gradient = this.add.graphics();
    gradient.fillGradientStyle(
      0x2D1B14,
      0x3E2723,
      0x1A0F0A,
      0x2D1B14,
      1
    );
    gradient.fillRect(0, 0, this.width, this.height);

    for (let i = 0; i < 20; i++) {
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      const size = 2 + Math.random() * 4;
      const circle = this.add.circle(x, y, size, 0xFF6F00, 0.1);
      this.tweens.add({
        targets: circle,
        alpha: 0.3,
        duration: 2000 + Math.random() * 2000,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  protected addText(
    x: number,
    y: number,
    text: string,
    style: Phaser.Types.GameObjects.Text.TextStyle = {}
  ): Phaser.GameObjects.Text {
    const defaultStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'Inter, sans-serif',
      fontSize: '16px',
      color: '#FFFFFF',
      ...style,
    };
    return this.add.text(x, y, text, defaultStyle).setOrigin(0.5);
  }

  protected addButton(
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    onClick: () => void,
    options: {
      bgColor?: number;
      hoverColor?: number;
      textColor?: string;
      borderRadius?: number;
      disabled?: boolean;
    } = {}
  ): Phaser.GameObjects.Container {
    const {
      bgColor = 0xFF6F00,
      hoverColor = 0xFF8F3F,
      textColor = '#FFFFFF',
      borderRadius = 8,
      disabled = false,
    } = options;

    const container = this.add.container(x, y);

    const background = this.add.graphics();
    background.fillStyle(bgColor, 1);
    background.fillRoundedRect(-width / 2, -height / 2, width, height, borderRadius);

    const textObj = this.addText(0, 0, text, {
      fontSize: '18px',
      color: textColor,
      fontStyle: 'bold',
    });

    container.add([background, textObj]);

    if (!disabled) {
      container.setSize(width, height);
      container.setInteractive({ useHandCursor: true });

      container.on('pointerover', () => {
        background.clear();
        background.fillStyle(hoverColor, 1);
        background.fillRoundedRect(-width / 2, -height / 2, width, height, borderRadius);
        container.y -= 2;
      });

      container.on('pointerout', () => {
        background.clear();
        background.fillStyle(bgColor, 1);
        background.fillRoundedRect(-width / 2, -height / 2, width, height, borderRadius);
        container.y += 2;
      });

      container.on('pointerdown', () => {
        container.setScale(0.95);
      });

      container.on('pointerup', () => {
        container.setScale(1);
        onClick();
      });
    } else {
      background.clear();
      background.fillStyle(0x666666, 0.5);
      background.fillRoundedRect(-width / 2, -height / 2, width, height, borderRadius);
      textObj.setColor('#999999');
    }

    return container;
  }

  protected addPanel(
    x: number,
    y: number,
    width: number,
    height: number,
    options: {
      bgColor?: number;
      alpha?: number;
      borderRadius?: number;
      strokeColor?: number;
      strokeWidth?: number;
    } = {}
  ): Phaser.GameObjects.Graphics {
    const {
      bgColor = 0x2D2D2D,
      alpha = 0.95,
      borderRadius = 12,
      strokeColor = 0xFF6F00,
      strokeWidth = 2,
    } = options;

    const panel = this.add.graphics();
    panel.fillStyle(bgColor, alpha);
    panel.fillRoundedRect(x - width / 2, y - height / 2, width, height, borderRadius);

    if (strokeWidth > 0) {
      panel.lineStyle(strokeWidth, strokeColor, alpha);
      panel.strokeRoundedRect(x - width / 2, y - height / 2, width, height, borderRadius);
    }

    return panel;
  }

  protected formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  protected getStatusColor(status: 'normal' | 'need_clean' | 'fault'): number {
    const colors = {
      normal: 0x4CAF50,
      need_clean: 0xFF9800,
      fault: 0xD32F2F,
    };
    return colors[status];
  }

  protected getStatusText(status: 'normal' | 'need_clean' | 'fault'): string {
    const texts = {
      normal: '正常',
      need_clean: '待清洁',
      fault: '故障',
    };
    return texts[status];
  }

  protected playSound(type: 'click' | 'success' | 'error' | 'warning' | 'complete'): void {
    try {
      const frequencies: Record<string, number[]> = {
        click: [800],
        success: [523, 659, 784],
        error: [200, 150],
        warning: [440, 440],
        complete: [523, 659, 784, 1047],
      };

      const freqs = frequencies[type] || [440];
      let time = 0;

      freqs.forEach((freq) => {
        this.time.delayedCall(time, () => {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.frequency.value = freq;
          oscillator.type = 'sine';

          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.2);
        });
        time += 150;
      });
    } catch (e) {
    }
  }

  protected fadeIn(duration = 500): void {
    this.cameras.main.fadeIn(duration, 0, 0, 0);
  }

  protected fadeOut(duration = 500, onComplete?: () => void): void {
    this.cameras.main.fadeOut(duration, 0, 0, 0);
    if (onComplete) {
      this.cameras.main.once('camerafadeoutcomplete', onComplete);
    }
  }

  protected addParticles(
    x: number,
    y: number,
    color: number = 0xFF6F00,
    count: number = 20
  ): void {
    const particles = this.add.particles(x, y, '', {
      speed: { min: 50, max: 150 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      lifespan: 500,
      tint: color,
      quantity: count,
      emitting: false,
    });
    particles.explode(count, x, y);
    this.time.delayedCall(600, () => particles.destroy());
  }

  protected shake(duration = 100, intensity = 0.01): void {
    this.cameras.main.shake(duration, intensity);
  }
}
