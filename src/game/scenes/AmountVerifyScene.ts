import Phaser from 'phaser'
import {
  AmountVerifyData,
  QuoteItem,
  ContractItem,
  Inconsistency,
  REASON_OPTIONS,
  LEVEL_LABELS,
  TrainingRecord,
  MistakeEntry,
  TrainingMode,
} from '@/types'
import { useGameStore } from '@/store/gameStore'
import { GAME_WIDTH, GAME_HEIGHT } from '@/game/config'
import { calculatePaymentCycleDays, formatTime, getEffectiveTimeLimit, getModeWarningThreshold, getModeLabel } from '@/lib/gameUtils'

const COLORS = {
  deepIndigo: 0x1b2a4a,
  amberGold: 0xd4a843,
  slate: 0x64748b,
  emerald: 0x10b981,
  coral: 0xef4444,
  white: 0xffffff,
  rowAlt1: 0xf8fafc,
  rowAlt2: 0xeff6ff,
  cardBg: 0xffffff,
  headerBg: 0xd4a843,
  selectedRow: 0xfef3c7,
  reasonCard: 0xf1f5f9,
  reasonCardSelected: 0xd4a843,
  reasonCardBorder: 0x94a3b8,
}

export class AmountVerifyScene extends Phaser.Scene {
  private questionData!: AmountVerifyData
  private questionId = ''
  private maxScore = 100
  private timeLimit = 120
  private startTime = 0
  private remainingTime = 120
  private elapsedTime = 0
  private timerText!: Phaser.GameObjects.Text
  private timerEvent!: Phaser.Time.TimerEvent
  private trainingMode: TrainingMode = 'timed'

  private flaggedRows: Map<number, string> = new Map()
  private selectedRowIndex: number | null = null
  private selectedReasonIndex: number | null = null

  private quoteRowObjects: Array<{
    bg: Phaser.GameObjects.Rectangle
    border?: Phaser.GameObjects.Rectangle
    texts: Phaser.GameObjects.Text[]
  }> = []
  private contractRowObjects: Array<{
    bg: Phaser.GameObjects.Rectangle
    border?: Phaser.GameObjects.Rectangle
    texts: Phaser.GameObjects.Text[]
  }> = []
  private reasonCardObjects: Array<{
    bg: Phaser.GameObjects.Rectangle
    text: Phaser.GameObjects.Text
  }> = []



  constructor() {
    super({ key: 'AmountVerifyScene' })
  }

  create() {
    const store = useGameStore.getState()
    const question = store.getCurrentQuestion()
    if (!question || question.type !== 'amount_verify') {
      this.scene.start('MenuScene')
      return
    }
    const data = question.data as AmountVerifyData
    this.questionData = data
    this.questionId = question.id
    this.maxScore = question.rewardScore
    this.trainingMode = store.config.trainingMode
    this.timeLimit = getEffectiveTimeLimit(question.timeLimit ?? 120, this.trainingMode)
    this.remainingTime = this.timeLimit
    this.elapsedTime = 0
    this.startTime = Date.now()

    this.drawBackground()
    this.drawTopBar()
    this.drawLeftPanel()
    this.drawRightPanel()
    this.drawReasonCards()
    this.drawSubmitButton()
    this.drawBackButton()
    this.startTimer()
  }

  private drawBackground() {
    const bg = this.add.graphics()
    bg.fillStyle(COLORS.deepIndigo, 1)
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
  }

