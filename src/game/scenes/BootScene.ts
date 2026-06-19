import Phaser from 'phaser';
import { GAME_CONFIG } from '@/config/constants';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  public preload(): void {
  }

  public create(): void {
    this.cameras.main.setBackgroundColor(GAME_CONFIG.COLORS.BG);
    this.scene.start('Menu');
  }
}
