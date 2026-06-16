import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig';

export const PHASER_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_CONFIG.width,
  height: GAME_CONFIG.height,
  backgroundColor: GAME_CONFIG.backgroundColor,
  scale: {
    mode: Phaser.Scale.ScaleModes.RESIZE,
    autoCenter: Phaser.Scale.Center.CENTER_BOTH,
  },
  dom: {
    createContainer: true,
  },
  fps: {
    target: 60,
    forceSetTimeOut: true,
  },
  render: {
    antialias: true,
    pixelArt: false,
  },
};
