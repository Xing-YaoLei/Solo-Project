import Phaser from 'phaser'
import { GAME_CONFIG, COLORS } from '../game/constants'
import { StorageManager } from '../managers/StorageManager'
import type { TrainingRecord, RejectionRecord } from '../game/types'

export class RecordsScene extends Phaser.Scene {
  private storageManager!: StorageManager

  constructor() {
    super('RecordsScene')
  }

  init(): void {
    this.storageManager = StorageManager.getInstance()
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.BACKGROUND)

    this.add.text(GAME_CONFIG.WIDTH / 2, 60, '📊 训练记录', {
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

    const clearBtn = this.add.rectangle(GAME_CONFIG.WIDTH - 80, 60, 120, 40, COLORS.ACCENT)
      .setInteractive({ useHandCursor: true })
    this.add.text(GAME_CONFIG.WIDTH - 80, 60, '清除记录', {
      font: 'bold 16px Arial', color: '#ffffff'
    }).setOrigin(0.5)

    clearBtn.on('pointerdown', () => {
      this.storageManager.clearTrainingRecords()
      this.scene.restart()
    })
    clearBtn.on('pointerover', () => clearBtn.setFillStyle(Phaser.Display.Color.IntegerToColor(COLORS.ACCENT).lighten(15).color))
    clearBtn.on('pointerout', () => clearBtn.setFillStyle(COLORS.ACCENT))

    const records = this.storageManager.getTrainingRecords()

    if (records.length === 0) {
      this.add.text(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2, '暂无训练记录', {
        font: 'bold 24px Arial', color: '#a0a0a0'
      }).setOrigin(0.5)
      return
    }

    const totalSessions = records.length
    const avgScore = records.reduce((sum, r) => sum + r.score, 0) / totalSessions
    const avgCompletion = records.reduce((sum, r) => sum + r.completionRate, 0) / totalSessions
    const totalErrors = records.reduce((sum, r) => sum + r.errors.length, 0)
    const totalRejections = records.reduce((sum, r) => sum + r.rejections.length, 0)
    const totalRejectionAmount = records.reduce((sum, r) =>
      sum + r.rejections.reduce((s, rej: RejectionRecord) => s + rej.amount, 0), 0)

    this.add.rectangle(200, 150, 350, 80, COLORS.SURFACE)
      .setStrokeStyle(2, COLORS.PRIMARY)
    this.add.text(200, 135, '训练次数', { font: '14px Arial', color: '#a0a0a0' }).setOrigin(0.5)
    this.add.text(200, 165, `${totalSessions} 次`, { font: 'bold 24px Arial', color: '#4a90d9' }).setOrigin(0.5)

    this.add.rectangle(565, 150, 350, 80, COLORS.SURFACE)
      .setStrokeStyle(2, COLORS.SUCCESS)
    this.add.text(565, 135, '平均得分', { font: '14px Arial', color: '#a0a0a0' }).setOrigin(0.5)
    this.add.text(565, 165, `${avgScore.toFixed(0)} 分`, { font: 'bold 24px Arial', color: '#50c878' }).setOrigin(0.5)

    this.add.rectangle(930, 150, 350, 80, COLORS.SURFACE)
      .setStrokeStyle(2, COLORS.WARNING)
    this.add.text(930, 135, '平均完成率', { font: '14px Arial', color: '#a0a0a0' }).setOrigin(0.5)
    this.add.text(930, 165, `${(avgCompletion * 100).toFixed(1)}%`, { font: 'bold 24px Arial', color: '#ffd93d' }).setOrigin(0.5)

    this.add.rectangle(200, 250, 350, 60, COLORS.SURFACE)
      .setStrokeStyle(1, COLORS.ACCENT)
    this.add.text(200, 240, '总错误数', { font: '14px Arial', color: '#a0a0a0' }).setOrigin(0.5)
    this.add.text(200, 265, `${totalErrors} 次`, { font: 'bold 20px Arial', color: '#ff6b6b' }).setOrigin(0.5)

    this.add.rectangle(565, 250, 350, 60, COLORS.SURFACE)
      .setStrokeStyle(1, COLORS.ACCENT)
    this.add.text(565, 240, '医保拒付', { font: '14px Arial', color: '#a0a0a0' }).setOrigin(0.5)
    this.add.text(565, 265, `${totalRejections} 次 / ${totalRejectionAmount}元`, { font: 'bold 20px Arial', color: '#ff6b6b' }).setOrigin(0.5)

    this.add.text(60, 320, '历史记录（点击查看详情）:', {
      font: 'bold 20px Arial', color: '#ffffff'
    })

    const recordContainer = this.add.container(40, 360)

    records.slice().reverse().forEach((record, index) => {
      const y = index * 70

      const card = this.add.rectangle(600, y + 30, 1160, 60, COLORS.SURFACE)
        .setStrokeStyle(2, COLORS.SURFACE_LIGHT)
        .setInteractive({ useHandCursor: true })

      const date = new Date(record.date)
      const dateT = this.add.text(60, y + 30, date.toLocaleString('zh-CN'), { font: '14px Arial', color: '#a0a0a0' })
        .setOrigin(0, 0.5)
      const levelT = this.add.text(260, y + 30, `Lv.${record.level}`, { font: 'bold 16px Arial', color: '#4a90d9' })
        .setOrigin(0, 0.5)
      const taskT = this.add.text(380, y + 30, `任务: ${record.completedTasks}/${record.totalTasks}`, {
        font: '14px Arial', color: '#ffffff'
      }).setOrigin(0, 0.5)
      const rateT = this.add.text(580, y + 30, `完成率: ${(record.completionRate * 100).toFixed(1)}%`, {
        font: '14px Arial',
        color: record.completionRate >= 0.8 ? '#50c878' : record.completionRate >= 0.5 ? '#ffd93d' : '#ff6b6b'
      }).setOrigin(0, 0.5)
      const scoreT = this.add.text(820, y + 30, `得分: ${record.score}`, {
        font: 'bold 18px Arial', color: '#ffd700'
      }).setOrigin(0, 0.5)
      const errT = this.add.text(1000, y + 30, `❌${record.errors.length} 🚫${record.rejections.length}`, {
        font: '14px Arial', color: '#ff6b6b'
      }).setOrigin(0, 0.5)

      card.on('pointerdown', () => {
        this.showRecordDetail(record)
      })
      card.on('pointerover', () => card.setFillStyle(COLORS.SURFACE_LIGHT))
      card.on('pointerout', () => card.setFillStyle(COLORS.SURFACE))

      recordContainer.add([card, dateT, levelT, taskT, rateT, scoreT, errT])
    })
  }

  private showRecordDetail(record: TrainingRecord): void {
    this.children.each(c => {
      const go = c as Phaser.GameObjects.GameObject
      if (go.name === 'recordDetail') go.destroy()
    })

    const totalRejectionAmount = record.rejections.reduce((sum, rej: RejectionRecord) => sum + rej.amount, 0)
    const maxDetailItems = 6
    const detailHeight = 520 + Math.min(record.errors.length + record.rejections.length, maxDetailItems * 2) * 10

    this.add.rectangle(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2, 700, Math.min(detailHeight, 600), COLORS.SURFACE)
      .setStrokeStyle(3, COLORS.PRIMARY)
      .setName('recordDetail')

    this.add.text(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 - 250, '训练详情复盘', {
      font: 'bold 28px Arial', color: '#ffffff'
    }).setOrigin(0.5).setName('recordDetail')

    const closeBtn = this.add.rectangle(GAME_CONFIG.WIDTH / 2 + 320, GAME_CONFIG.HEIGHT / 2 - 250, 40, 40, COLORS.ACCENT)
      .setInteractive({ useHandCursor: true })
      .setName('recordDetail')
    this.add.text(GAME_CONFIG.WIDTH / 2 + 320, GAME_CONFIG.HEIGHT / 2 - 250, '✕', {
      font: 'bold 20px Arial', color: '#ffffff'
    }).setOrigin(0.5).setName('recordDetail')

    closeBtn.on('pointerdown', () => {
      this.children.each(c => {
        const go = c as Phaser.GameObjects.GameObject
        if (go.name === 'recordDetail') go.destroy()
      })
    })

    this.add.text(GAME_CONFIG.WIDTH / 2 - 300, GAME_CONFIG.HEIGHT / 2 - 200,
      `日期: ${new Date(record.date).toLocaleString('zh-CN')}`,
      { font: '16px Arial', color: '#a0a0a0' }
    ).setOrigin(0, 0.5).setName('recordDetail')

    this.add.text(GAME_CONFIG.WIDTH / 2 - 300, GAME_CONFIG.HEIGHT / 2 - 160,
      `关卡: Lv.${record.level} | 总得分: ${record.score}`,
      { font: 'bold 20px Arial', color: '#ffffff' }
    ).setOrigin(0, 0.5).setName('recordDetail')

    this.add.text(GAME_CONFIG.WIDTH / 2 - 300, GAME_CONFIG.HEIGHT / 2 - 120,
      `任务完成: ${record.completedTasks}/${record.totalTasks} (${(record.completionRate * 100).toFixed(1)}%)`,
      { font: '18px Arial', color: '#4a90d9' }
    ).setOrigin(0, 0.5).setName('recordDetail')

    this.add.text(GAME_CONFIG.WIDTH / 2 - 300, GAME_CONFIG.HEIGHT / 2 - 85,
      `错误: ${record.errors.length}次 | 医保拒付: ${record.rejections.length}次 | 拒付金额: ${totalRejectionAmount}元`,
      { font: '16px Arial', color: '#ffd93d' }
    ).setOrigin(0, 0.5).setName('recordDetail')

    let yOffset = GAME_CONFIG.HEIGHT / 2 - 40

    if (record.errors.length > 0) {
      this.add.text(GAME_CONFIG.WIDTH / 2 - 300, yOffset, '错误记录:', {
        font: 'bold 18px Arial', color: '#ff6b6b'
      }).setOrigin(0, 0.5).setName('recordDetail')
      yOffset += 30

      record.errors.slice(0, maxDetailItems).forEach(err => {
        this.add.text(GAME_CONFIG.WIDTH / 2 - 280, yOffset,
          `• ${err.reason}`,
          { font: '14px Arial', color: '#a0a0a0' }
        ).setOrigin(0, 0.5).setName('recordDetail')
        yOffset += 22
      })

      if (record.errors.length > maxDetailItems) {
        this.add.text(GAME_CONFIG.WIDTH / 2 - 280, yOffset,
          `...还有 ${record.errors.length - maxDetailItems} 条错误`,
          { font: '14px Arial', color: '#666666' }
        ).setOrigin(0, 0.5).setName('recordDetail')
        yOffset += 22
      }
    }

    yOffset += 10
    if (record.rejections.length > 0) {
      this.add.text(GAME_CONFIG.WIDTH / 2 - 300, yOffset, '医保拒付记录:', {
        font: 'bold 18px Arial', color: '#ffd93d'
      }).setOrigin(0, 0.5).setName('recordDetail')
      yOffset += 30

      record.rejections.slice(0, maxDetailItems).forEach((rej: RejectionRecord) => {
        this.add.text(GAME_CONFIG.WIDTH / 2 - 280, yOffset,
          `• ${rej.reason} (损失: ${rej.amount}元)`,
          { font: '14px Arial', color: '#a0a0a0' }
        ).setOrigin(0, 0.5).setName('recordDetail')
        yOffset += 22
      })

      if (record.rejections.length > maxDetailItems) {
        this.add.text(GAME_CONFIG.WIDTH / 2 - 280, yOffset,
          `...还有 ${record.rejections.length - maxDetailItems} 条拒付`,
          { font: '14px Arial', color: '#666666' }
        ).setOrigin(0, 0.5).setName('recordDetail')
      }
    }
  }
}
