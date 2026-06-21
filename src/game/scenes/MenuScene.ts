import Phaser from 'phaser'
import { QuestionType, LEVEL_LABELS, LEVEL_ORDER } from '@/types'
import { useGameStore } from '@/store/gameStore'
import { GAME_WIDTH, GAME_HEIGHT } from '@/game/config'

const COLORS = {
  background: 0x1b2a4a,
  accent: 0xd4a843,
  accentStr: '#D4A843',
  secondary: 0x64748b,
  secondaryStr: '#64748B',
  success: 0x10b981,
  successStr: '#10B981',
  error: 0xef4444,
  errorStr: '#EF4444',
  nodeFill: 0x243656,
  nodeStroke: 0xd4a843,
  lockedFill: 0x1e2d4d,
  lockedStroke: 0x64748b,
  white: '#FFFFFF',
  whiteNum: 0xffffff,
}

const LEVEL_ICONS: Record<QuestionType, string> = {
  amount_verify: '⚖',
  payment_flow: '💳',
  reconcile_sort: '📊',
  contract_attach: '📎',
}

const LEVEL_SCENES: Record<QuestionType, string> = {
  amount_verify: 'AmountVerifyScene',
  payment_flow: 'PaymentFlowScene',
  reconcile_sort: 'ReconcileSortScene',
  contract_attach: 'ContractAttachScene',
}

const NODE_RADIUS = 52
const PARTICLE_COUNT = 30

interface LevelNode {
  container: Phaser.GameObjects.Container
  circle: Phaser.GameObjects.Arc
  icon: Phaser.GameObjects.Text
  label: Phaser.GameObjects.Text
  stars: Phaser.GameObjects.Text
  glow: Phaser.GameObjects.Arc
  type: QuestionType
  unlocked: boolean
}

export class MenuScene extends Phaser.Scene {
  private nodes: LevelNode[] = []
  private toastText: Phaser.GameObjects.Text | null = null
  private toastBg: Phaser.GameObjects.Rectangle | null = null
  private particles: { x: number; y: number; vx: number; vy: number; obj: Phaser.GameObjects.Arc }[] = []
  private nodePositions: { x: number; y: number }[] = []
  private NODE_Y = 0
  private PATH_START_X = 180
  private PATH_END_X = 0

  constructor() {
    super({ key: 'MenuScene' })
  }

  create() {
    const store = useGameStore.getState()
    this.cameras.main.setBackgroundColor(COLORS.background)

    this.NODE_Y = GAME_HEIGHT / 2 + 10
    this.PATH_END_X = GAME_WIDTH - 180

    this.createParticles()
    this.createTitle()
    this.createProgressBar(store.progress.completedLevels.length, LEVEL_ORDER.length)
    this.createPathLine()
    this.createLevelNodes(store)
    this.createBottomButtons()
    this.createToast()

    if (!store.progress.tutorialDone) {
      this.createTutorialButton()
    }
  }

  update() {
    this.updateParticles()
  }

