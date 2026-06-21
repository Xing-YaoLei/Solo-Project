import Phaser from 'phaser'
import { PaymentFlowData, TrainingRecord, MistakeEntry, LEVEL_LABELS } from '@/types'
import { useGameStore } from '@/store/gameStore'
import { GAME_WIDTH, GAME_HEIGHT } from '@/game/config'

const COLOR = {
  bg: 0x1b2a4a,
  amber: 0xd4a843,
  slate: 0x64748b,
  emerald: 0x10b981,
  coral: 0xef4444,
  white: 0xffffff,
  cardBg: 0x243656,
  cardBgHover: 0x2d4269,
  selectedBorder: 0xd4a843,
  overlay: 0x0d1b2a,
}

export class PaymentFlowScene extends Phaser.Scene {
  private questionData!: PaymentFlowData
  private questionId = ''
  private questionReward = 0
  private timeLimit = 90
  private selectedFlowIds: Set<string> = new Set()
  private timerText!: Phaser.GameObjects.Text
  private totalText!: Phaser.GameObjects.Text
  private timeLeft = 0
  private startTime = 0
  private submitted = false
  private cardContainers: Phaser.GameObjects.Container[] = []

  constructor() {
    super({ key: 'PaymentFlowScene' })
  }

  create() {
    const store = useGameStore.getState()
    const questions = store.getQuestionsByType('payment_flow')
    if (!questions.length) {
      this.scene.start('MenuScene')
      return
    }
    const question = questions[0]
    this.questionData = question.data as PaymentFlowData
    this.questionId = question.id
    this.questionReward = question.reward
    this.timeLimit = question.timeLimit ?? 90
    this.timeLeft = this.timeLimit
    this.startTime = Date.now()
    this.selectedFlowIds = new Set()
    this.submitted = false

    this.cameras.main.setBackgroundColor(COLOR.bg)

    this.drawHeader()
    this.drawFlowCards()
    this.drawFooter()
    this.startTimer()
  }

  private drawHeader() {
    const bg = this.add.rectangle(GAME_WIDTH / 2, 40, GAME_WIDTH, 80, COLOR.bg).setOrigin(0.5)
    bg.setStrokeStyle(0)

    this.add.text(40, 18, LEVEL_LABELS.payment_flow, {
      fontSize: '26px',
      fontFamily: 'Arial',
      color: '#D4A843',
      fontStyle: 'bold',
    })

    this.add.text(40, 50, `目标金额: ¥${this.questionData.targetAmount.toLocaleString()}`, {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#64748B',
    })

    this.timerText = this.add.text(GAME_WIDTH - 40, 30, `${this.timeLeft}s`, {
      fontSize: '22px',
      fontFamily: 'Arial',
      color: '#FFFFFF',
      fontStyle: 'bold',
    }).setOrigin(1, 0.5)

    this.add.text(GAME_WIDTH - 40, 54, '剩余时间', {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#64748B',
    }).setOrigin(1, 0.5)

    this.add.rectangle(GAME_WIDTH / 2, 80, GAME_WIDTH, 2, COLOR.slate, 0.3)
  }

