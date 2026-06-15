import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from './types';
import { LoadingScene } from './scenes/LoadingScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { ReviewScene } from './scenes/ReviewScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: `#${COLORS.background.toString(16).padStart(6, '0')}`,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: {
      width: 800,
      height: 450
    },
    max: {
      width: GAME_WIDTH,
      height: GAME_HEIGHT
    }
  },
  physics: {
    default: 'matter',
    matter: {
      gravity: { x: 0, y: 0 },
      debug: false,
      enableSleeping: true
    }
  },
  scene: [
    LoadingScene,
    MenuScene,
    GameScene,
    ReviewScene
  ],
  input: {
    keyboard: true,
    mouse: true,
    touch: true
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false
  },
  dom: {
    createContainer: false
  },
  fps: {
    target: 60,
    forceSetTimeOut: true
  }
};

export class TeachingEvaluationGame extends Phaser.Game {
  constructor() {
    super(config);
  }
}

window.addEventListener('load', () => {
  new TeachingEvaluationGame();
});
