import Phaser from 'phaser';
import { SoundManager } from '../data/SoundManager';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    SoundManager.getInstance().setScene(this);
  }

  create(): void {
    this.scene.start('MenuScene');
  }
}