  private drawFlowCards() {
    const startY = 100
    const cardHeight = 68
    const cardGap = 8
    const cardWidth = GAME_WIDTH - 80
    const cardX = 40
    const flows = this.questionData.flows
    const visibleCount = Math.min(flows.length, 7)
    const listHeight = visibleCount * (cardHeight + cardGap)

    const mask = this.make.graphics({})
    mask.fillStyle(0xffffff, 1)
    mask.fillRect(cardX, startY, cardWidth, listHeight)

    const scrollZone = this.add.zone(cardX + cardWidth / 2, startY + listHeight / 2, cardWidth, listHeight)
      .setInteractive({ useHandCursor: true })

    this.cardContainers = []

    for (let i = 0; i < flows.length; i++) {
      const flow = flows[i]
      const y = startY + i * (cardHeight + cardGap)

      const container = this.add.container(cardX, y)

      const cardBg = this.add.rectangle(cardWidth / 2, cardHeight / 2, cardWidth, cardHeight, COLOR.cardBg)
        .setInteractive({ useHandCursor: true })

      const border = this.add.rectangle(cardWidth / 2, cardHeight / 2, cardWidth, cardHeight)
        .setStrokeStyle(0)
        .setFillStyle(0x000000, 0)

      const dateText = this.add.text(16, 12, flow.date, {
        fontSize: '13px',
        fontFamily: 'Arial',
        color: '#64748B',
      })

      const amountText = this.add.text(16, 32, `¥${flow.amount.toLocaleString()}`, {
        fontSize: '20px',
        fontFamily: 'Arial',
        color: '#FFFFFF',
        fontStyle: 'bold',
      })

      const summaryText = this.add.text(180, 32, flow.summary, {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: '#94A3B8',
      })

      const statusColor = flow.status === '已到账' ? COLOR.emerald : COLOR.coral
      const statusBadge = this.add.rectangle(cardWidth - 70, 18, 64, 22, statusColor, 0.2)
      statusBadge.setStrokeStyle(1, statusColor)
      const statusText = this.add.text(cardWidth - 70, 18, flow.status, {
        fontSize: '11px',
        fontFamily: 'Arial',
        color: flow.status === '已到账' ? '#10B981' : '#EF4444',
      }).setOrigin(0.5)

      const checkMark = this.add.text(cardWidth - 16, cardHeight / 2, '○', {
        fontSize: '20px',
        fontFamily: 'Arial',
        color: '#64748B',
      }).setOrigin(0.5)

      container.add([cardBg, border, dateText, amountText, summaryText, statusBadge, statusText, checkMark])

      cardBg.on('pointerover', () => {
        if (!this.submitted) cardBg.setFillStyle(COLOR.cardBgHover)
      })
      cardBg.on('pointerout', () => {
        if (!this.submitted) cardBg.setFillStyle(COLOR.cardBg)
      })
      cardBg.on('pointerdown', () => {
        if (this.submitted) return
        this.toggleSelection(flow.id, container, border, checkMark)
      })

      this.cardContainers.push(container)
    }

    if (flows.length > visibleCount) {
      const contentHeight = flows.length * (cardHeight + cardGap)
      scrollZone.on('pointermove', (pointer: Phaser.Input.Pointer) => {
        if (!pointer.isDown) return
        const dy = pointer.velocity.y * 0.5
        this.cardContainers.forEach((c) => {
          c.y += dy
          c.y = Phaser.Math.Clamp(c.y, startY - (contentHeight - listHeight), startY)
        })
      })
    }
  }

  private toggleSelection(flowId: string, _container: Phaser.GameObjects.Container, border: Phaser.GameObjects.Rectangle, checkMark: Phaser.GameObjects.Text) {
    if (this.selectedFlowIds.has(flowId)) {
      this.selectedFlowIds.delete(flowId)
      border.setStrokeStyle(0)
      checkMark.setText('○').setColor('#64748B')
    } else {
      this.selectedFlowIds.add(flowId)
      border.setStrokeStyle(3, COLOR.selectedBorder)
      checkMark.setText('●').setColor('#D4A843')
    }
    this.updateTotalDisplay()
  }

  private drawFooter() {
    const footerY = GAME_HEIGHT - 90
    this.add.rectangle(GAME_WIDTH / 2, footerY, GAME_WIDTH, 2, COLOR.slate, 0.3)

    this.totalText = this.add.text(40, footerY + 15, '', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#FFFFFF',
    })
    this.updateTotalDisplay()

    const btnWidth = 200
    const btnHeight = 48
    const btnX = GAME_WIDTH - 40 - btnWidth
    const btnY = footerY + 12