  private drawTopBar() {
    const bar = this.add.graphics()
    bar.fillStyle(0x0f1a33, 0.8)
    bar.fillRect(0, 0, GAME_WIDTH, 56)

    this.add
      .text(24, 16, LEVEL_LABELS.amount_verify, {
        fontSize: '22px',
        fontFamily: 'Arial',
        color: '#D4A843',
        fontStyle: 'bold',
      })
      .setOrigin(0)

    const modeLabel = getModeLabel(this.trainingMode)
    const modeColor = this.trainingMode === 'exam' ? '#EF4444' : '#10B981'
    this.add
      .text(24, 38, modeLabel, {
        fontSize: '12px',
        fontFamily: 'Arial',
        color: modeColor,
      })
      .setOrigin(0)

    const timeStr = this.trainingMode === 'practice'
      ? `⏱ ${formatTime(this.elapsedTime)}`
      : `⏱ ${this.remainingTime}s`
    this.timerText = this.add.text(GAME_WIDTH - 24, 16, timeStr, {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#FFFFFF',
    })
    this.timerText.setOrigin(1, 0)
  }

  private startTimer() {
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.elapsedTime++
        if (this.trainingMode === 'practice') {
          this.timerText.setText(`⏱ ${formatTime(this.elapsedTime)}`)
        } else {
          this.remainingTime--
          this.timerText.setText(`⏱ ${this.remainingTime}s`)
          const warnThreshold = getModeWarningThreshold(this.trainingMode)
          if (this.remainingTime <= warnThreshold) {
            this.timerText.setColor('#EF4444')
            if (this.trainingMode === 'exam') {
              const flashOn = this.remainingTime % 2 === 0
              this.timerText.setAlpha(flashOn ? 1 : 0.4)
            }
          }
          if (this.remainingTime <= 0) {
            this.timerEvent.remove()
            this.submitResult()
          }
        }
      },
      loop: true,
    })
  }

  private drawLeftPanel() {
    const panelX = 24
    const panelY = 72
    const panelW = GAME_WIDTH * 0.4 - 36
    const panelH = GAME_HEIGHT - 72 - 160

    const card = this.add.graphics()
    card.fillStyle(COLORS.cardBg, 1)
    card.fillRoundedRect(panelX, panelY, panelW, panelH, 8)

    const header = this.add.graphics()
    header.fillStyle(COLORS.headerBg, 1)
    header.fillRoundedRect(panelX, panelY, panelW, 36, { tl: 8, tr: 8, bl: 0, br: 0 })

    this.add
      .text(panelX + panelW / 2, panelY + 18, '报价单', {
        fontSize: '16px',
        fontFamily: 'Arial',
        color: '#1B2A4A',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    const colHeaders = ['服务项目', '单价', '数量', '金额']
    const colX = [panelX + 12, panelX + panelW * 0.4, panelX + panelW * 0.6, panelX + panelW * 0.8]
    const headerY = panelY + 44

    colHeaders.forEach((h, i) => {
      this.add.text(colX[i], headerY, h, {
        fontSize: '13px',
        fontFamily: 'Arial',
        color: '#64748B',
        fontStyle: 'bold',
      })
    })

    const rowH = 36
    const startY = headerY + 24

    this.questionData.quoteItems.forEach((item: QuoteItem, idx: number) => {
      const y = startY + idx * rowH
      const isAlt = idx % 2 === 0
      const bgColor = isAlt ? COLORS.rowAlt1 : COLORS.rowAlt2

      const bg = this.add.rectangle(panelX + 4, y, panelW - 8, rowH, bgColor).setOrigin(0)

      const serviceText = this.add.text(colX[0], y + 8, item.service, {
        fontSize: '13px',
        fontFamily: 'Arial',
        color: '#1B2A4A',
      })
      const unitPriceText = this.add.text(colX[1], y + 8, `¥${item.unitPrice.toLocaleString()}`, {
        fontSize: '13px',
        fontFamily: 'Arial',
        color: '#1B2A4A',
      })
      const qtyText = this.add.text(colX[2], y + 8, `${item.quantity}`, {
        fontSize: '13px',
        fontFamily: 'Arial',
        color: '#1B2A4A',
      })
      const amountText = this.add.text(colX[3], y + 8, `¥${item.amount.toLocaleString()}`, {
        fontSize: '13px',
        fontFamily: 'Arial',
        color: '#1B2A4A',
      })

      const rowObj = { bg, texts: [serviceText, unitPriceText, qtyText, amountText] }
      this.quoteRowObjects.push(rowObj)

      bg.setInteractive({ useHandCursor: true })
      bg.on('pointerdown', () => this.selectRow(idx))
      bg.on('pointerover', () => {
        if (this.selectedRowIndex !== idx) {
          bg.setFillStyle(0xe2e8f0)
        }
      })
      bg.on('pointerout', () => {
        this.updateRowHighlight(idx)
      })
    })
  }

  private drawRightPanel() {
    const panelX = GAME_WIDTH * 0.4 + 12
    const panelY = 72
    const panelW = GAME_WIDTH * 0.4 - 36
    const panelH = GAME_HEIGHT - 72 - 160

    const card = this.add.graphics()
    card.fillStyle(COLORS.cardBg, 1)
    card.fillRoundedRect(panelX, panelY, panelW, panelH, 8)

    const header = this.add.graphics()
    header.fillStyle(COLORS.headerBg, 1)
    header.fillRoundedRect(panelX, panelY, panelW, 36, { tl: 8, tr: 8, bl: 0, br: 0 })

    this.add
      .text(panelX + panelW / 2, panelY + 18, '合同金额', {
        fontSize: '16px',
        fontFamily: 'Arial',
        color: '#1B2A4A',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    const colHeaders = ['服务项目', '金额']
    const colX = [panelX + 12, panelX + panelW * 0.55]
    const headerY = panelY + 44

    colHeaders.forEach((h, i) => {
      this.add.text(colX[i], headerY, h, {
        fontSize: '13px',
        fontFamily: 'Arial',
        color: '#64748B',
        fontStyle: 'bold',
      })
    })

    const rowH = 36
    const startY = headerY + 24

    this.questionData.contractItems.forEach((item: ContractItem, idx: number) => {
      const y = startY + idx * rowH
      const isAlt = idx % 2 === 0
      const bgColor = isAlt ? COLORS.rowAlt1 : COLORS.rowAlt2

      const bg = this.add.rectangle(panelX + 4, y, panelW - 8, rowH, bgColor).setOrigin(0)

      const serviceText = this.add.text(colX[0], y + 8, item.service, {
        fontSize: '13px',
        fontFamily: 'Arial',
        color: '#1B2A4A',
      })
      const amountText = this.add.text(colX[1], y + 8, `¥${item.amount.toLocaleString()}`, {
        fontSize: '13px',
        fontFamily: 'Arial',
        color: '#1B2A4A',
      })

      const rowObj = { bg, texts: [serviceText, amountText] }
      this.contractRowObjects.push(rowObj)

      bg.setInteractive({ useHandCursor: true })
      bg.on('pointerdown', () => this.selectRow(idx))
      bg.on('pointerover', () => {
        if (this.selectedRowIndex !== idx) {
          bg.setFillStyle(0xe2e8f0)
        }
      })
      bg.on('pointerout', () => {
        this.updateRowHighlight(idx)
      })
    })
  }

  private selectRow(index: number) {
    this.selectedRowIndex = index
    this.selectedReasonIndex = null
    this.updateAllRowHighlights()
    this.updateReasonCardHighlights()

    if (this.flaggedRows.has(index) && this.selectedReasonIndex === null) {
      // already flagged - clicking again could unflag if desired, but we keep it simple
    }
  }

  private updateRowHighlight(index: number) {
    const isFlagged = this.flaggedRows.has(index)
    const isSelected = this.selectedRowIndex === index
    const isAlt = index % 2 === 0

    if (isFlagged) {
      this.quoteRowObjects[index]?.bg.setFillStyle(COLORS.selectedRow)
      this.contractRowObjects[index]?.bg.setFillStyle(COLORS.selectedRow)
    } else if (isSelected) {
      this.quoteRowObjects[index]?.bg.setFillStyle(0xbfdbfe)
      this.contractRowObjects[index]?.bg.setFillStyle(0xbfdbfe)
    } else {
      const altColor = isAlt ? COLORS.rowAlt1 : COLORS.rowAlt2
      this.quoteRowObjects[index]?.bg.setFillStyle(altColor)
      this.contractRowObjects[index]?.bg.setFillStyle(altColor)
    }
    this.updateFlagBorders(index)
  }

  private updateAllRowHighlights() {
    const len = Math.max(this.quoteRowObjects.length, this.contractRowObjects.length)
    for (let i = 0; i < len; i++) {
      this.updateRowHighlight(i)
    }
  }

  private updateFlagBorders(index: number) {
    const isFlagged = this.flaggedRows.has(index)

    const qRow = this.quoteRowObjects[index]
    if (qRow) {
      qRow.border?.destroy()
      qRow.border = undefined
      if (isFlagged) {
        const border = this.add.rectangle(
          qRow.bg.x + 1,
          qRow.bg.y,
          4,
          qRow.bg.height,
          COLORS.coral,
        )
        border.setOrigin(0)
        qRow.border = border
      }
    }

    const cRow = this.contractRowObjects[index]
    if (cRow) {
      cRow.border?.destroy()
      cRow.border = undefined
      if (isFlagged) {
        const border = this.add.rectangle(
          cRow.bg.x + 1,
          cRow.bg.y,
          4,
          cRow.bg.height,
          COLORS.coral,
        )
        border.setOrigin(0)
        cRow.border = border
      }
    }
  }

  private drawReasonCards() {
    const bottomY = GAME_HEIGHT - 140
    const cardW = (GAME_WIDTH - 48 - (REASON_OPTIONS.length - 1) * 8) / REASON_OPTIONS.length
    const cardH = 52

    this.add
      .text(24, bottomY - 28, '选择原因（先点击行，再点击原因）', {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: '#94A3B8',
      })
      .setOrigin(0)

    REASON_OPTIONS.forEach((reason, i) => {
      const x = 24 + i * (cardW + 8)
      const y = bottomY

      const bg = this.add.rectangle(x, y, cardW, cardH, COLORS.reasonCard).setOrigin(0)
      bg.setStrokeStyle(2, COLORS.reasonCardBorder)
      bg.setInteractive({ useHandCursor: true })

      const text = this.add.text(x + cardW / 2, y + cardH / 2, reason, {
        fontSize: '13px',
        fontFamily: 'Arial',
        color: '#1B2A4A',
      })
      text.setOrigin(0.5)

      this.reasonCardObjects.push({ bg, text })

      bg.on('pointerdown', () => {
        if (this.selectedRowIndex === null) return
        this.selectedReasonIndex = i
        this.assignReason(i)
      })
      bg.on('pointerover', () => {
        if (this.selectedReasonIndex !== i) {
          bg.setFillStyle(0xe2e8f0)
        }
      })
      bg.on('pointerout', () => {
        this.updateReasonCardHighlights()
      })
    })
  }

  private updateReasonCardHighlights() {
    REASON_OPTIONS.forEach((_, i) => {
      const card = this.reasonCardObjects[i]
      if (this.selectedReasonIndex === i) {
        card.bg.setFillStyle(COLORS.reasonCardSelected)
        card.bg.setStrokeStyle(2, COLORS.amberGold)
        card.text.setColor('#1B2A4A')
      } else {
        card.bg.setFillStyle(COLORS.reasonCard)
        card.bg.setStrokeStyle(2, COLORS.reasonCardBorder)
        card.text.setColor('#1B2A4A')
      }
    })
  }

  private assignReason(reasonIdx: number) {
    if (this.selectedRowIndex === null) return
    const reason = REASON_OPTIONS[reasonIdx]
    this.flaggedRows.set(this.selectedRowIndex, reason)
    this.updateAllRowHighlights()
    this.updateReasonCardHighlights()
  }

  private drawSubmitButton() {
    const btnX = GAME_WIDTH - 164
    const btnY = GAME_HEIGHT - 64
    const btnW = 140
    const btnH = 44

    const bg = this.add.rectangle(btnX, btnY, btnW, btnH, COLORS.emerald).setOrigin(0)
    bg.setInteractive({ useHandCursor: true })

    const label = this.add.text(btnX + btnW / 2, btnY + btnH / 2, '提交结果', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#FFFFFF',
      fontStyle: 'bold',
    })
    label.setOrigin(0.5)

    this.add.container(0, 0, [bg, label])

    bg.on('pointerover', () => bg.setFillStyle(0x059669))
    bg.on('pointerout', () => bg.setFillStyle(COLORS.emerald))
    bg.on('pointerdown', () => {
      this.timerEvent.remove()
      this.submitResult()
    })
  }

  private drawBackButton() {
    const btnX = 24
    const btnY = GAME_HEIGHT - 64
    const btnW = 100
    const btnH = 44

    const bg = this.add.rectangle(btnX, btnY, btnW, btnH, COLORS.slate).setOrigin(0)
    bg.setInteractive({ useHandCursor: true })

    const label = this.add.text(btnX + btnW / 2, btnY + btnH / 2, '返回', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#FFFFFF',
    })
    label.setOrigin(0.5)

    bg.on('pointerover', () => bg.setFillStyle(0x475569))
    bg.on('pointerout', () => bg.setFillStyle(COLORS.slate))
    bg.on('pointerdown', () => {
      this.timerEvent.remove()
      this.scene.start('MenuScene')
    })
  }

  private submitResult() {
    const timeSpent = this.elapsedTime > 0 ? this.elapsedTime : Math.floor((Date.now() - this.startTime) / 1000)
    const inconsistencies = this.questionData.inconsistencies
    const totalInconsistencies = inconsistencies.length
    if (totalInconsistencies === 0) return

    let correctFlags = 0
    let correctReasons = 0
    const mistakes: MistakeEntry[] = []

    inconsistencies.forEach((inc: Inconsistency) => {
      const playerReason = this.flaggedRows.get(inc.index)
      if (playerReason !== undefined) {
        correctFlags++
        if (playerReason === inc.reason) {
          correctReasons++
        } else {
          mistakes.push({
            description: `第${inc.index + 1}行"${this.questionData.quoteItems[inc.index]?.service ?? ''}"原因选择错误（应选：${inc.reason}，实际：${playerReason}）`,
            reason: '原因不匹配',
          })
        }
      } else {
        mistakes.push({
          description: `第${inc.index + 1}行"${this.questionData.quoteItems[inc.index]?.service ?? ''}"未标记为不一致（系统原因：${inc.reason}）`,
          reason: '遗漏标记',
        })
      }
    })

    this.flaggedRows.forEach((reason, index) => {
      const isActual = inconsistencies.some((inc) => inc.index === index)
      if (!isActual) {
        mistakes.push({
          description: `第${index + 1}行"${this.questionData.quoteItems[index]?.service ?? ''}"被误标为不一致（原因：${reason}）`,
          reason: '误报标记',
        })
      }
    })

    const flagScore = (correctFlags / totalInconsistencies) * this.maxScore * 0.5
    const reasonScore = (correctReasons / totalInconsistencies) * this.maxScore * 0.5
    const totalScore = Math.round(flagScore + reasonScore)

    const paymentCycleDays = calculatePaymentCycleDays(
      totalScore,
      this.maxScore,
      timeSpent,
      this.timeLimit,
      this.trainingMode,
    )

    const store = useGameStore.getState()
    const record: TrainingRecord = {
      id: `record_${Date.now()}`,
      userId: store.progress.userId,
      questionId: this.questionId,
      questionType: 'amount_verify',
      score: totalScore,
      maxScore: this.maxScore,
      timeSpent,
      paymentCycleDays,
      mistakes,
      completedAt: new Date().toISOString(),
    }
    store.completeLevel(record)

    this.showResult(totalScore, inconsistencies, mistakes, paymentCycleDays)
  }

  private showResult(
    score: number,
    inconsistencies: Inconsistency[],
    mistakes: MistakeEntry[],
    paymentCycleDays: number,
  ) {
    this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.6,
    )

    const popupW = 560
    const popupH = 460
    const popupX = (GAME_WIDTH - popupW) / 2
    const popupY = (GAME_HEIGHT - popupH) / 2

    const popup = this.add.graphics()
    popup.fillStyle(0xffffff, 1)
    popup.fillRoundedRect(popupX, popupY, popupW, popupH, 12)

    const scoreColor = score >= this.maxScore * 0.8 ? '#10B981' : score >= this.maxScore * 0.5 ? '#D4A843' : '#EF4444'
    this.add
      .text(GAME_WIDTH / 2, popupY + 32, `得分：${score} / ${this.maxScore}`, {
        fontSize: '26px',
        fontFamily: 'Arial',
        color: scoreColor,
        fontStyle: 'bold',
      })
      .setOrigin(0.5)

    this.add
      .text(GAME_WIDTH / 2, popupY + 64, `预计回款周期：${paymentCycleDays} 天`, {
        fontSize: '15px',
        fontFamily: 'Arial',
        color: '#1B2A4A',
      })
      .setOrigin(0.5)

    const detailY = popupY + 96
    this.add
      .text(popupX + 20, detailY, '正确答案：', {
        fontSize: '15px',
        fontFamily: 'Arial',
        color: '#1B2A4A',
        fontStyle: 'bold',
      })
      .setOrigin(0)

    inconsistencies.forEach((inc: Inconsistency, i: number) => {
      const item = this.questionData.quoteItems[inc.index]
      this.add
        .text(popupX + 24, detailY + 26 + i * 24, `• 第${inc.index + 1}行 "${item?.service ?? ''}" — ${inc.reason}`, {
          fontSize: '13px',
          fontFamily: 'Arial',
          color: '#10B981',
        })
        .setOrigin(0)
    })

    if (mistakes.length > 0) {
      const mistakeStartY = detailY + 26 + inconsistencies.length * 24 + 12
      this.add
        .text(popupX + 20, mistakeStartY, '错误记录：', {
          fontSize: '15px',
          fontFamily: 'Arial',
          color: '#EF4444',
          fontStyle: 'bold',
        })
        .setOrigin(0)

      const maxVisible = Math.min(mistakes.length, 5)
      for (let i = 0; i < maxVisible; i++) {
        this.add
          .text(
            popupX + 24,
            mistakeStartY + 24 + i * 20,
            `• ${mistakes[i].description}`,
            {
              fontSize: '12px',
              fontFamily: 'Arial',
              color: '#64748B',
            },
          )
          .setOrigin(0)
      }
    }

    const closeBtnW = 120
    const closeBtnH = 40
    const closeBtnX = GAME_WIDTH / 2 - closeBtnW / 2
    const closeBtnY = popupY + popupH - 56

    const closeBg = this.add.rectangle(closeBtnX, closeBtnY, closeBtnW, closeBtnH, COLORS.deepIndigo).setOrigin(0)
    closeBg.setInteractive({ useHandCursor: true })

    this.add
      .text(closeBtnX + closeBtnW / 2, closeBtnY + closeBtnH / 2, '返回菜单', {
        fontSize: '15px',
        fontFamily: 'Arial',
        color: '#FFFFFF',
      })
      .setOrigin(0.5)

    closeBg.on('pointerover', () => closeBg.setFillStyle(0x2d4a7a))
    closeBg.on('pointerout', () => closeBg.setFillStyle(COLORS.deepIndigo))
    closeBg.on('pointerdown', () => {
      this.scene.start('MenuScene')
    })

    this.add.container(0, 0)
  }
}
