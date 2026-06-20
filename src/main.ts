import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { SponsorScene } from './scenes/SponsorScene';
import { VerificationScene } from './scenes/VerificationScene';
import { DisputeScene } from './scenes/DisputeScene';
import { ScoringScene } from './scenes/ScoringScene';
import { ReviewScene } from './scenes/ReviewScene';
import { GAME_WIDTH, GAME_HEIGHT } from './utils/constants';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#0a0a1a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  scene: [
    BootScene,
    PreloadScene,
    MainMenuScene,
    SponsorScene,
    VerificationScene,
    DisputeScene,
    ScoringScene,
    ReviewScene,
  ],
  physics: {
    default: 'matter',
    matter: {
      enabled: false,
      gravity: { x: 0, y: 1 },
      debug: false,
    },
  },
};

const game = new Phaser.Game(config);

export default game;
