import { GameObjects, Scene } from 'phaser';
import { COLORS } from '../utils/constants';

export interface ProgressBarConfig {
  x: number;
  y: number;
  width: number;
  height?: number;
  backgroundColor?: string;
  fillColor?: string;
  radius?: number;
  showText?: boolean;
}

export class ProgressBar extends GameObjects.Container {
  private background: GameObjects.Graphics;
  private fill: GameObjects.Graphics;
  private textObj?: GameObjects.Text;
  private config: Required<ProgressBarConfig>;
  private _progress: number = 0;

  constructor(scene: Scene, config: ProgressBarConfig) {
    super(scene, config.x, config.y);

    this.config = {
      height: 12,
      backgroundColor: '#333333',
      fillColor: COLORS.accent,
      radius: 6,
      showText: false,
      ...config,
    };

    this.background = scene.add.graphics();
    this.add(this.background);

    this.fill = scene.add.graphics();
    this.add(this.fill);

    if (this.config.showText) {
      this.textObj = scene.add.text(0, 0, '0%', {
        fontSize: '14px',
        color: COLORS.white,
        fontFamily: '"Segoe UI", Roboto, sans-serif',
      });
      this.textObj.setOrigin(0.5);
      this.add(this.textObj);
    }

    this.draw();
    scene.add.existing(this);
  }

  private draw(): void {
    const { width, height, radius, backgroundColor } = this.config;

    this.background.clear();
    const bgColor = Phaser.Display.Color.HexStringToColor(backgroundColor).color;
    this.background.fillStyle(bgColor, 0.5);
    this.background.fillRoundedRect(-width / 2, -height / 2, width, height, radius);

    this.fill.clear();
    const fillColor = Phaser.Display.Color.HexStringToColor(this.config.fillColor).color;
    const fillWidth = width * this._progress;
    
    if (fillWidth > 0) {
      this.fill.fillStyle(fillColor, 1);
      this.fill.fillRoundedRect(-width / 2, -height / 2, fillWidth, height, radius);
    }

    if (this.textObj) {
      this.textObj.setText(`${Math.round(this._progress * 100)}%`);
    }
  }

  set progress(value: number) {
    this._progress = Math.max(0, Math.min(1, value));
    this.draw();
  }

  get progress(): number {
    return this._progress;
  }

  setFillColor(color: string): void {
    this.config.fillColor = color;
    this.draw();
  }

  animateTo(targetProgress: number, duration: number = 500): Promise<void> {
    return new Promise((resolve) => {
      const startProgress = this._progress;
      const startTime = this.scene.time.now;

      const update = () => {
        const elapsed = this.scene.time.now - startTime;
        const t = Math.min(1, elapsed / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        
        this._progress = startProgress + (targetProgress - startProgress) * eased;
        this.draw();

        if (t < 1) {
          this.scene.time.delayedCall(16, update);
        } else {
          resolve();
        }
      };

      update();
    });
  }
}
