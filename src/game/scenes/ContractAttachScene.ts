import Phaser from 'phaser'
import Matter from 'matter-js'
import {
  ContractAttachData,
  ClauseEntry,
  AttachmentEntry,
  TrainingRecord,
  MistakeEntry,
  LEVEL_LABELS,
  TrainingMode,
} from '@/types'
import { useGameStore } from '@/store/gameStore'
import { GAME_WIDTH, GAME_HEIGHT } from '@/game/config'
import { calculatePaymentCycleDays, formatTime, getEffectiveTimeLimit, getModeWarningThreshold, getModeLabel } from '@/lib/gameUtils'

const COLORS = {
  deepIndigo: 0x1B2A4A,
  amberGold: 0xD4A843,
  slate: 0x64748B,
  emerald: 0x10B981,
  coral: 0xEF4444,
  white: 0xFFFFFF,
}

const CONTRACT_CARD_X = 80
const CONTRACT_CARD_Y = 80
const CONTRACT_CARD_W = 580
const ROW_HEIGHT = 68
const ROW_GAP = 10
const DROP_ZONE_W = 180
const DROP_ZONE_H = 56

const ATTACH_CARD_W = 150
const ATTACH_CARD_H = 64
const ATTACH_CARD_GAP = 16

const LERP_FACTOR = 0.25

const TYPE_ICONS: Record<string, string> = {
  pdf: '📄',
  xlsx: '📊',
  doc: '📝',
  jpg: '🖼',
  png: '🖼',
}

interface AttachmentCardData {
  entry: AttachmentEntry
  container: Phaser.GameObjects.Container
  body: MatterJS.BodyType
  originalX: number
  originalY: number
  placedClauseId: string | null
}

interface DropZoneData {
  clauseId: string
  zone: Phaser.GameObjects.Zone
  border: Phaser.GameObjects.Graphics
  checkMark: Phaser.GameObjects.Text
  label: Phaser.GameObjects.Text
}

export class ContractAttachScene extends Phaser.Scene {
  private questionData!: ContractAttachData
  private questionId = ''
  private maxScore = 100
  private timeLimit = 120
  private remainingTime = 120
  private elapsed = 0
  private elapsedTime = 0
  private trainingMode: TrainingMode = 'timed'
  private timerText!: Phaser.GameObjects.Text
  private timerEvent!: Phaser.Time.TimerEvent
  private submitted = false
  private POOL_Y = 0
  private mergedAttachmentPool: AttachmentEntry[] = []

  private attachmentCards: AttachmentCardData[] = []
  private dropZones: DropZoneData[] = []
  private dragging: AttachmentCardData | null = null
  private dragTarget = { x: 0, y: 0 }

  private clauseRowMap: Map<string, { y: number; clause: ClauseEntry }> = new Map()

  constructor() {
    super({ key: 'ContractAttachScene' })
  }

  create() {
    const store = useGameStore.getState()
    const question = store.getCurrentQuestion()
    if (!question || question.type !== 'contract_attach') {
      this.scene.start('MenuScene')
      return
    }

    this.questionId = question.id
    this.maxScore = question.rewardScore
    this.trainingMode = store.config.trainingMode
    this.timeLimit = getEffectiveTimeLimit(question.timeLimit ?? 120, this.trainingMode)
    this.remainingTime = this.timeLimit
    this.questionData = question.data as ContractAttachData
    this.elapsedTime = 0
    this.POOL_Y = GAME_HEIGHT - 130

    const qbAttachments = this.questionData.attachmentPool
    const materialAttachments: AttachmentEntry[] = store.config.materials
      .filter((m) => ['pdf', 'xlsx', 'xls', 'doc', 'docx', 'jpg', 'jpeg', 'png'].includes(m.type.toLowerCase()))
      .filter((m) => !qbAttachments.some((a) => a.name === m.name))
      .map((m) => ({
        id: `mat_${m.id}`,
        name: m.name.replace(/\.[^.]+$/, ''),
        type: m.type.toLowerCase(),
      }))
    this.mergedAttachmentPool = [...qbAttachments, ...materialAttachments]

    this.drawBackground()
    this.drawTitle()
    this.drawContractCard()
    this.drawAttachmentPool()
    this.drawSubmitButton()
    this.drawBackButton()
    this.setupDrag()
    this.startTimer()
  }

