import Phaser from 'phaser'
import { GAME_CONFIG, COLORS } from '../game/constants'
import { StorageManager } from '../managers/StorageManager'

export class LeaderboardScene extends Phaser.Scene {
  private storageManager!: StorageManager

  constructor() {
    super('LeaderboardScene')
  }

  init(): void {
    this.storageManager = StorageManager.getInstance()
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.BACKGROUND)

    this.add.text(GAME_CONFIG.WIDTH / 2, 60, '🏆 排行榜', {
      font: 'bold 36px Arial', color: '#ffffff'
    }).setOrigin(0.5)

    const backBtn = this.add.rectangle(80, 60, 120, 40, COLORS.SURFACE_LIGHT)
      .setInteractive({ useHandCursor: true })
    this.add.text(80, 60, '返回', {
      font: 'bold 16px Arial', color: '#ffffff'
    }).setOrigin(0.5)

    backBtn.on('pointerdown', () => this.scene.start('MainMenuScene'))
    backBtn.on('pointerover', () => backBtn.setFillStyle(COLORS.PRIMARY))
    backBtn.on('pointerout', () => backBtn.setFillStyle(COLORS.SURFACE_LIGHT))

    const entries = this.storageManager.getLeaderboard()

    if (entries.length === 0) {
      this.add.text(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2, '暂无记录，快去挑战吧！', {
        font: 'bold 24px Arial', color: '#a0a0a0'
      }).setOrigin(0.5)
      return
    }

    this.add.rectangle(GAME_CONFIG.WIDTH / 2, 120, 1100, 50, COLORS.SURFACE_LIGHT)
      .setStrokeStyle(2, COLORS.PRIMARY)
    this.add.text(150, 120, '排名', { font: 'bold 18px Arial', color: '#4a90d9' }).setOrigin(0.5)
    this.add.text(300, 120, '玩家', { font: 'bold 18px Arial', color: '#4a90d9' }).setOrigin(0.5)
    this.add.text(500, 120, '关卡', { font: 'bold 18px Arial', color: '#4a90d9' }).setOrigin(0.5)
    this.add.text(700, 120, '完成率', { font: 'bold 18px Arial', color: '#4a90d9' }).setOrigin(0.5)
    this.add.text(900, 120, '得分', { font: 'bold 18px Arial', color: '#4a90d9' }).setOrigin(0.5)
    this.add.text(1100, 120, '日期', { font: 'bold 18px Arial', color: '#4a90d9' }).setOrigin(0.5)

    entries.slice(0, 10).forEach((entry, index) => {
      const y = 180 + index * 50
      const bgColor = index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#16213e'
      
      this.add.rectangle(GAME_CONFIG.WIDTH / 2, y, 1100, 45, parseInt(bgColor.replace('#', ''), 16))
        .setStrokeStyle(1, COLORS.SURFACE_LIGHT)

      const rankText = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`
      this.add.text(150, y, rankText, { font: 'bold 18px Arial', color: '#ffffff' }).setOrigin(0.5)
      this.add.text(300, y, entry.playerName, { font: '16px Arial', color: '#ffffff' }).setOrigin(0.5)
      this.add.text(500, y, `Lv.${entry.level}`, { font: '16px Arial', color: '#4a90d9' }).setOrigin(0.5)
      this.add.text(700, y, `${(entry.completionRate * 100).toFixed(1)}%`, { 
        font: '16px Arial', 
        color: entry.completionRate >= 0.8 ? '#50c878' : entry.completionRate >= 0.5 ? '#ffd93d' : '#ff6b6b' 
      }).setOrigin(0.5)
      this.add.text(900, y, `${entry.score}`, { font: 'bold 18px Arial', color: '#ffd700' }).setOrigin(0.5)
      this.add.text(1100, y, new Date(entry.date).toLocaleDateString('zh-CN'), { 
        font: '14px Arial', color: '#a0a0a0' 
      }).setOrigin(0.5)
    })
  }
}
