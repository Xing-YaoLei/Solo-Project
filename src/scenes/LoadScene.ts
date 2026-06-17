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
    this.time.delayedCall(500, () => {
      this.progress = 30;
      this.onProgress?.(this.progress);
    });

    this.time.delayedCall(1000, () => {
      this.progress = 60;
      this.onProgress?.(this.progress);
    });

    this.time.delayedCall(1500, () => {
      this.progress = 90;
      this.onProgress?.(this.progress);
    });

    this.time.delayedCall(2000, () => {
      this.progress = 100;
      this.onProgress?.(this.progress);
      this.onComplete?.();
    });
  }

  create() {
    this.scene.start('InspectionScene', { levelId: this.levelId });
  }
}

export default LoadScene;
