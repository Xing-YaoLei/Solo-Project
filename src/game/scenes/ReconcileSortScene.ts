import Phaser from 'phaser'
import Matter from 'matter-js'
import { ReconcileSortData, DiffEntry, TrainingRecord, MistakeEntry, LEVEL_LABELS } from '@/types'
import { useGameStore } from '@/store/gameStore'
import { GAME_WIDTH, GAME_HEIGHT } from '@/game/config'

const COLORS = {
  deepIndigo: 0x1B2A4A,
  amberGold: 0xD4A843,
  slate: 0x64748B,
  emerald: 0x10B981,
  coral: 0xEF4444,
  white: 0xFFFFFF,
}

const SEVERITY_COLORS: Record<number, number> = {
  5: 0xEF4444,
  4: 0xF97316,
  3: 0xEAB308,
  2: 0x3B82F6,
  1: 0x64748B,
}

const SLOT_X = 850
const SLOT_START_Y = 120
const SLOT_WIDTH = 340
const SLOT_HEIGHT = 80
const SLOT_GAP = 16
const SLOT_LABELS = ['1 (最严重)', '2', '3', '4', '5 (最轻微)']

const CARD_WIDTH = 250
const CARD_HEIGHT = 70
const CARD_X = 60
const CARD_START_Y = 120
const CARD_GAP = 14

const LERP_FACTOR = 0.25

interface CardData {
  diffEntry: DiffEntry
  container: Phaser.GameObjects.Container
  body: MatterJS.BodyType
  originalX: number
  originalY: number
  slotIndex: number | null
}

export class ReconcileSortScene extends Phaser.Scene {
  private questionData!: ReconcileSortData
  private questionId!: string
  private maxScore!: number
  private cards: CardData[] = []
  private slotCards: (CardData | null)[] = [null, null, null, null, null]
  private dragging: CardData | null = null
  private dragTarget = { x: 0, y: 0 }
  private elapsed = 0
  private timerText!: Phaser.GameObjects.Text
  private timerEvent!: Phaser.Time.TimerEvent
  private submitted = false
  private slotZones: Phaser.GameObjects.Zone[] = []

  constructor() {
    super({ key: 'ReconcileSortScene' })
  }

