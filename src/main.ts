import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { SettlementScene } from './scenes/SettlementScene';
import { ReviewScene } from './scenes/ReviewScene';
import { StatsScene } from './scenes/StatsScene';
import { TutorialScene } from './scenes/TutorialScene';

const GAME_WIDTH = 900;
const GAME_HEIGHT = 640;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: document.body,
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'matter',
    matter: {
      gravity: { x: 0, y: 0.5 },
      debug: false,
    },
  },
  scene: [BootScene, MenuScene, GameScene, SettlementScene, ReviewScene, StatsScene, TutorialScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

const game = new Phaser.Game(config);
export default game;
