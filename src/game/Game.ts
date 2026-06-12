import Phaser from 'phaser';
import { StartScene } from '@/scenes/StartScene';
import { GameScene } from '@/scenes/GameScene';
import { EventScene } from '@/scenes/EventScene';
import { ResultScene } from '@/scenes/ResultScene';

export const createGame = (containerId: string): Phaser.Game => {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 1280,
    height: 800,
    parent: containerId,
    backgroundColor: '#1A1A2E',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      min: {
        width: 800,
        height: 600,
      },
      max: {
        width: 1920,
        height: 1080,
      },
    },
    physics: {
      default: 'matter',
      matter: {
        gravity: { x: 0, y: 0 },
        enableSleeping: true,
        debug: false,
      },
    },
    scene: [StartScene, GameScene, EventScene, ResultScene],
    input: {
      keyboard: true,
    },
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: false,
    },
  };

  return new Phaser.Game(config);
};

export { StartScene, GameScene, EventScene, ResultScene };
