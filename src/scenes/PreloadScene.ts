import Phaser from 'phaser';
import { SCENE_KEYS } from '@/types/game';
import { audioUtils } from '@/utils/audio';

export class PreloadScene extends Phaser.Scene {
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressBox!: Phaser.GameObjects.Graphics;
  private loadingText!: Phaser.GameObjects.Text;
  private percentText!: Phaser.GameObjects.Text;
  private assetText!: Phaser.GameObjects.Text;

  constructor() {
    super(SCENE_KEYS.Preload);
  }

  preload(): void {
    this.createProgressBar();
    this.load.on('progress', (value: number) => {
      this.updateProgressBar(value);
    });
    this.load.on('fileprogress', (file: { key: string }) => {
      this.assetText.setText('Loading asset: ' + file.key);
    });
    this.load.on('complete', () => {
      console.log('PreloadScene: All assets loaded');
    });
  }

  private createProgressBar(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x222222, 0.8);
    this.progressBox.fillRect(width / 2 - 160, height / 2 - 30, 320, 50);
    this.progressBar = this.add.graphics();
    this.loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: '正在加载...',
      style: {
        font: '20px "Noto Sans SC"',
        color: '#ffffff',
      },
    }).setOrigin(0.5, 0.5);
    this.percentText = this.make.text({
      x: width / 2,
      y: height / 2 - 5,
      text: '0%',
      style: {
        font: '18px "Noto Sans SC"',
        color: '#ffffff',
      },
    }).setOrigin(0.5, 0.5);
    this.assetText = this.make.text({
      x: width / 2,
      y: height / 2 + 50,
      text: '',
      style: {
        font: '18px "Noto Sans SC"',
        color: '#ffffff',
      },
    }).setOrigin(0.5, 0.5);
  }

  private updateProgressBar(value: number): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    this.progressBar.clear();
    this.progressBar.fillStyle(0x1E88E5, 1);
    this.progressBar.fillRect(width / 2 - 150, height / 2 - 20, 300 * value, 30);
    this.percentText.setText(Math.floor(value * 100) + '%');
  }

  create(): void {
    this.tweens.add({
      targets: [this.progressBar, this.progressBox, this.loadingText, this.percentText, this.assetText],
      alpha: 0,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        audioUtils.resumeAudio();
        this.scene.start(SCENE_KEYS.MainMenu);
      },
    });
  }
}
