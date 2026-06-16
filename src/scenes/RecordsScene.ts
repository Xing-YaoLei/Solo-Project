import Phaser from 'phaser'
import { GAME_CONFIG, COLORS } from '../game/constants'
import { StorageManager } from '../managers/StorageManager'
import { TREATMENTS } from '../config/treatments'
import type { TrainingRecord, RejectionRecord, ErrorRecord } from '../game/types'

export class RecordsScene extends Phaser.Scene {
  private storageManager!: StorageManager
  private detailContainer: Phaser.GameObjects.Container | null = null

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
    this.closeRecordDetail()

    const panelX = GAME_CONFIG.WIDTH / 2 - 350
    const panelY = 60
    const panelW = 700
    const panelH = GAME_CONFIG.HEIGHT - 120

    this.add.rectangle(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2, panelW, panelH, COLORS.SURFACE)
      .setStrokeStyle(3, COLORS.PRIMARY)
      .setName('recordDetail')

    this.add.text(GAME_CONFIG.WIDTH / 2, panelY + 30, '训练详情复盘', {
      font: 'bold 28px Arial', color: '#ffffff'
    }).setOrigin(0.5).setName('recordDetail')

    const closeBtn = this.add.rectangle(GAME_CONFIG.WIDTH / 2 + 320, panelY + 30, 40, 40, COLORS.ACCENT)
      .setInteractive({ useHandCursor: true })
      .setName('recordDetail')
    this.add.text(GAME_CONFIG.WIDTH / 2 + 320, panelY + 30, '✕', {
      font: 'bold 20px Arial', color: '#ffffff'
    }).setOrigin(0.5).setName('recordDetail')
    closeBtn.on('pointerdown', () => this.closeRecordDetail())

    const totalRejectionAmount = record.rejections.reduce((sum, rej: RejectionRecord) => sum + rej.amount, 0)

    this.detailContainer = this.add.container(panelX + 20, panelY + 70)
    this.detailContainer.setName('recordDetailContent')

    let yOffset = 0

    const headerItems = this.buildDetailHeader(record, totalRejectionAmount)
    this.detailContainer.add(headerItems)
    yOffset = 120

    if (record.errors.length > 0) {
      const errorItems = this.buildErrorSection(record.errors, yOffset)
      this.detailContainer.add(errorItems)
      yOffset += 30 + record.errors.length * 26
    }

    yOffset += 15

    if (record.rejections.length > 0) {
      const rejectionItems = this.buildRejectionSection(record.rejections, yOffset)
      this.detailContainer.add(rejectionItems)
      yOffset += 30 + record.rejections.length * 26
    }

    this.input.on('wheel', this.handleDetailScroll, this)
  }

  private buildDetailHeader(record: TrainingRecord, totalRejectionAmount: number): Phaser.GameObjects.GameObject[] {
    const items: Phaser.GameObjects.GameObject[] = []
    let y = 0

    const t1 = this.add.text(10, y, `日期: ${new Date(record.date).toLocaleString('zh-CN')}`, {
      font: '16px Arial', color: '#a0a0a0'
    })
    items.push(t1)
    y += 30

    const t2 = this.add.text(10, y, `关卡: Lv.${record.level} | 总得分: ${record.score}`, {
      font: 'bold 20px Arial', color: '#ffffff'
    })
    items.push(t2)
    y += 30

    const t3 = this.add.text(10, y, `任务完成: ${record.completedTasks}/${record.totalTasks} (${(record.completionRate * 100).toFixed(1)}%)`, {
      font: '18px Arial', color: '#4a90d9'
    })
    items.push(t3)
    y += 30

    const t4 = this.add.text(10, y, `错误: ${record.errors.length}次 | 医保拒付: ${record.rejections.length}次 | 拒付金额: ${totalRejectionAmount}元`, {
      font: '16px Arial', color: '#ffd93d'
    })
    items.push(t4)
    y += 30

    return items
  }

  private buildErrorSection(errors: ErrorRecord[], startY: number): Phaser.GameObjects.GameObject[] {
    const items: Phaser.GameObjects.GameObject[] = []

    const header = this.add.text(10, startY, `错误记录（${errors.length}条）:`, {
      font: 'bold 18px Arial', color: '#ff6b6b'
    })
    items.push(header)

    errors.forEach((err, i) => {
      const y = startY + 30 + i * 26
      const patientLabel = err.patientName || '未知患者'
      const treatmentLabel = err.treatmentName || TREATMENTS[err.treatmentId]?.name || err.treatmentId
      const line = this.add.text(20, y, `• [${patientLabel} / ${treatmentLabel}] ${err.reason}`, {
        font: '14px Arial', color: '#a0a0a0', wordWrap: { width: 620 }
      })
      items.push(line)
    })

    return items
  }

  private buildRejectionSection(rejections: RejectionRecord[], startY: number): Phaser.GameObjects.GameObject[] {
    const items: Phaser.GameObjects.GameObject[] = []

    const header = this.add.text(10, startY, `医保拒付记录（${rejections.length}条）:`, {
      font: 'bold 18px Arial', color: '#ffd93d'
    })
    items.push(header)

    rejections.forEach((rej, i) => {
      const y = startY + 30 + i * 26
      const patientLabel = rej.patientName || '未知患者'
      const treatmentLabel = rej.treatmentName || TREATMENTS[rej.treatmentId]?.name || rej.treatmentId
      const line = this.add.text(20, y, `• [${patientLabel} / ${treatmentLabel}] ${rej.reason} (损失: ${rej.amount}元)`, {
        font: '14px Arial', color: '#a0a0a0', wordWrap: { width: 620 }
      })
      items.push(line)
    })

    return items
  }

  private handleDetailScroll(_pointer: Phaser.Input.Pointer, _gameObjects: Phaser.GameObjects.GameObject[], _dx: number, dy: number): void {
    if (!this.detailContainer) return
    const currentY = this.detailContainer.y
    const maxY = 70
    const minY = Math.min(maxY, currentY - dy * 0.5)
    this.detailContainer.y = Phaser.Math.Clamp(minY, -this.detailContainer.length * 26 + 300, maxY)
  }

  private closeRecordDetail(): void {
    this.input.off('wheel', this.handleDetailScroll, this)

    this.children.each(c => {
      const go = c as Phaser.GameObjects.GameObject
      if (go.name === 'recordDetail') go.destroy()
      if (go.name === 'recordDetailContent') go.destroy()
    })

    this.detailContainer = null
  }
}
