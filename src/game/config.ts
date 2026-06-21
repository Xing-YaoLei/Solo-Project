import Phaser from 'phaser'
import { MenuScene } from './scenes/MenuScene'
import { AmountVerifyScene } from './scenes/AmountVerifyScene'
import { PaymentFlowScene } from './scenes/PaymentFlowScene'
import { ReconcileSortScene } from './scenes/ReconcileSortScene'
import { ContractAttachScene } from './scenes/ContractAttachScene'
import { TutorialScene } from './scenes/TutorialScene'

export const GAME_WIDTH = 1280
export const GAME_HEIGHT = 720

export function createGameConfig(parent: string): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#1B2A4A',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'matter',
      matter: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scene: [MenuScene, AmountVerifyScene, PaymentFlowScene, ReconcileSortScene, ContractAttachScene, TutorialScene],
  }
}
