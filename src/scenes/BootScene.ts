import Phaser from 'phaser';
import { SCENE_KEYS } from '@/types/game';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.Boot);
  }

  init(): void {
    console.log('BootScene: Initializing game...');
  }

  create(): void {
    this.scene.start(SCENE_KEYS.Preload);
  }
}