  update() {
    if (!this.dragging) return

    const card = this.dragging
    const dx = this.dragTarget.x - card.container.x
    const dy = this.dragTarget.y - card.container.y
    const nx = card.container.x + dx * LERP_FACTOR
    const ny = card.container.y + dy * LERP_FACTOR
    card.container.setPosition(nx, ny)
    card.container.setRotation(Phaser.Math.Clamp(dx * 0.0008, -0.08, 0.08))
    Matter.Body.setPosition(card.body as unknown as Matter.Body, { x: nx, y: ny })
  }

  private drawBackground() {
    const bg = this.add.graphics()
    bg.fillStyle(COLORS.deepIndigo, 1)
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    bg.lineStyle(1, 0xFFFFFF, 0.03)
    for (let x = 0; x < GAME_WIDTH; x += 40) {
      bg.lineBetween(x, 0, x, GAME_HEIGHT)
    }
    for (let y = 0; y < GAME_HEIGHT; y += 40) {
      bg.lineBetween(0, y, GAME_WIDTH, y)
    }
  }

  private drawTitle() {
    this.add.text(GAME_WIDTH / 2, 14, LEVEL_LABELS.contract_attach, {
      fontSize: '28px',
      fontFamily: 'Arial',
      color: '#D4A843',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0)

    const modeLabel = getModeLabel(this.trainingMode)
    const modeColor = this.trainingMode === 'exam' ? '#EF4444' : '#10B981'
    this.add.text(GAME_WIDTH / 2, 44, modeLabel, {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: modeColor,
    }).setOrigin(0.5, 0)

    const timerInitial = this.trainingMode === 'practice'
      ? formatTime(this.elapsedTime)
      : `${this.remainingTime}s`
    this.timerText = this.add.text(GAME_WIDTH - 30, 22, timerInitial, {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: this.trainingMode === 'practice' ? '#64748B' : '#FFFFFF',
    }).setOrigin(1, 0)

    this.add.text(GAME_WIDTH / 2, 65, '请将附件拖拽到对应的合同条款位置', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#94A3B8',
    }).setOrigin(0.5, 0)
  }

  private drawContractCard() {
    const clauses = this.questionData.contractClauses
    const cardH = clauses.length * (ROW_HEIGHT + ROW_GAP) + 40

    const shadow = this.add.graphics()
    shadow.fillStyle(0x000000, 0.15)
    shadow.fillRoundedRect(CONTRACT_CARD_X + 4, CONTRACT_CARD_Y + 4, CONTRACT_CARD_W, cardH, 8)

    const card = this.add.graphics()
    card.fillStyle(COLORS.white, 1)
    card.fillRoundedRect(CONTRACT_CARD_X, CONTRACT_CARD_Y, CONTRACT_CARD_W, cardH, 8)

    this.add.text(CONTRACT_CARD_X + 20, CONTRACT_CARD_Y + 12, '合同条款', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#1B2A4A',
      fontStyle: 'bold',
    })

