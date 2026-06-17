import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    this.load.image('logo', 'assets/images/logo.png');
  }

  create() {
    this.scene.start('LoadScene');
  }
}

export default BootScene;
