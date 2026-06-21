import Phaser from 'phaser'
import { useGameStore } from '@/store/gameStore'
import { GAME_WIDTH, GAME_HEIGHT } from '@/game/config'

const COLORS = {
  deepIndigo: 0x1B2A4A,
  amberGold: 0xD4A843,
  amberGoldStr: '#D4A843',
  slate: 0x64748B,
  slateStr: '#64748B',
  emerald: 0x10B981,
  emeraldStr: '#10B981',
  coral: 0xEF4444,
  white: 0xFFFFFF,
  whiteStr: '#FFFFFF',
  overlay: 0x000000,
}

interface TutorialStep {
  title: string
  description: string
  highlight?: {
    xRatio?: number
    yRatio?: number
    wRatio?: number
    hRatio?: number
    xAbs?: number
    yAbs?: number
    wAbs?: number
    hAbs?: number
  }
  arrow?: {
    xRatio?: number
    yRatio?: number
    xAbs?: number
    yAbs?: number
    direction: 'up' | 'down' | 'left' | 'right'
  }
}

const TUTORIAL_STEPS_TEMPLATE: TutorialStep[] = [
  {
    title: '欢迎来到法律服务费用报价训练！',
    description: '本训练将帮助你掌握法律服务费用报价的核心技能。让我们从金额校验识别开始，这是最基础也是最重要的环节。',
  },
  {
    title: '什么是金额校验？',
    description: '在实际工作中，你需要对比「报价单」和「合同」的金额是否一致。不一致可能意味着计算错误、折扣遗漏、税率问题等，需要你识别并标注原因。',
  },
  {
    title: '认识界面：左侧报价单',
    description: '左侧面板是「报价单」，包含服务项目、单价、数量和金额。金额 = 单价 × 数量，你需要验证这个计算是否正确。',
    highlight: { xAbs: 24, yAbs: 72, wRatio: 0.4, hAbs: -232, xRatio: 0, yRatio: 0 },
    arrow: { xRatio: 0.22, yAbs: 70, direction: 'up' as const },
  },
  {
    title: '认识界面：右侧合同',
    description: '右侧面板是「合同金额」，只包含服务项目和最终金额。你需要将它与左侧报价单逐行对比。',
    highlight: { xRatio: 0.4, yAbs: 72, wRatio: 0.4, hAbs: -232, xAbs: 12, yRatio: 0 },
    arrow: { xRatio: 0.62, yAbs: 70, direction: 'up' as const },
  },
  {
    title: '如何操作：标记不一致',
    description: '当你发现某一行金额不一致时，点击该行将其选中。选中后行背景会变蓝。',
  },
  {
    title: '如何操作：选择原因',
    description: '选中不一致的行后，点击下方的原因卡片（如「计算错误」「折扣遗漏」等），系统会自动标记这一行为不一致并关联原因。',
    highlight: { xAbs: 24, yRatio: 1, wRatio: 1, hAbs: 80, xRatio: 0, yAbs: -140 },
    arrow: { xRatio: 0.5, yRatio: 1, xAbs: 0, yAbs: -60, direction: 'down' as const },
  },
  {
    title: '如何操作：提交结果',
    description: '完成所有检查后，点击右下角的「提交结果」按钮，系统会自动评分并告诉你哪些判断正确、哪些有误。',
    highlight: { xRatio: 1, yRatio: 1, wAbs: 164, hAbs: 64, xAbs: -188, yAbs: -86 },
    arrow: { xRatio: 1, yRatio: 1, xAbs: -106, yAbs: -94, direction: 'right' as const },
  },
  {
    title: '准备好开始了吗？',
    description: '记住：仔细对比每一行，计算金额是否正确，选择合适的原因。得分越高，说明你的报价判断能力越强！',
  },
]

interface TutorialStepResolved {
  title: string
  description: string
  highlight?: { x: number; y: number; w: number; h: number }
  arrow?: { x: number; y: number; direction: 'up' | 'down' | 'left' | 'right' }
}

export class TutorialScene extends Phaser.Scene {
  private currentStep = 0
  private titleText!: Phaser.GameObjects.Text
  private descText!: Phaser.GameObjects.Text
  private overlayGraphics!: Phaser.GameObjects.Graphics
  private highlightGraphics!: Phaser.GameObjects.Graphics
  private prevBtn!: Phaser.GameObjects.Rectangle
  private nextBtn!: Phaser.GameObjects.Rectangle
  private skipBtn!: Phaser.GameObjects.Rectangle
  private prevText!: Phaser.GameObjects.Text
  private nextText!: Phaser.GameObjects.Text
  private skipText!: Phaser.GameObjects.Text
  private stepIndicator!: Phaser.GameObjects.Text
  private arrowGraphics!: Phaser.GameObjects.Graphics
  private tutorialSteps: TutorialStepResolved[] = []

  constructor() {
    super({ key: 'TutorialScene' })
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.deepIndigo)

