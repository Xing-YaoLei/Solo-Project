import Phaser from 'phaser'
import { GAME_CONFIG, COLORS } from '../game/constants'
import { StorageManager } from '../managers/StorageManager'
import { GameStateManager } from '../managers/GameStateManager'

export class MainMenuScene extends Phaser.Scene {
  private hasSave: boolean = false

  constructor() {
    super('MainMenuScene')
  }

  init(): void {
    this.hasSave = StorageManager.getInstance().loadGame() !== null
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.BACKGROUND)

    this.add.text(
      GAME_CONFIG.WIDTH / 2,
      100,
      '康复中心医保结算',
      {
        font: 'bold 56px Arial',
        color: '#ffffff'
      }
    ).setOrigin(0.5)

    this.add.text(
      GAME_CONFIG.WIDTH / 2,
      160,
      '经营模拟训练系统',
      {
        font: 'bold 28px Arial',
        color: '#4a90d9'
      }
    ).setOrigin(0.5)

    this.createButton(GAME_CONFIG.WIDTH / 2, 280, '开始新游戏', () => this.startNewGame(), COLORS.PRIMARY)

    if (this.hasSave) {
      this.createButton(GAME_CONFIG.WIDTH / 2, 360, '继续游戏', () => this.continueGame(), COLORS.SUCCESS)
    }

    this.createButton(GAME_CONFIG.WIDTH / 2, this.hasSave ? 440 : 360, '新手教程', () => this.startTutorial(), COLORS.WARNING)
    this.createButton(GAME_CONFIG.WIDTH / 2, this.hasSave ? 520 : 440, '排行榜', () => this.showLeaderboard(), COLORS.SECONDARY)
    this.createButton(GAME_CONFIG.WIDTH / 2, this.hasSave ? 600 : 520, '训练记录', () => this.showRecords(), COLORS.ACCENT)

    const storage = StorageManager.getInstance()
    const records = storage.getTrainingRecords()
    if (records.length > 0) {
      const avgCompletion = records.reduce((sum, r) => sum + r.completionRate, 0) / records.length
      this.add.text(
        GAME_CONFIG.WIDTH / 2,
        670,
        `累计训练 ${records.length} 次 | 平均完成率 ${(avgCompletion * 100).toFixed(1)}%`,
        {
          font: '16px Arial',
          color: '#a0a0a0'
        }
      ).setOrigin(0.5)
    }
  }

  private createButton(x: number, y: number, text: string, callback: () => void, color: number): void {
    const button = this.add.rectangle(x, y, 280, 60, color)
      .setInteractive({ useHandCursor: true })
    
    this.add.text(x, y, text, {
      font: 'bold 22px Arial',
      color: '#ffffff'
    }).setOrigin(0.5)

    button.on('pointerover', () => {
      button.setFillStyle(Phaser.Display.Color.IntegerToColor(color).lighten(20).color)
    })

    button.on('pointerout', () => {
      button.setFillStyle(color)
    })

    button.on('pointerdown', callback)
  }

  private startNewGame(): void {
    GameStateManager.getInstance().resetState()
    if (!StorageManager.getInstance().isTutorialCompleted()) {
      this.scene.start('TutorialScene')
    } else {
      this.scene.start('GameScene')
    }
  }

  private continueGame(): void {
    GameStateManager.getInstance().loadSavedState()
    this.scene.start('GameScene')
  }

  private startTutorial(): void {
    this.scene.start('TutorialScene')
  }

  private showLeaderboard(): void {
    this.scene.start('LeaderboardScene')
  }

  private showRecords(): void {
    this.scene.start('RecordsScene')
  }
}
