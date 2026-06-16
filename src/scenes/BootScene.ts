import Phaser from 'phaser';
import { SCENE_KEYS } from '../config/gameConfig';
import { useGameStore } from '../stores/gameStore';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.BOOT);
  }

  preload(): void {
    this.load.setBaseURL('/');
  }

  create(): void {
    const setCurrentScene = useGameStore.getState().setCurrentScene;
    setCurrentScene(SCENE_KEYS.PRELOAD);
    this.scene.start(SCENE_KEYS.PRELOAD);
  }
}
