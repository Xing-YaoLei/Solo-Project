import Phaser from 'phaser'
import { GAME_CONFIG } from './game/constants'
import { BootScene } from './scenes/BootScene'
import { MainMenuScene } from './scenes/MainMenuScene'
import { GameScene } from './scenes/GameScene'
import { TutorialScene } from './scenes/TutorialScene'
import { LeaderboardScene } from './scenes/LeaderboardScene'
import { RecordsScene } from './scenes/RecordsScene'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_CONFIG.WIDTH,
  height: GAME_CONFIG.HEIGHT,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [
    BootScene,
    MainMenuScene,
    GameScene,
    TutorialScene,
    LeaderboardScene,
    RecordsScene
  ],
  physics: {
    default: 'matter',
    matter: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  }
}

new Phaser.Game(config)
