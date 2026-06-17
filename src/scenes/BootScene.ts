import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
  }

  create() {
    this.generateTextures();
  }

  private generateTextures() {
    const graphics = this.add.graphics();

    graphics.fillStyle(0x2d3748);
    graphics.fillRect(0, 0, 64, 64);
    graphics.lineStyle(2, 0x4a5568);
    graphics.strokeRect(0, 0, 64, 64);
    graphics.generateTexture('building-office', 64, 64);
    graphics.clear();

    graphics.fillStyle(0x1a365d);
    graphics.fillRect(0, 0, 64, 64);
    graphics.lineStyle(2, 0x2c5282);
    graphics.strokeRect(0, 0, 64, 64);
    graphics.generateTexture('building-retail', 64, 64);
    graphics.clear();

    graphics.fillStyle(0x742a2a);
    graphics.fillRect(0, 0, 64, 64);
    graphics.lineStyle(2, 0x9b2c2c);
    graphics.strokeRect(0, 0, 64, 64);
    graphics.generateTexture('building-restaurant', 64, 64);
    graphics.clear();

    graphics.fillStyle(0x553c9a);
    graphics.fillRect(0, 0, 64, 64);
    graphics.lineStyle(2, 0x6b46c1);
    graphics.strokeRect(0, 0, 64, 64);
    graphics.generateTexture('building-warehouse', 64, 64);
    graphics.clear();

    graphics.fillStyle(0xff6b35);
    graphics.fillCircle(24, 24, 22);
    graphics.lineStyle(3, 0xffa366);
    graphics.strokeCircle(24, 24, 22);
    graphics.fillStyle(0xffffff);
    graphics.fillCircle(24, 24, 8);
    graphics.generateTexture('patrol-point', 48, 48);
    graphics.clear();

    graphics.fillStyle(0x4a5568);
    graphics.fillRect(0, 0, 64, 16);
    graphics.lineStyle(1, 0x718096);
    graphics.beginPath();
    graphics.moveTo(0, 8);
    graphics.lineTo(64, 8);
    graphics.strokePath();
    graphics.generateTexture('road', 64, 16);
    graphics.clear();

    graphics.fillStyle(0x22543d);
    graphics.fillRect(0, 0, 32, 32);
    graphics.fillStyle(0x276749);
    for (let i = 0; i < 8; i++) {
      const x = Math.random() * 28 + 2;
      const y = Math.random() * 28 + 2;
      graphics.fillCircle(x, y, 3);
    }
    graphics.generateTexture('grass', 32, 32);
    graphics.clear();

    graphics.fillStyle(0x1a3150);
    graphics.fillRect(0, 0, 800, 600);
    graphics.fillStyle(0x1e3a5f);
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 800;
      const y = Math.random() * 600;
      graphics.fillCircle(x, y, Math.random() * 3 + 1);
    }
    graphics.generateTexture('park-bg', 800, 600);
    graphics.clear();

    graphics.fillStyle(0x1e3a5f);
    graphics.fillRect(0, 0, 128, 128);
    graphics.fillStyle(0xff6b35);
    graphics.fillCircle(64, 40, 25);
    graphics.fillStyle(0xffffff);
    graphics.fillCircle(64, 40, 12);
    graphics.generateTexture('logo', 128, 128);
    graphics.clear();

    graphics.destroy();
  }
}

export default BootScene;