  private createParticles() {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH)
      const y = Phaser.Math.Between(0, GAME_HEIGHT)
      const dot = this.add.circle(x, y, Phaser.Math.Between(1, 3), COLORS.accent, Phaser.Math.FloatBetween(0.1, 0.3))
      dot.setDepth(0)
      this.particles.push({
        x,
        y,
        vx: Phaser.Math.FloatBetween(-0.3, 0.3),
        vy: Phaser.Math.FloatBetween(-0.5, -0.1),
        obj: dot,
      })
    }
  }

  private updateParticles() {
    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy
      if (p.y < -10) {
        p.y = GAME_HEIGHT + 10
        p.x = Phaser.Math.Between(0, GAME_WIDTH)
      }
      if (p.x < -10) p.x = GAME_WIDTH + 10
      if (p.x > GAME_WIDTH + 10) p.x = -10
      p.obj.setPosition(p.x, p.y)
    }
  }

  private createTitle() {
    this.add.text(GAME_WIDTH / 2, 50, '法律服务费用报价经营模拟', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '32px',
      fontStyle: 'bold',
      color: COLORS.accentStr,
    }).setOrigin(0.5).setDepth(10)
  }

  private createProgressBar(completed: number, total: number) {
    const barWidth = 320
    const barHeight = 14
    const barX = (GAME_WIDTH - barWidth) / 2
    const barY = 90
    const pct = total > 0 ? completed / total : 0

    this.add.rectangle(barX, barY, barWidth, barHeight, COLORS.secondary, 0.4).setOrigin(0).setDepth(10)

    if (pct > 0) {
      this.add.rectangle(barX, barY, barWidth * pct, barHeight, COLORS.success, 0.9).setOrigin(0).setDepth(10)
    }

    this.add.rectangle(barX, barY, barWidth, barHeight, COLORS.accent, 0.6).setOrigin(0).setDepth(10).setStrokeStyle(1, COLORS.accent, 0.4)

    this.add.text(GAME_WIDTH / 2, barY + barHeight + 16, `总进度 ${Math.round(pct * 100)}%`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: COLORS.secondaryStr,
    }).setOrigin(0.5).setDepth(10)
  }

  private createPathLine() {
    const step = (this.PATH_END_X - this.PATH_START_X) / (LEVEL_ORDER.length - 1)
    const graphics = this.add.graphics().setDepth(1)

    for (let i = 0; i < LEVEL_ORDER.length - 1; i++) {
      const x1 = this.PATH_START_X + step * i
      const x2 = this.PATH_START_X + step * (i + 1)
      graphics.lineStyle(3, COLORS.accent, 0.35)
      graphics.beginPath()
      graphics.moveTo(x1, this.NODE_Y)
      graphics.lineTo(x2, this.NODE_Y)
      graphics.strokePath()
    }

    for (let i = 0; i < LEVEL_ORDER.length; i++) {
      const cx = this.PATH_START_X + step * i
      this.nodePositions.push({ x: cx, y: this.NODE_Y })
      graphics.fillStyle(COLORS.accent, 0.2)
      graphics.fillCircle(cx, this.NODE_Y, NODE_RADIUS + 16)
    }
  }

  private createLevelNodes(store: ReturnType<typeof useGameStore.getState>) {
    const step = (this.PATH_END_X - this.PATH_START_X) / (LEVEL_ORDER.length - 1)

    for (let i = 0; i < LEVEL_ORDER.length; i++) {
      const type = LEVEL_ORDER[i]
      const cx = this.PATH_START_X + step * i
      const unlocked = store.isLevelUnlocked(type)
      const starCount = store.progress.stars[type] || 0

      const container = this.add.container(cx, this.NODE_Y).setDepth(5)

      const glow = this.add.circle(0, 0, NODE_RADIUS + 8, COLORS.accent, 0)
      container.add(glow)

      const fillColor = unlocked ? COLORS.nodeFill : COLORS.lockedFill
      const strokeColor = unlocked ? COLORS.nodeStroke : COLORS.lockedStroke
      const circle = this.add.circle(0, 0, NODE_RADIUS, fillColor, 1)
      circle.setStrokeStyle(3, strokeColor)
      container.add(circle)

      const icon = this.add.text(0, -10, LEVEL_ICONS[type], {
        fontFamily: 'Arial, sans-serif',
        fontSize: '30px',
      }).setOrigin(0.5)
      icon.setAlpha(unlocked ? 1 : 0.35)
      container.add(icon)

      const label = this.add.text(0, 22, LEVEL_LABELS[type], {
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        color: unlocked ? COLORS.white : COLORS.secondaryStr,
      }).setOrigin(0.5)
      container.add(label)

      const starStr = this.buildStarText(starCount, unlocked)
      const stars = this.add.text(0, 44, starStr, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
      }).setOrigin(0.5)
      container.add(stars)

      if (!unlocked) {
        const lock = this.add.text(0, -10, '🔒', {
          fontFamily: 'Arial, sans-serif',
          fontSize: '18px',
        }).setOrigin(0.5)
        container.add(lock)
        icon.setAlpha(0.2)
      }

      container.setSize(NODE_RADIUS * 2, NODE_RADIUS * 2)
      container.setInteractive(
        new Phaser.Geom.Circle(0, 0, NODE_RADIUS),
        Phaser.Geom.Circle.Contains,
      )

      container.on('pointerover', () => {
        if (!unlocked) return
        this.tweens.add({
          targets: container,
          scaleX: 1.12,
          scaleY: 1.12,
          duration: 150,
          ease: 'Power1',
        })
        this.tweens.add({
          targets: glow,
          alpha: 0.35,
          duration: 150,
        })
      })

      container.on('pointerout', () => {
        this.tweens.add({
          targets: container,
          scaleX: 1,
          scaleY: 1,
          duration: 150,
          ease: 'Power1',
        })
        this.tweens.add({
          targets: glow,
          alpha: 0,
          duration: 200,
        })
      })

      container.on('pointerdown', () => {
        if (unlocked) {
          this.scene.start(LEVEL_SCENES[type], { questionType: type })
        } else {
          this.showToast('请先完成前一关卡')
        }
      })

      this.nodes.push({ container, circle, icon, label, stars, glow, type, unlocked })
    }
  }

  private buildStarText(count: number, unlocked: boolean): string {
    if (!unlocked) return '☆☆☆'
    return '★'.repeat(count) + '☆'.repeat(3 - count)
  }

  private createBottomButtons() {
    const btnY = GAME_HEIGHT - 70
    const btnConfigs = [
      { label: '配置管理', x: GAME_WIDTH / 2 - 100 },
      { label: '训练记录', x: GAME_WIDTH / 2 + 100 },
    ]

    for (const cfg of btnConfigs) {
      const bg = this.add.rectangle(cfg.x, btnY, 160, 44, COLORS.nodeFill, 1)
        .setStrokeStyle(2, COLORS.accent, 0.6)
        .setDepth(10)
        .setInteractive({ useHandCursor: true })

      const txt = this.add.text(cfg.x, btnY, cfg.label, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: COLORS.accentStr,
      }).setOrigin(0.5).setDepth(11)

      bg.on('pointerover', () => {
        bg.setFillStyle(COLORS.accent, 0.15)
        this.tweens.add({ targets: [bg, txt], scaleX: 1.05, scaleY: 1.05, duration: 100 })
      })
      bg.on('pointerout', () => {
        bg.setFillStyle(COLORS.nodeFill, 1)
        this.tweens.add({ targets: [bg, txt], scaleX: 1, scaleY: 1, duration: 100 })
      })
      bg.on('pointerdown', () => {
        if (cfg.label === '配置管理') {
          window.location.href = '/config'
        } else if (cfg.label === '训练记录') {
          window.location.href = '/records'
        }
      })
    }
  }

  private createTutorialButton() {
    const btnX = GAME_WIDTH - 110
    const btnY = 50

    const bg = this.add.rectangle(btnX, btnY, 130, 38, COLORS.success, 0.2)
      .setStrokeStyle(2, COLORS.success, 0.7)
      .setDepth(10)
      .setInteractive({ useHandCursor: true })

    const txt = this.add.text(btnX, btnY, '新手引导', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      color: COLORS.successStr,
    }).setOrigin(0.5).setDepth(11)

    this.tweens.add({
      targets: [bg, txt],
      alpha: { from: 0.7, to: 1 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    })

    bg.on('pointerover', () => {
      bg.setFillStyle(COLORS.success, 0.35)
    })
    bg.on('pointerout', () => {
      bg.setFillStyle(COLORS.success, 0.2)
    })
    bg.on('pointerdown', () => {
      this.scene.start('TutorialScene')
    })
  }

  private createToast() {
    const toastW = 300
    const toastH = 44
    this.toastBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 140, toastW, toastH, 0x0f172a, 0.92)
      .setStrokeStyle(1, COLORS.accent, 0.5)
      .setDepth(100)
      .setVisible(false)

    this.toastText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 140, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      color: COLORS.white,
    }).setOrigin(0.5).setDepth(101).setVisible(false)
  }

  private showToast(msg: string) {
    if (!this.toastBg || !this.toastText) return

    this.toastBg.setVisible(true)
    this.toastText.setVisible(true).setText(msg)

    this.tweens.killTweensOf([this.toastBg, this.toastText])

    this.toastBg.setAlpha(0)
    this.toastText.setAlpha(0)
    this.tweens.add({
      targets: [this.toastBg, this.toastText],
      alpha: 1,
      duration: 200,
    })

    this.time.delayedCall(1800, () => {
      this.tweens.add({
        targets: [this.toastBg!, this.toastText!],
        alpha: 0,
        duration: 400,
        onComplete: () => {
          this.toastBg?.setVisible(false)
          this.toastText?.setVisible(false)
        },
      })
    })
  }
}