    const submitBtn = this.add.rectangle(btnX + btnWidth / 2, btnY + btnHeight / 2, btnWidth, btnHeight, COLOR.amber)
      .setInteractive({ useHandCursor: true })

    this.add.text(btnX + btnWidth / 2, btnY + btnHeight / 2, '提交结果', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#1B2A4A',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    submitBtn.on('pointerover', () => submitBtn.setFillStyle(0xc49a3a))
    submitBtn.on('pointerout', () => submitBtn.setFillStyle(COLOR.amber))
    submitBtn.on('pointerdown', () => this.handleSubmit())

    const backBtn = this.add.rectangle(100, GAME_HEIGHT - 28, 80, 30, COLOR.slate, 0.3)
      .setInteractive({ useHandCursor: true })
    this.add.text(100, GAME_HEIGHT - 28, '← 返回', {
      fontSize: '13px',
      fontFamily: 'Arial',
      color: '#94A3B8',
    }).setOrigin(0.5)

    backBtn.on('pointerover', () => backBtn.setFillStyle(COLOR.slate, 0.5))
    backBtn.on('pointerout', () => backBtn.setFillStyle(COLOR.slate, 0.3))
    backBtn.on('pointerdown', () => this.scene.start('MenuScene'))
  }

  private updateTotalDisplay() {
    const selectedAmount = this.questionData.flows
      .filter((f) => this.selectedFlowIds.has(f.id))
      .reduce((sum, f) => sum + f.amount, 0)
    const color = selectedAmount === this.questionData.targetAmount ? '#10B981' : '#FFFFFF'
    this.totalText.setText(`已选金额: ¥${selectedAmount.toLocaleString()} / 目标: ¥${this.questionData.targetAmount.toLocaleString()}`)
    this.totalText.setColor(color)
  }

