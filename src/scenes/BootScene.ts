import Phaser from 'phaser'
import { GAME_CONFIG, COLORS } from '../game/constants'

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene')
  }

  preload(): void {
    const progress = this.add.graphics()
    const progressBar = this.add.graphics()
    
    this.load.on('progress', (value: number) => {
      progress.clear()
      progress.fillStyle(COLORS.SURFACE_LIGHT, 1)
      progress.fillRect(GAME_CONFIG.WIDTH / 2 - 200, GAME_CONFIG.HEIGHT / 2 - 25, 400, 50)
      progressBar.clear()
      progressBar.fillStyle(COLORS.PRIMARY, 1)
      progressBar.fillRect(GAME_CONFIG.WIDTH / 2 - 200, GAME_CONFIG.HEIGHT / 2 - 25, 400 * value, 50)
    })

    this.load.on('complete', () => {
      progress.destroy()
      progressBar.destroy()
    })
  }

  create(): void {
    this.add.text(
      GAME_CONFIG.WIDTH / 2,
      GAME_CONFIG.HEIGHT / 2 - 80,
      '康复中心医保结算',
      {
        font: 'bold 48px Arial',
        color: '#ffffff'
      }
    ).setOrigin(0.5)

    this.add.text(
      GAME_CONFIG.WIDTH / 2,
      GAME_CONFIG.HEIGHT / 2 - 20,
      '经营模拟游戏',
      {
        font: 'bold 32px Arial',
        color: '#4a90d9'
      }
    ).setOrigin(0.5)

    this.time.delayedCall(1500, () => {
      this.scene.start('MainMenuScene')
    })
  }
}
