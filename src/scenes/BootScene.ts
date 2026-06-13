import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
    bg.fillRect(0, 0, width, height);

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    const loadingText = this.add.text(width / 2, height / 2 - 50, '加载中...', {
      fontSize: '20px',
      color: '#e0e0e0',
      fontFamily: 'Arial',
    });
    loadingText.setOrigin(0.5);

    const percentText = this.add.text(width / 2, height / 2, '0%', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Arial',
    });
    percentText.setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x4fc3f7, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
      percentText.setText(Math.round(value * 100) + '%');
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });

    this.generateTextures();
  }

  private generateTextures(): void {
    this.createBtnTexture('btn_normal', 0x2d5f8a, 0x3a7cb8);
    this.createBtnTexture('btn_hover', 0x3a7cb8, 0x4fc3f7);
    this.createBtnTexture('btn_danger', 0xc0392b, 0xe74c3c);
    this.createBtnTexture('btn_success', 0x27ae60, 0x2ecc71);
    this.createBtnTexture('btn_warning', 0xd4a017, 0xf1c40f);

    const warnGfx = this.add.graphics();
    warnGfx.fillStyle(0xff5722, 0.3);
    warnGfx.fillRoundedRect(0, 0, 48, 48, 8);
    warnGfx.lineStyle(2, 0xff5722, 1);
    warnGfx.strokeRoundedRect(0, 0, 48, 48, 8);
    warnGfx.generateTexture('warning_icon', 48, 48);
    warnGfx.destroy();

    const dangerGfx = this.add.graphics();
    dangerGfx.fillStyle(0xe74c3c, 0.4);
    dangerGfx.fillRoundedRect(0, 0, 48, 48, 8);
    dangerGfx.lineStyle(2, 0xe74c3c, 1);
    dangerGfx.strokeRoundedRect(0, 0, 48, 48, 8);
    dangerGfx.generateTexture('danger_icon', 48, 48);
    dangerGfx.destroy();
  }

  private createBtnTexture(key: string, fillColor: number, strokeColor: number): void {
    const gfx = this.add.graphics();
    gfx.fillStyle(fillColor, 1);
    gfx.fillRoundedRect(0, 0, 200, 48, 8);
    gfx.lineStyle(2, strokeColor, 1);
    gfx.strokeRoundedRect(0, 0, 200, 48, 8);
    gfx.generateTexture(key, 200, 48);
    gfx.destroy();
  }

  create(): void {
    this.scene.start('MenuScene');
  }
}
