import Phaser from 'phaser';
import { SCENE_KEYS } from '@/types/game';
import { BootScene } from '@/scenes/BootScene';
import { PreloadScene } from '@/scenes/PreloadScene';
import { MainGameScene } from '@/scenes/MainGameScene';

export const createGameConfig = (
  container: HTMLElement,
  width: number = 1280,
  height: number = 800
): Phaser.Types.Core.GameConfig => {
  return {
    type: Phaser.CANVAS,
    width,
    height,
    parent: container,
    backgroundColor: '#E3F2FD',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width,
      height,
    },

    scene: [BootScene, PreloadScene, MainGameScene],
    dom: {
      createContainer: true,
    },
    input: {
      mouse: {
        target: container,
      },
      touch: {
        target: container,
      },
      keyboard: {
        target: window,
      },
    },
  };
};

export const GAME_CONFIG = {
  DEFAULT_WIDTH: 1280,
  DEFAULT_HEIGHT: 800,
  CARD_WIDTH: 110,
  CARD_HEIGHT: 90,
  CELL_WIDTH: 130,
  CELL_HEIGHT: 110,
  CARD_GAP: 10,
  SHELF_START_X: 400,
  SHELF_START_Y: 180,
  CARD_AREA_X: 50,
  CARD_AREA_Y: 180,
  COLORS: {
    PRIMARY: '#1E88E5',
    SUCCESS: '#43A047',
    ERROR: '#E53935',
    WARNING: '#FFA000',
    WOOD_LIGHT: '#D7CCC8',
    WOOD_DARK: '#6D4C41',
  },
};
