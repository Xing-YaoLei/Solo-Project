import Phaser from 'phaser';
import { gameState } from '../systems/GameState';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0f0c29, 0x0f0c29, 0x302b63, 0x24243e, 1);
    bg.fillRect(0, 0, width, height);

    this.add.graphics().fillStyle(0x4fc3f7, 0.05).fillRect(0, 0, width, height);

    const title = this.add.text(width / 2, height * 0.18, '美业耗材领用经营模拟', {
      fontSize: '36px',
      color: '#4fc3f7',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    const subtitle = this.add.text(width / 2, height * 0.26, '快速处理供应商信息 · 领用记录 · 盘点差异', {
      fontSize: '16px',
      color: '#b0bec5',
      fontFamily: 'Arial',
    });
    subtitle.setOrigin(0.5);

    this.createDecorations(width, height);

    this.createButton(width / 2, height * 0.45, '开始训练', 'btn_success', () => {
      gameState.resetGame();
      if (!gameState.tutorialState.completed) {
        this.scene.start('TutorialScene');
      } else {
        this.scene.start('GameScene');
      }
    });

    this.createButton(width / 2, height * 0.55, '复盘记录', 'btn_normal', () => {
      this.scene.start('ReviewScene');
    });

    this.createButton(width / 2, height * 0.65, '统计总览', 'btn_normal', () => {
      this.scene.start('StatsScene');
    });

    if (!gameState.tutorialState.completed) {
      const badge = this.add.text(width / 2 + 80, height * 0.45 - 30, 'NEW', {
        fontSize: '12px',
        color: '#ff5722',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        backgroundColor: '#fff3e0',
        padding: { x: 4, y: 2 },
      });
      badge.setOrigin(0.5);
      this.tweens.add({
        targets: badge,
        alpha: 0.4,
        duration: 800,
        yoyo: true,
        repeat: -1,
      });
    }

    const footer = this.add.text(width / 2, height * 0.92, 'Phaser 3 + Matter.js · TypeScript · Vite', {
      fontSize: '12px',
      color: '#546e7a',
      fontFamily: 'Arial',
    });
    footer.setOrigin(0.5);
  }

  private createDecorations(width: number, height: number): void {
    const decorItems = [
      { x: width * 0.1, y: height * 0.35, text: '📦' },
      { x: width * 0.9, y: height * 0.35, text: '📋' },
      { x: width * 0.15, y: height * 0.75, text: '🏷️' },
      { x: width * 0.85, y: height * 0.75, text: '📊' },
    ];
    for (const item of decorItems) {
      const t = this.add.text(item.x, item.y, item.text, { fontSize: '28px' });
      t.setOrigin(0.5);
      this.tweens.add({
        targets: t,
        y: item.y - 10,
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private createButton(x: number, y: number, label: string, textureKey: string, callback: () => void): void {
    const btn = this.add.image(x, y, textureKey).setInteractive({ useHandCursor: true });

    const text = this.add.text(x, y, label, {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    });
    text.setOrigin(0.5);

    btn.on('pointerover', () => {
      btn.setScale(1.05);
      text.setScale(1.05);
    });
    btn.on('pointerout', () => {
      btn.setScale(1);
      text.setScale(1);
    });
    btn.on('pointerdown', callback);
  }
}