  private startTimer() {
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (this.submitted) return
        this.timeLeft--
        this.timerText.setText(`${Math.max(0, this.timeLeft)}s`)
        if (this.timeLeft <= 10) this.timerText.setColor('#EF4444')
        if (this.timeLeft <= 0) this.handleSubmit()
        else this.startTimer()
      },
    })
  }

  private handleSubmit() {
    if (this.submitted) return
    this.submitted = true

    const timeSpent = Math.round((Date.now() - this.startTime) / 1000)
    const correctIds = new Set(this.questionData.correctFlowIds)

    const correctSelections = [...this.selectedFlowIds].filter((id) => correctIds.has(id)).length
    const wrongSelections = [...this.selectedFlowIds].filter((id) => !correctIds.has(id)).length
    const missedSelections = [...correctIds].filter((id) => !this.selectedFlowIds.has(id)).length

    const totalCorrect = correctIds.size
    const maxScore = this.questionReward

    const correctRatio = totalCorrect > 0 ? correctSelections / totalCorrect : 0
    const wrongPenalty = wrongSelections / Math.max(1, this.questionData.flows.length)
    const score = Math.round(Math.max(0, correctRatio * 0.7 + (1 - wrongPenalty) * 0.3) * maxScore)

    const mistakes: MistakeEntry[] = []

    const wrongFlows = this.questionData.flows.filter(
      (f) => this.selectedFlowIds.has(f.id) && !correctIds.has(f.id)
    )
    for (const wf of wrongFlows) {
      mistakes.push({
        description: `错误选中: ${wf.summary} (¥${wf.amount.toLocaleString()})`,
        reason: '该流水不在正确组合中',
      })
    }

    const missedFlows = this.questionData.flows.filter(
      (f) => correctIds.has(f.id) && !this.selectedFlowIds.has(f.id)
    )
    for (const mf of missedFlows) {
      mistakes.push({
        description: `遗漏: ${mf.summary} (¥${mf.amount.toLocaleString()})`,
        reason: '该流水应被选中',
      })
    }

    const record: TrainingRecord = {
      id: `rec_${Date.now()}`,
      userId: 'player_1',
      questionId: this.questionId,
      questionType: 'payment_flow',
      score,
      maxScore,
      timeSpent,
      mistakes,
      completedAt: new Date().toISOString(),
    }

    const store = useGameStore.getState()
    store.completeLevel(record)

    this.highlightResults(correctIds)
    this.showResultPopup(score, maxScore, correctSelections, totalCorrect, wrongSelections, missedSelections)
  }

  private highlightResults(correctIds: Set<string>) {
    const flows = this.questionData.flows
    for (let i = 0; i < this.cardContainers.length; i++) {
      const flow = flows[i]
      const container = this.cardContainers[i]
      const children = container.getAll() as Phaser.GameObjects.GameObject[]
      const border = children[1] as Phaser.GameObjects.Rectangle

      const isCorrect = correctIds.has(flow.id)
      const isSelected = this.selectedFlowIds.has(flow.id)

      if (isSelected && isCorrect) {
        border.setStrokeStyle(3, COLOR.emerald)
      } else if (isSelected && !isCorrect) {
        border.setStrokeStyle(3, COLOR.coral)
      } else if (!isSelected && isCorrect) {
        border.setStrokeStyle(3, COLOR.amber)
        border.setAlpha(0.5)
      }
    }
  }

  private showResultPopup(score: number, maxScore: number, correctSel: number, totalCorrect: number, wrongSel: number, missed: number) {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLOR.overlay, 0.8)

    const popupW = 480
    const popupH = 380
    const popupY = (GAME_HEIGHT - popupH) / 2

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, popupW, popupH, COLOR.bg)
      .setStrokeStyle(2, COLOR.amber)

    const title = score >= maxScore * 0.9 ? '优秀!' : score >= maxScore * 0.6 ? '不错!' : '继续努力!'
    const titleColor = score >= maxScore * 0.9 ? '#10B981' : score >= maxScore * 0.6 ? '#D4A843' : '#EF4444'

    this.add.text(GAME_WIDTH / 2, popupY + 40, title, {
      fontSize: '28px',
      fontFamily: 'Arial',
      color: titleColor,
      fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(GAME_WIDTH / 2, popupY + 90, `得分: ${score} / ${maxScore}`, {
      fontSize: '22px',
      fontFamily: 'Arial',
      color: '#FFFFFF',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    const statsY = popupY + 140
    this.add.text(GAME_WIDTH / 2, statsY, `正确选中: ${correctSel} / ${totalCorrect}`, {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#10B981',
    }).setOrigin(0.5)

    this.add.text(GAME_WIDTH / 2, statsY + 30, `错误选中: ${wrongSel}`, {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#EF4444',
    }).setOrigin(0.5)

    this.add.text(GAME_WIDTH / 2, statsY + 60, `遗漏: ${missed}`, {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#D4A843',
    }).setOrigin(0.5)

    const selectedAmount = this.questionData.flows
      .filter((f) => this.selectedFlowIds.has(f.id))
      .reduce((sum, f) => sum + f.amount, 0)
    this.add.text(GAME_WIDTH / 2, statsY + 95, `已选金额: ¥${selectedAmount.toLocaleString()} / 目标: ¥${this.questionData.targetAmount.toLocaleString()}`, {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#94A3B8',
    }).setOrigin(0.5)

    const btnW = 160
    const btnH = 44
    const btnX = GAME_WIDTH / 2 - btnW / 2
    const btnY = popupY + popupH - 70

    const backBtn = this.add.rectangle(btnX + btnW / 2, btnY + btnH / 2, btnW, btnH, COLOR.amber)
      .setInteractive({ useHandCursor: true })
    this.add.text(btnX + btnW / 2, btnY + btnH / 2, '返回菜单', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#1B2A4A',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    backBtn.on('pointerover', () => backBtn.setFillStyle(0xc49a3a))
    backBtn.on('pointerout', () => backBtn.setFillStyle(COLOR.amber))
    backBtn.on('pointerdown', () => this.scene.start('MenuScene'))
  }
}
