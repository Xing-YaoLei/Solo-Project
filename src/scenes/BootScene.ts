import { Scene } from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../utils/constants';

export class BootScene extends Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0a0a1a');
    this.scene.start('PreloadScene');
  }

  getGameSize(): { width: number; height: number } {
    return { width: GAME_WIDTH, height: GAME_HEIGHT };
  }
}
