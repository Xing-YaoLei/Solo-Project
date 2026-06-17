import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x1e3a5f, 0.8);
    progressBox.fillRect(this.scale.width / 2 - 160, this.scale.height / 2 - 25, 320, 50);

    const loadingText = this.make.text({
      x: this.scale.width / 2,
      y: this.scale.height / 2 - 50,
      text: '加载中...',
      style: {
        font: '20px "Source Han Sans", "PingFang SC", "Microsoft YaHei", sans-serif',
        color: '#ffffff'
      }
    });
    loadingText.setOrigin(0.5, 0.5);

    const percentText = this.make.text({
      x: this.scale.width / 2,
      y: this.scale.height / 2,
      text: '0%',
      style: {
        font: '18px "Source Han Sans", "PingFang SC", "Microsoft YaHei", sans-serif',
        color: '#ffffff'
      }
    });
    percentText.setOrigin(0.5, 0.5);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xf59e0b, 1);
      progressBar.fillRect(
        this.scale.width / 2 - 150,
        this.scale.height / 2 - 15,
        300 * value,
        30
      );
      percentText.setText(Math.floor(value * 100) + '%');
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0f172a');

    this.tweens.add({
      targets: this.cameras.main,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        this.scene.start('MainMenu');
      }
    });
  }
}
