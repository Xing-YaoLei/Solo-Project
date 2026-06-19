import Phaser from 'phaser';
import { BootScene } from '@/game/scenes/BootScene';
import { MenuScene } from '@/game/scenes/MenuScene';
import { GameScene } from '@/game/scenes/GameScene';
import { TutorialScene } from '@/game/scenes/TutorialScene';
import { LeaderboardScene } from '@/game/scenes/LeaderboardScene';
import { GAME_CONFIG } from '@/config/constants';

export function createGame(): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'game-container',
    backgroundColor: `#${GAME_CONFIG.COLORS.BG.toString(16).padStart(6, '0')}`,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_CONFIG.WIDTH,
      height: GAME_CONFIG.HEIGHT
    },
    scene: [BootScene, MenuScene, GameScene, TutorialScene, LeaderboardScene],
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: false
    }
  };

  return new Phaser.Game(config);
}