    clauses.forEach((clause: ClauseEntry, i: number) => {
      const rowY = CONTRACT_CARD_Y + 42 + i * (ROW_HEIGHT + ROW_GAP)

      const rowBg = this.add.graphics()
      rowBg.fillStyle(0xF8FAFC, 1)
      rowBg.fillRoundedRect(CONTRACT_CARD_X + 10, rowY, CONTRACT_CARD_W - 20, ROW_HEIGHT, 6)

      const clauseLabel = this.add.text(CONTRACT_CARD_X + 22, rowY + 10, `条款 ${i + 1}`, {
        fontSize: '11px',
        fontFamily: 'Arial',
        color: '#64748B',
      })

      const clauseText = this.add.text(CONTRACT_CARD_X + 22, rowY + 28, clause.clause, {
        fontSize: '13px',
        fontFamily: 'Arial',
        color: '#1B2A4A',
        wordWrap: { width: CONTRACT_CARD_W - DROP_ZONE_W - 50 },
      })

      const zoneX = CONTRACT_CARD_X + CONTRACT_CARD_W - DROP_ZONE_W - 15 + DROP_ZONE_W / 2
      const zoneY = rowY + ROW_HEIGHT / 2

      const border = this.add.graphics()
      this.drawDashedRect(border, CONTRACT_CARD_X + CONTRACT_CARD_W - DROP_ZONE_W - 15, rowY + (ROW_HEIGHT - DROP_ZONE_H) / 2, DROP_ZONE_W, DROP_ZONE_H, COLORS.slate, 0.6)

      const zone = this.add.zone(zoneX, zoneY, DROP_ZONE_W, DROP_ZONE_H)
      zone.setData('clauseId', clause.id)

      const checkMark = this.add.text(zoneX, zoneY, '✓', {
        fontSize: '20px',
        fontFamily: 'Arial',
        color: '#10B981',
        fontStyle: 'bold',
      }).setOrigin(0.5).setAlpha(0)

      const placeholderLabel = this.add.text(zoneX, zoneY, '拖入附件', {
        fontSize: '12px',
        fontFamily: 'Arial',
        color: '#94A3B8',
      }).setOrigin(0.5)

      this.dropZones.push({
        clauseId: clause.id,
        zone,
        border,
        checkMark,
        label: placeholderLabel,
      })

      this.clauseRowMap.set(clause.id, { y: rowY, clause })
    })
  }

  private drawDashedRect(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    w: number,
    h: number,
    color: number,
    alpha: number,
    dashLen = 8,
    gapLen = 5,
  ) {
    g.lineStyle(2, color, alpha)
    const segments = [
      { sx: x, sy: y, ex: x + w, ey: y },
      { sx: x + w, sy: y, ex: x + w, ey: y + h },
      { sx: x + w, sy: y + h, ex: x, ey: y + h },
      { sx: x, sy: y + h, ex: x, ey: y },
    ]
    for (const seg of segments) {
      const dx = seg.ex - seg.sx
      const dy = seg.ey - seg.sy
      const len = Math.sqrt(dx * dx + dy * dy)
      const steps = Math.floor(len / (dashLen + gapLen))
      const ux = dx / len
      const uy = dy / len
      for (let i = 0; i < steps; i++) {
        const startDist = i * (dashLen + gapLen)
        const endDist = startDist + dashLen
        g.lineBetween(
          seg.sx + ux * startDist,
          seg.sy + uy * startDist,
          seg.sx + ux * endDist,
          seg.sy + uy * endDist,
        )
      }
    }
  }

  private drawAttachmentPool() {
    const poolLabel = this.add.text(GAME_WIDTH / 2, this.POOL_Y - 24, '附件池', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#94A3B8',
    }).setOrigin(0.5)

    const poolBg = this.add.graphics()
    poolBg.fillStyle(0x0F1D36, 0.5)
    poolBg.fillRoundedRect(30, this.POOL_Y - 8, GAME_WIDTH - 60, ATTACH_CARD_H + 32, 10)

    const attachments = [...this.mergedAttachmentPool]
    this.shuffleArray(attachments)

    const totalWidth = attachments.length * ATTACH_CARD_W + (attachments.length - 1) * ATTACH_CARD_GAP
    const startX = (GAME_WIDTH - totalWidth) / 2 + ATTACH_CARD_W / 2

    attachments.forEach((att: AttachmentEntry, i: number) => {
      const cx = startX + i * (ATTACH_CARD_W + ATTACH_CARD_GAP)
      const cy = this.POOL_Y + ATTACH_CARD_H / 2 + 8

      const container = this.createAttachmentCard(att, cx, cy)

      const body = this.matter.add.rectangle(cx, cy, ATTACH_CARD_W, ATTACH_CARD_H, {
        isStatic: true,
        friction: 0.9,
        restitution: 0.05,
        label: att.id,
      })

      const card: AttachmentCardData = {
        entry: att,
        container,
        body,
        originalX: cx,
        originalY: cy,
        placedClauseId: null,
      }
      this.attachmentCards.push(card)
      container.setData('cardData', card)
    })
  }

  private createAttachmentCard(
    att: AttachmentEntry,
    cx: number,
    cy: number,
  ): Phaser.GameObjects.Container {
    const container = this.add.container(cx, cy)

    const bg = this.add.graphics()
    bg.fillStyle(0x0F1D36, 0.92)
    bg.fillRoundedRect(-ATTACH_CARD_W / 2, -ATTACH_CARD_H / 2, ATTACH_CARD_W, ATTACH_CARD_H, 8)
    bg.lineStyle(2, COLORS.amberGold, 0.5)
    bg.strokeRoundedRect(-ATTACH_CARD_W / 2, -ATTACH_CARD_H / 2, ATTACH_CARD_W, ATTACH_CARD_H, 8)

    const icon = TYPE_ICONS[att.type] || '📄'
    const iconText = this.add.text(-ATTACH_CARD_W / 2 + 12, -ATTACH_CARD_H / 2 + 10, icon, {
      fontSize: '22px',
      fontFamily: 'Arial',
    })

    const nameText = this.add.text(-ATTACH_CARD_W / 2 + 42, -ATTACH_CARD_H / 2 + 8, att.name, {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#FFFFFF',
      fontStyle: 'bold',
      wordWrap: { width: ATTACH_CARD_W - 80 },
    })

    const typeBadgeBg = this.add.graphics()
    const badgeW = 38
    const badgeH = 18
    const badgeX = -ATTACH_CARD_W / 2 + 42
    const badgeY = -ATTACH_CARD_H / 2 + 32
    typeBadgeBg.fillStyle(COLORS.amberGold, 0.25)
    typeBadgeBg.fillRoundedRect(badgeX, badgeY, badgeW, badgeH, 4)

    const typeText = this.add.text(badgeX + badgeW / 2, badgeY + badgeH / 2, att.type.toUpperCase(), {
      fontSize: '10px',
      fontFamily: 'Arial',
      color: '#D4A843',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    container.add([bg, iconText, nameText, typeBadgeBg, typeText])
    container.setSize(ATTACH_CARD_W, ATTACH_CARD_H)
    container.setDepth(10)
    return container
  }

  private drawSubmitButton() {
    const btnX = GAME_WIDTH / 2
    const btnY = GAME_HEIGHT - 30
    const btnW = 180
    const btnH = 42

    const btnBg = this.add.graphics()
    btnBg.fillStyle(COLORS.amberGold, 1)
    btnBg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8)

    this.add.text(btnX, btnY, '提交结果', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#1B2A4A',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(1)

    const hitArea = this.add.rectangle(btnX, btnY, btnW, btnH, 0x000000, 0)
    hitArea.setInteractive({ useHandCursor: true })
    hitArea.on('pointerover', () => btnBg.setAlpha(0.85))
    hitArea.on('pointerout', () => btnBg.setAlpha(1))
    hitArea.on('pointerdown', () => this.onSubmit())
  }

  private drawBackButton() {
    const txt = this.add.text(50, GAME_HEIGHT - 30, '← 返回', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#64748B',
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true })

    txt.on('pointerover', () => txt.setColor('#D4A843'))
    txt.on('pointerout', () => txt.setColor('#64748B'))
    txt.on('pointerdown', () => this.scene.start('MenuScene'))
  }

  private setupDrag() {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.submitted) return
      for (let i = this.attachmentCards.length - 1; i >= 0; i--) {
        const card = this.attachmentCards[i]
        const bounds = card.container.getBounds()
        if (bounds.contains(pointer.x, pointer.y)) {
          this.dragging = card
          this.dragTarget.x = pointer.x
          this.dragTarget.y = pointer.y
          card.container.setDepth(20)

          if (card.placedClauseId) {
            this.clearDropZone(card.placedClauseId)
            card.placedClauseId = null
          }
          break
        }
      }
    })

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.dragging) return
      this.dragTarget.x = pointer.x
      this.dragTarget.y = pointer.y
    })

    this.input.on('pointerup', () => {
      if (!this.dragging) return
      const card = this.dragging
      this.dragging = null
      card.container.setDepth(10)
      card.container.setRotation(0)

      const matchedZone = this.getDropZoneAt(card.container.x, card.container.y)
      if (matchedZone) {
        const correctAttachmentId = this.questionData.correctMapping[matchedZone.clauseId]
        if (card.entry.id === correctAttachmentId) {
          this.snapToZone(card, matchedZone)
          this.markZoneCorrect(matchedZone)
        } else {
          this.flashAndReturn(card, matchedZone)
        }
      } else {
        this.returnCard(card)
      }
    })
  }

  private getDropZoneAt(x: number, y: number): DropZoneData | null {
    for (const dz of this.dropZones) {
      if (dz.zone.getBounds().contains(x, y)) {
        return dz
      }
    }
    return null
  }

  private snapToZone(card: AttachmentCardData, dz: DropZoneData) {
    const zoneBounds = dz.zone.getBounds()
    const snapX = zoneBounds.centerX
    const snapY = zoneBounds.centerY

    this.tweens.add({
      targets: card.container,
      x: snapX,
      y: snapY,
      duration: 150,
      ease: 'Back.easeOut',
      onUpdate: () => {
        Matter.Body.setPosition(card.body as unknown as Matter.Body, {
          x: card.container.x,
          y: card.container.y,
        })
      },
    })

    card.placedClauseId = dz.clauseId
  }

  private markZoneCorrect(dz: DropZoneData) {
    dz.checkMark.setAlpha(1)
    dz.label.setAlpha(0)

    const zoneBounds = dz.zone.getBounds()
    dz.border.clear()
    dz.border.lineStyle(2, COLORS.emerald, 1)
    dz.border.strokeRoundedRect(zoneBounds.x - zoneBounds.width / 2, zoneBounds.y - zoneBounds.height / 2, zoneBounds.width, zoneBounds.height, 6)
    dz.border.fillStyle(COLORS.emerald, 0.08)
    dz.border.fillRoundedRect(zoneBounds.x - zoneBounds.width / 2, zoneBounds.y - zoneBounds.height / 2, zoneBounds.width, zoneBounds.height, 6)
  }

  private flashAndReturn(card: AttachmentCardData, dz: DropZoneData) {
    const zoneBounds = dz.zone.getBounds()
    const flashBg = this.add.graphics()
    flashBg.fillStyle(COLORS.coral, 0.3)
    flashBg.fillRoundedRect(zoneBounds.x - zoneBounds.width / 2, zoneBounds.y - zoneBounds.height / 2, zoneBounds.width, zoneBounds.height, 6)
    flashBg.setDepth(5)

    this.tweens.add({
      targets: flashBg,
      alpha: 0,
      duration: 400,
      onComplete: () => flashBg.destroy(),
    })

    this.returnCard(card)
  }

  private returnCard(card: AttachmentCardData) {
    this.tweens.add({
      targets: card.container,
      x: card.originalX,
      y: card.originalY,
      duration: 250,
      ease: 'Back.easeOut',
      onUpdate: () => {
        Matter.Body.setPosition(card.body as unknown as Matter.Body, {
          x: card.container.x,
          y: card.container.y,
        })
      },
    })
    card.placedClauseId = null
  }

  private clearDropZone(clauseId: string) {
    const dz = this.dropZones.find((z) => z.clauseId === clauseId)
    if (!dz) return

    dz.checkMark.setAlpha(0)
    dz.label.setAlpha(1)

    const zoneBounds = dz.zone.getBounds()
    dz.border.clear()
    this.drawDashedRect(
      dz.border,
      zoneBounds.x - zoneBounds.width / 2,
      zoneBounds.y - zoneBounds.height / 2,
      zoneBounds.width,
      zoneBounds.height,
      COLORS.slate,
      0.6,
    )
  }

  private startTimer() {
    this.elapsed = 0
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        this.elapsedTime++
        if (this.trainingMode === 'practice') {
          this.timerText.setText(formatTime(this.elapsedTime))
        } else {
          this.remainingTime--
          this.timerText.setText(`${Math.max(0, this.remainingTime)}s`)
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
            this.onSubmit()
          }
        }
      },
    })
  }

  private onSubmit() {
    if (this.submitted) return
    this.submitted = true
    this.timerEvent.remove()

    const timeSpent = this.elapsedTime > 0 ? this.elapsedTime : this.elapsed

    const correctMapping = this.questionData.correctMapping
    const totalClauses = this.questionData.contractClauses.length
    let correct = 0
    const mistakes: MistakeEntry[] = []

    for (const clause of this.questionData.contractClauses) {
      const expectedAttachId = correctMapping[clause.id]
      const placedCard = this.attachmentCards.find((c) => c.placedClauseId === clause.id)

      if (placedCard && placedCard.entry.id === expectedAttachId) {
        correct++
      } else {
        const placedName = placedCard ? placedCard.entry.name : '(未放置)'
        const correctEntry = this.mergedAttachmentPool.find((a) => a.id === expectedAttachId)
        mistakes.push({
          description: `条款"${clause.clause}": 应为"${correctEntry?.name ?? expectedAttachId}", 实为"${placedName}"`,
          reason: '附件匹配错误',
        })
      }
    }

    const totalScore = Math.round((correct / totalClauses) * this.maxScore)

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
      questionType: 'contract_attach',
      score: totalScore,
      maxScore: this.maxScore,
      timeSpent,
      paymentCycleDays,
      mistakes,
      completedAt: new Date().toISOString(),
    }

    store.completeLevel(record)
    this.showResult(totalScore, this.maxScore, correct, totalClauses, mistakes, paymentCycleDays)
  }

  private showResult(
    score: number,
    maxScore: number,
    correct: number,
    total: number,
    mistakes: MistakeEntry[],
    paymentCycleDays: number,
  ) {
    const overlay = this.add.graphics().setDepth(50)
    overlay.fillStyle(0x000000, 0.7)
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    const pw = 520
    const ph = 440
    const px = GAME_WIDTH / 2 - pw / 2
    const py = GAME_HEIGHT / 2 - ph / 2

    const panel = this.add.graphics().setDepth(60)
    panel.fillStyle(0x0F1D36, 1)
    panel.fillRoundedRect(px, py, pw, ph, 12)
    panel.lineStyle(2, COLORS.amberGold, 0.8)
    panel.strokeRoundedRect(px, py, pw, ph, 12)

    const pct = Math.round((score / maxScore) * 100)
    const labelColor = pct >= 90 ? '#10B981' : pct >= 60 ? '#D4A843' : '#EF4444'
    const labelText = pct >= 90 ? '优秀！' : pct >= 60 ? '继续加油！' : '需要改进'

    this.add
      .text(GAME_WIDTH / 2, py + 30, labelText, {
        fontSize: '28px',
        fontFamily: 'Arial',
        color: labelColor,
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0)
      .setDepth(61)

    this.add
      .text(GAME_WIDTH / 2, py + 75, `得分: ${score} / ${maxScore}`, {
        fontSize: '22px',
        fontFamily: 'Arial',
        color: '#FFFFFF',
      })
      .setOrigin(0.5, 0)
      .setDepth(61)

    this.add
      .text(GAME_WIDTH / 2, py + 105, `预计回款周期：${paymentCycleDays} 天`, {
        fontSize: '15px',
        fontFamily: 'Arial',
        color: '#D4A843',
      })
      .setOrigin(0.5, 0)
      .setDepth(61)

    this.add
      .text(GAME_WIDTH / 2, py + 135, `正确匹配: ${correct} / ${total}`, {
        fontSize: '18px',
        fontFamily: 'Arial',
        color: '#94A3B8',
      })
      .setOrigin(0.5, 0)
      .setDepth(61)

    if (mistakes.length > 0) {
      this.add
        .text(GAME_WIDTH / 2, py + 175, '错误详情:', {
          fontSize: '16px',
          fontFamily: 'Arial',
          color: '#EF4444',
          fontStyle: 'bold',
        })
        .setOrigin(0.5, 0)
        .setDepth(61)

      mistakes.slice(0, 4).forEach((m, i) => {
        this.add
          .text(GAME_WIDTH / 2, py + 203 + i * 24, m.description, {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#CBD5E1',
            wordWrap: { width: pw - 40 },
          })
          .setOrigin(0.5, 0)
          .setDepth(61)
      })
    }

    const btnW = 160
    const btnH = 44
    const btnY = py + ph - 55

    const btnBg = this.add.graphics().setDepth(61)
    btnBg.fillStyle(COLORS.amberGold, 1)
    btnBg.fillRoundedRect(GAME_WIDTH / 2 - btnW / 2, btnY, btnW, btnH, 8)

    this.add
      .text(GAME_WIDTH / 2, btnY + btnH / 2, '返回菜单', {
        fontSize: '18px',
        fontFamily: 'Arial',
        color: '#1B2A4A',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(62)

    const hitBtn = this.add
      .rectangle(GAME_WIDTH / 2, btnY + btnH / 2, btnW, btnH, 0x000000, 0)
      .setDepth(63)
      .setInteractive({ useHandCursor: true })
    hitBtn.on('pointerdown', () => this.scene.start('MenuScene'))
  }

  private shuffleArray<T>(arr: T[]) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
  }
}