    this.tutorialSteps = TUTORIAL_STEPS_TEMPLATE.map((step) => {
      const resolved: TutorialStepResolved = {
        title: step.title,
        description: step.description,
      }
      if (step.highlight) {
        const h = step.highlight
        resolved.highlight = {
          x: (h.xRatio ?? 0) * GAME_WIDTH + (h.xAbs ?? 0),
          y: (h.yRatio ?? 0) * GAME_HEIGHT + (h.yAbs ?? 0),
          w: (h.wRatio ?? 0) * GAME_WIDTH + (h.wAbs ?? 0),
          h: (h.hRatio ?? 0) * GAME_HEIGHT + (h.hAbs ?? 0),
        }
      }
      if (step.arrow) {
        const a = step.arrow
        resolved.arrow = {
          x: (a.xRatio ?? 0) * GAME_WIDTH + (a.xAbs ?? 0),
          y: (a.yRatio ?? 0) * GAME_HEIGHT + (a.yAbs ?? 0),
          direction: a.direction,
        }
      }
      return resolved
    })

    this.drawBackgroundGrid()
    this.createOverlay()
    this.createHighlight()
    this.createArrow()
    this.createDialogBox()
    this.createNavigationButtons()
    this.createSkipButton()
    this.createStepIndicator()
    this.renderStep()
  }

  private drawBackgroundGrid() {
    const g = this.add.graphics()
    g.lineStyle(1, COLORS.white, 0.03)
    for (let x = 0; x < GAME_WIDTH; x += 40) {
      g.lineBetween(x, 0, x, GAME_HEIGHT)
    }
    for (let y = 0; y < GAME_HEIGHT; y += 40) {
      g.lineBetween(0, y, GAME_WIDTH, y)
    }
  }

  private createOverlay() {
    this.overlayGraphics = this.add.graphics().setDepth(10)
  }

  private createHighlight() {
    this.highlightGraphics = this.add.graphics().setDepth(12)
  }

  private createArrow() {
    this.arrowGraphics = this.add.graphics().setDepth(13)
  }

  private createDialogBox() {
    const boxX = 120
    const boxY = GAME_HEIGHT - 200
    const boxW = GAME_WIDTH - 240
    const boxH = 160

    const shadow = this.add.graphics()
    shadow.fillStyle(0x000000, 0.25)
    shadow.fillRoundedRect(boxX + 4, boxY + 4, boxW, boxH, 12)

    const bg = this.add.graphics().setDepth(20)
    bg.fillStyle(0x0F1D36, 1)
    bg.fillRoundedRect(boxX, boxY, boxW, boxH, 12)
    bg.lineStyle(2, COLORS.amberGold, 0.6)
    bg.strokeRoundedRect(boxX, boxY, boxW, boxH, 12)

    this.titleText = this.add.text(boxX + 28, boxY + 24, '', {
      fontSize: '22px',
      fontFamily: 'Arial',
      color: COLORS.amberGoldStr,
      fontStyle: 'bold',
    }).setDepth(21)

    this.descText = this.add.text(boxX + 28, boxY + 64, '', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: COLORS.whiteStr,
      lineSpacing: 6,
      wordWrap: { width: boxW - 56 },
    }).setDepth(21)
  }

  private createNavigationButtons() {
    const btnY = GAME_HEIGHT - 200 + 160 - 38
    const prevX = 148
    const nextX = GAME_WIDTH - 288

    this.prevBtn = this.add.rectangle(prevX, btnY, 100, 40, COLORS.slate, 0.6)
      .setDepth(22)
      .setStrokeStyle(1, COLORS.slate, 0.8)
      .setInteractive({ useHandCursor: true })

    this.prevText = this.add.text(prevX, btnY, '上一步', {
      fontSize: '15px',
      fontFamily: 'Arial',
      color: COLORS.whiteStr,
    }).setOrigin(0.5).setDepth(23)

    this.prevBtn.on('pointerover', () => {
      if (this.currentStep > 0) this.prevBtn.setFillStyle(COLORS.slate, 0.8)
    })
    this.prevBtn.on('pointerout', () => {
      this.prevBtn.setFillStyle(this.currentStep > 0 ? COLORS.slate : COLORS.slate, 0.3)
    })
    this.prevBtn.on('pointerdown', () => {
      if (this.currentStep > 0) {
        this.currentStep--
        this.renderStep()
      }
    })

    this.nextBtn = this.add.rectangle(nextX, btnY, 100, 40, COLORS.amberGold, 1)
      .setDepth(22)
      .setInteractive({ useHandCursor: true })

    this.nextText = this.add.text(nextX, btnY, '下一步', {
      fontSize: '15px',
      fontFamily: 'Arial',
      color: '#1B2A4A',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(23)

    this.nextBtn.on('pointerover', () => this.nextBtn.setFillStyle(0xC49A3A, 1))
    this.nextBtn.on('pointerout', () => this.nextBtn.setFillStyle(COLORS.amberGold, 1))
    this.nextBtn.on('pointerdown', () => {
      if (this.currentStep < this.tutorialSteps.length - 1) {
        this.currentStep++
        this.renderStep()
      } else {
        this.finishTutorial()
      }
    })
  }

  private createSkipButton() {
    const btnX = GAME_WIDTH - 80
    const btnY = 40

    this.skipBtn = this.add.rectangle(btnX, btnY, 100, 36, COLORS.slate, 0.4)
      .setDepth(22)
      .setInteractive({ useHandCursor: true })

    this.skipText = this.add.text(btnX, btnY, '跳过引导', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: COLORS.slateStr,
    }).setOrigin(0.5).setDepth(23)

    this.skipBtn.on('pointerover', () => {
      this.skipBtn.setFillStyle(COLORS.slate, 0.6)
      this.skipText.setColor(COLORS.whiteStr)
    })
    this.skipBtn.on('pointerout', () => {
      this.skipBtn.setFillStyle(COLORS.slate, 0.4)
      this.skipText.setColor(COLORS.slateStr)
    })
    this.skipBtn.on('pointerdown', () => this.finishTutorial())
  }

  private createStepIndicator() {
    this.stepIndicator = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 216, '', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: COLORS.slateStr,
    }).setOrigin(0.5).setDepth(21)
  }

  private renderStep() {
    const step = this.tutorialSteps[this.currentStep]

    this.titleText.setText(step.title)
    this.descText.setText(step.description)
    this.stepIndicator.setText(`第 ${this.currentStep + 1} / ${this.tutorialSteps.length} 步`)

    this.overlayGraphics.clear()
    this.highlightGraphics.clear()
    this.arrowGraphics.clear()

    if (step.highlight) {
      const h = step.highlight
      this.overlayGraphics.fillStyle(COLORS.overlay, 0.7)
      this.overlayGraphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
      this.overlayGraphics.setDepth(10)

      this.highlightGraphics.fillStyle(0x000000, 0)
      this.highlightGraphics.fillRect(h.x, h.y, h.w, h.h)
      this.highlightGraphics.lineStyle(3, COLORS.amberGold, 1)
      this.highlightGraphics.strokeRoundedRect(h.x, h.y, h.w, h.h, 8)
      this.highlightGraphics.fillStyle(COLORS.amberGold, 0.08)
      this.highlightGraphics.fillRoundedRect(h.x, h.y, h.w, h.h, 8)
    } else {
      this.overlayGraphics.fillStyle(COLORS.overlay, 0.35)
      this.overlayGraphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
    }

    if (step.arrow) {
      this.drawArrow(step.arrow.x, step.arrow.y, step.arrow.direction)
    }

    if (this.currentStep === 0) {
      this.prevBtn.setFillStyle(COLORS.slate, 0.3)
      this.prevText.setAlpha(0.5)
    } else {
      this.prevBtn.setFillStyle(COLORS.slate, 0.6)
      this.prevText.setAlpha(1)
    }

    if (this.currentStep === this.tutorialSteps.length - 1) {
      this.nextText.setText('开始训练')
    } else {
      this.nextText.setText('下一步')
    }
  }

  private drawArrow(x: number, y: number, direction: 'up' | 'down' | 'left' | 'right') {
    this.arrowGraphics.lineStyle(3, COLORS.amberGold, 1)
    this.arrowGraphics.fillStyle(COLORS.amberGold, 1)

    const size = 14
    let points: Phaser.Geom.Point[] = []

    switch (direction) {
      case 'up':
        points = [
          new Phaser.Geom.Point(x, y - size),
          new Phaser.Geom.Point(x - size * 0.7, y + size * 0.3),
          new Phaser.Geom.Point(x + size * 0.7, y + size * 0.3),
        ]
        break
      case 'down':
        points = [
          new Phaser.Geom.Point(x, y + size),
          new Phaser.Geom.Point(x - size * 0.7, y - size * 0.3),
          new Phaser.Geom.Point(x + size * 0.7, y - size * 0.3),
        ]
        break
      case 'left':
        points = [
          new Phaser.Geom.Point(x - size, y),
          new Phaser.Geom.Point(x + size * 0.3, y - size * 0.7),
          new Phaser.Geom.Point(x + size * 0.3, y + size * 0.7),
        ]
        break
      case 'right':
        points = [
          new Phaser.Geom.Point(x + size, y),
          new Phaser.Geom.Point(x - size * 0.3, y - size * 0.7),
          new Phaser.Geom.Point(x - size * 0.3, y + size * 0.7),
        ]
        break
    }

    this.arrowGraphics.fillPoints(points, true)
  }

  private finishTutorial() {
    useGameStore.getState().completeTutorial()
    this.scene.start('AmountVerifyScene')
  }
}
