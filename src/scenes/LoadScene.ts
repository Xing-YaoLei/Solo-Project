import Phaser from 'phaser';

interface LoadSceneData {
  levelId: string;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
}

export class LoadScene extends Phaser.Scene {
  private progress = 0;
  private levelId = '';
  private onProgress?: (progress: number) => void;
  private onComplete?: () => void;

  constructor() {
    super('LoadScene');
  }

  init(data: LoadSceneData) {
    this.levelId = data.levelId;
    this.onProgress = data.onProgress;
    this.onComplete = data.onComplete;
  }

  preload() {
    this.load.on('progress', (value: number) => {
      this.progress = Math.round(value * 100);
      this.onProgress?.(this.progress);
    });

    this.load.on('complete', () => {
      this.onComplete?.();
    });

    this.loadAssets();
  }

  private loadAssets() {
    this.load.image('building-office', 'assets/images/building-office.png');
    this.load.image('building-retail', 'assets/images/building-retail.png');
    this.load.image('building-restaurant', 'assets/images/building-restaurant.png');
    this.load.image('building-warehouse', 'assets/images/building-warehouse.png');
    this.load.image('patrol-point', 'assets/images/patrol-point.png');
    this.load.image('road', 'assets/images/road.png');
    this.load.image('grass', 'assets/images/grass.png');

    this.time.delayedCall(500, () => {
      this.load.emit('progress', 0.3);
    });

    this.time.delayedCall(1000, () => {
      this.load.emit('progress', 0.6);
    });

    this.time.delayedCall(1500, () => {
      this.load.emit('progress', 0.9);
    });

    this.time.delayedCall(2000, () => {
      this.load.emit('complete');
    });
  }

  create() {
    this.scene.start('InspectionScene', { levelId: this.levelId });
  }
}

export default LoadScene;