  create() {
    const store = useGameStore.getState()
    const questions = store.getQuestionsByType('reconcile_sort')
    if (!questions.length) {
      this.scene.start('MenuScene')
      return
    }

    const question = questions[0]
    this.questionId = question.id
    this.maxScore = question.reward
    this.questionData = question.data as ReconcileSortData

    this.drawBackground()
    this.drawTitle()
    this.drawDropSlots()
    this.drawCards()
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
    this.add.text(GAME_WIDTH / 2, 18, LEVEL_LABELS.reconcile_sort, {
      fontSize: '28px',
      fontFamily: 'Arial',
      color: '#D4A843',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0)

    this.timerText = this.add.text(GAME_WIDTH - 30, 22, '00:00', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#64748B',
    }).setOrigin(1, 0)

    this.add.text(GAME_WIDTH / 2, 55, '请将差异卡片按严重程度从高到低排列', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#94A3B8',
    }).setOrigin(0.5, 0)
  }

  private drawDropSlots() {
    for (let i = 0; i < 5; i++) {
      const y = SLOT_START_Y + i * (SLOT_HEIGHT + SLOT_GAP)

      const g = this.add.graphics()
      g.lineStyle(2, COLORS.amberGold, 0.5)
      g.strokeRoundedRect(SLOT_X, y, SLOT_WIDTH, SLOT_HEIGHT, 8)
      g.fillStyle(0x1e3a5f, 0.25)
      g.fillRoundedRect(SLOT_X, y, SLOT_WIDTH, SLOT_HEIGHT, 8)

      this.add.text(SLOT_X + 14, y + SLOT_HEIGHT / 2, SLOT_LABELS[i], {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: '#D4A843',
      }).setOrigin(0, 0.5)

      const zone = this.add.zone(
        SLOT_X + SLOT_WIDTH / 2,
        y + SLOT_HEIGHT / 2,
        SLOT_WIDTH,
        SLOT_HEIGHT,
      )
      zone.setData('slotIndex', i)
      this.slotZones.push(zone)
    }
  }

  private drawCards() {
    const shuffled = [...this.questionData.differences]
    this.shuffleArray(shuffled)

    for (let i = 0; i < shuffled.length; i++) {
      const diff = shuffled[i]
      const y = CARD_START_Y + i * (CARD_HEIGHT + CARD_GAP)
      const cx = CARD_X + CARD_WIDTH / 2
      const cy = y + CARD_HEIGHT / 2

      const container = this.createCard(diff, cx, cy, CARD_WIDTH, CARD_HEIGHT)

      const body = this.matter.add.rectangle(cx, cy, CARD_WIDTH, CARD_HEIGHT, {
        isStatic: true,
        friction: 0.9,
        restitution: 0.05,
        label: diff.id,
      })

      const card: CardData = {
        diffEntry: diff,
        container,
        body,
        originalX: cx,
        originalY: cy,
        slotIndex: null,
      }
      this.cards.push(card)
      container.setData('cardData', card)
    }
  }

  private createCard(
    diff: DiffEntry,
    cx: number,
    cy: number,
    w: number,
    h: number,
  ): Phaser.GameObjects.Container {
    const container = this.add.container(cx, cy)
    const severityColor = SEVERITY_COLORS[diff.severity] || COLORS.slate
    const colorHex = '#' + severityColor.toString(16).padStart(6, '0')

    const bg = this.add.graphics()
    bg.fillStyle(0x0f1d36, 0.92)
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 8)
    bg.fillStyle(severityColor, 0.15)
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 8)
    bg.lineStyle(2, severityColor, 0.7)
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 8)
    bg.fillStyle(severityColor, 1)
    bg.fillRect(-w / 2, -h / 2, 5, h)

    const typeText = this.add.text(-w / 2 + 16, -h / 2 + 10, diff.type, {
      fontSize: '13px',
      fontFamily: 'Arial',
      color: colorHex,
      fontStyle: 'bold',
    })

    const amountText = this.add.text(-w / 2 + 16, -h / 2 + 30, `¥${diff.amount.toLocaleString()}`, {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#FFFFFF',
      fontStyle: 'bold',
    })

    const projectText = this.add.text(-w / 2 + 16, -h / 2 + 50, diff.project, {
      fontSize: '11px',
      fontFamily: 'Arial',
      color: '#94A3B8',
    })

    container.add([bg, typeText, amountText, projectText])
    container.setSize(w, h)
    container.setDepth(10)
    return container
  }

  private drawSubmitButton() {
    const btnX = GAME_WIDTH / 2
    const btnY = GAME_HEIGHT - 42
    const btnW = 200
    const btnH = 46

    const btnBg = this.add.graphics()
    btnBg.fillStyle(COLORS.amberGold, 1)
    btnBg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 8)

    this.add.text(btnX, btnY, '提交结果', {
      fontSize: '20px',
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
    const txt = this.add.text(50, GAME_HEIGHT - 42, '← 返回', {
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
      for (let i = this.cards.length - 1; i >= 0; i--) {
        const card = this.cards[i]
        const bounds = card.container.getBounds()
        if (bounds.contains(pointer.x, pointer.y)) {
          this.dragging = card
          this.dragTarget.x = pointer.x
          this.dragTarget.y = pointer.y
          card.container.setDepth(20)

          if (card.slotIndex !== null) {
            this.slotCards[card.slotIndex] = null
            card.slotIndex = null
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

      const slotIdx = this.getSlotAt(card.container.x, card.container.y)
      if (slotIdx !== null) {
        const existing = this.slotCards[slotIdx]
        if (existing && existing !== card) {
          this.returnCard(existing)
        }
        this.snapToSlot(card, slotIdx)
      } else {
        this.returnCard(card)
      }
    })
  }

  private getSlotAt(x: number, y: number): number | null {
    for (let i = 0; i < 5; i++) {
      const zone = this.slotZones[i]
      if (zone.getBounds().contains(x, y)) {
        return i
      }
    }
    return null
  }

  private snapToSlot(card: CardData, slotIndex: number) {
    const snapX = SLOT_X + SLOT_WIDTH / 2
    const snapY = SLOT_START_Y + slotIndex * (SLOT_HEIGHT + SLOT_GAP) + SLOT_HEIGHT / 2

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

    card.slotIndex = slotIndex
    this.slotCards[slotIndex] = card
  }

  private returnCard(card: CardData) {
    this.tweens.add({
      targets: card.container,
      x: card.originalX,
      y: card.originalY,
      duration: 200,
      ease: 'Back.easeOut',
      onUpdate: () => {
        Matter.Body.setPosition(card.body as unknown as Matter.Body, {
          x: card.container.x,
          y: card.container.y,
        })
      },
    })
    card.slotIndex = null
  }

  private startTimer() {
    this.elapsed = 0
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        this.elapsed++
        const m = Math.floor(this.elapsed / 60).toString().padStart(2, '0')
        const s = (this.elapsed % 60).toString().padStart(2, '0')
        this.timerText.setText(`${m}:${s}`)
      },
    })
  }

  private onSubmit() {
    if (this.submitted) return

    if (!this.slotCards.every((c) => c !== null)) {
      this.showWarning('请将所有卡片放入对应槽位')
      return
    }

    this.submitted = true
    this.timerEvent.remove()

    const playerOrder = this.slotCards.map((c) => c!.diffEntry.id)
    const correctOrder = this.questionData.correctOrder
    const total = correctOrder.length
    let correct = 0
    const mistakes: MistakeEntry[] = []

    for (let i = 0; i < total; i++) {
      if (playerOrder[i] === correctOrder[i]) {
        correct++
      } else {
        const placed = this.slotCards[i]!
        const correctId = correctOrder[i]
        const correctEntry = this.questionData.differences.find((d) => d.id === correctId)
        mistakes.push({
          description: `位置 ${i + 1}: 应为"${correctEntry?.type ?? correctId}", 实为"${placed.diffEntry.type}"`,
          reason: '排序错误',
        })
      }
    }

    const score = Math.round((correct / total) * this.maxScore)

    const record: TrainingRecord = {
      id: `record_${Date.now()}`,
      userId: 'player_1',
      questionId: this.questionId,
      questionType: 'reconcile_sort',
      score,
      maxScore: this.maxScore,
      timeSpent: this.elapsed,
      mistakes,
      completedAt: new Date().toISOString(),
    }

    useGameStore.getState().completeLevel(record)
    this.showResult(score, this.maxScore, correct, total, mistakes)
  }

  private showWarning(msg: string) {
    const t = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, msg, {
        fontSize: '18px',
        fontFamily: 'Arial',
        color: '#EF4444',
        backgroundColor: '#1e293b',
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setDepth(100)

    this.time.delayedCall(1500, () => t.destroy())
  }

  private showResult(
    score: number,
    maxScore: number,
    correct: number,
    total: number,
    mistakes: MistakeEntry[],
  ) {
    const overlay = this.add.graphics().setDepth(50)
    overlay.fillStyle(0x000000, 0.7)
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    const pw = 480
    const ph = 360
    const px = GAME_WIDTH / 2 - pw / 2
    const py = GAME_HEIGHT / 2 - ph / 2

    const panel = this.add.graphics().setDepth(60)
    panel.fillStyle(0x0f1d36, 1)
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
      .text(GAME_WIDTH / 2, py + 110, `正确位置: ${correct} / ${total}`, {
        fontSize: '18px',
        fontFamily: 'Arial',
        color: '#94A3B8',
      })
      .setOrigin(0.5, 0)
      .setDepth(61)

    if (mistakes.length > 0) {
      this.add
        .text(GAME_WIDTH / 2, py + 145, '错误详情:', {
          fontSize: '16px',
          fontFamily: 'Arial',
          color: '#EF4444',
          fontStyle: 'bold',
        })
        .setOrigin(0.5, 0)
        .setDepth(61)

      mistakes.slice(0, 3).forEach((m, i) => {
        this.add
          .text(GAME_WIDTH / 2, py + 170 + i * 22, m.description, {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#CBD5E1',
          })
          .setOrigin(0.5, 0)
          .setDepth(61)
      })
    }

    const btnW = 160
    const btnH = 44
    const btnY2 = py + ph - 55

    const btnBg = this.add.graphics().setDepth(61)
    btnBg.fillStyle(COLORS.amberGold, 1)
    btnBg.fillRoundedRect(GAME_WIDTH / 2 - btnW / 2, btnY2, btnW, btnH, 8)

    this.add
      .text(GAME_WIDTH / 2, btnY2 + btnH / 2, '返回菜单', {
        fontSize: '18px',
        fontFamily: 'Arial',
        color: '#1B2A4A',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(62)

    const hitBtn = this.add
      .rectangle(GAME_WIDTH / 2, btnY2 + btnH / 2, btnW, btnH, 0x000000, 0)
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
