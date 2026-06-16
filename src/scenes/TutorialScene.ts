import Phaser from 'phaser'
import { GAME_CONFIG, COLORS } from '../game/constants'
import { TUTORIAL_STEPS } from '../config/tutorial'
import { StorageManager } from '../managers/StorageManager'
import { GameStateManager } from '../managers/GameStateManager'

export class TutorialScene extends Phaser.Scene {
  private currentStep: number = 0
  private stepText!: Phaser.GameObjects.Text
  private titleText!: Phaser.GameObjects.Text
  private highlightBox!: Phaser.GameObjects.Rectangle
  private nextButton!: Phaser.GameObjects.Rectangle
  private prevButton!: Phaser.GameObjects.Rectangle
  private maskGraphics!: Phaser.GameObjects.Graphics
  private counterText!: Phaser.GameObjects.Text
  private nextBtnLabel!: Phaser.GameObjects.Text

  constructor() {
    super('TutorialScene')
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.BACKGROUND)

    this.add.text(80, 40, '新手教程', {
      font: 'bold 32px Arial',
      color: '#ffffff'
    })

    this.counterText = this.add.text(GAME_CONFIG.WIDTH - 80, 40, `${this.currentStep + 1} / ${TUTORIAL_STEPS.length}`, {
      font: '20px Arial',
      color: '#a0a0a0'
    }).setOrigin(1, 0)

    this.maskGraphics = this.add.graphics()

    const panelY = GAME_CONFIG.HEIGHT - 200
    this.add.rectangle(GAME_CONFIG.WIDTH / 2, panelY, GAME_CONFIG.WIDTH - 80, 160, COLORS.SURFACE, 0.95)
      .setStrokeStyle(2, COLORS.PRIMARY)

    this.titleText = this.add.text(80, panelY - 60, '', {
      font: 'bold 24px Arial',
      color: '#4a90d9'
    })

    this.stepText = this.add.text(80, panelY - 20, '', {
      font: '18px Arial',
      color: '#ffffff',
      wordWrap: { width: GAME_CONFIG.WIDTH - 240 }
    })

    this.prevButton = this.add.rectangle(GAME_CONFIG.WIDTH - 180, panelY + 40, 100, 40, COLORS.SURFACE_LIGHT)
      .setStrokeStyle(2, COLORS.TEXT_SECONDARY)
      .setInteractive({ useHandCursor: true })
    this.add.text(GAME_CONFIG.WIDTH - 180, panelY + 40, '上一步', {
      font: 'bold 16px Arial',
      color: '#a0a0a0'
    }).setOrigin(0.5)

    this.nextButton = this.add.rectangle(GAME_CONFIG.WIDTH - 60, panelY + 40, 100, 40, COLORS.PRIMARY)
      .setInteractive({ useHandCursor: true })
    this.nextBtnLabel = this.add.text(GAME_CONFIG.WIDTH - 60, panelY + 40, '下一步', {
      font: 'bold 16px Arial',
      color: '#ffffff'
    }).setOrigin(0.5)

    this.highlightBox = this.add.rectangle(0, 0, 0, 0)
      .setStrokeStyle(4, COLORS.WARNING)
      .setFillStyle(COLORS.WARNING, 0.1)
      .setVisible(false)

    this.prevButton.on('pointerdown', () => this.prevStep())
    this.nextButton.on('pointerdown', () => this.nextStep())

    this.prevButton.on('pointerover', () => {
      if (this.currentStep > 0) {
        this.prevButton.setFillStyle(COLORS.SURFACE)
      }
    })
    this.prevButton.on('pointerout', () => {
      this.prevButton.setFillStyle(COLORS.SURFACE_LIGHT)
    })

    this.nextButton.on('pointerover', () => {
      this.nextButton.setFillStyle(Phaser.Display.Color.IntegerToColor(COLORS.PRIMARY).lighten(20).color)
    })
    this.nextButton.on('pointerout', () => {
      this.nextButton.setFillStyle(COLORS.PRIMARY)
    })

    this.updateStep()
  }

  private updateStep(): void {
    const step = TUTORIAL_STEPS[this.currentStep]
    
    this.titleText.setText(step.title)
    this.stepText.setText(step.description)
    
    this.counterText.setText(`${this.currentStep + 1} / ${TUTORIAL_STEPS.length}`)

    if (step.highlightArea) {
      this.highlightBox.setVisible(true)
      this.highlightBox.setPosition(step.highlightArea.x, step.highlightArea.y)
      this.highlightBox.setSize(step.highlightArea.width, step.highlightArea.height)
      this.drawMask(step.highlightArea)
    } else {
      this.highlightBox.setVisible(false)
      this.maskGraphics.clear()
    }

    this.prevButton.setFillStyle(this.currentStep === 0 ? COLORS.SURFACE_LIGHT : COLORS.SURFACE)
    
    const isLast = this.currentStep === TUTORIAL_STEPS.length - 1
    this.nextButton.setFillStyle(isLast ? COLORS.SUCCESS : COLORS.PRIMARY)
    this.nextBtnLabel.setText(isLast ? '开始游戏' : '下一步')
  }

  private drawMask(highlight: { x: number; y: number; width: number; height: number }): void {
    this.maskGraphics.clear()
    this.maskGraphics.fillStyle(0x000000, 0.6)
    this.maskGraphics.fillRect(0, 0, GAME_CONFIG.WIDTH, highlight.y - highlight.height / 2)
    this.maskGraphics.fillRect(0, highlight.y + highlight.height / 2, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT - highlight.y - highlight.height / 2)
    this.maskGraphics.fillRect(0, highlight.y - highlight.height / 2, highlight.x - highlight.width / 2, highlight.height)
    this.maskGraphics.fillRect(highlight.x + highlight.width / 2, highlight.y - highlight.height / 2, GAME_CONFIG.WIDTH - highlight.x - highlight.width / 2, highlight.height)
  }

  private nextStep(): void {
    if (this.currentStep < TUTORIAL_STEPS.length - 1) {
      this.currentStep++
      this.updateStep()
    } else {
      this.completeTutorial()
    }
  }

  private prevStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--
      this.updateStep()
    }
  }

  private completeTutorial(): void {
    StorageManager.getInstance().setTutorialCompleted(true)
    const stateManager = (window as any).__gameStateManager || GameStateManager.getInstance()
    stateManager.getState().tutorialCompleted = true
    this.scene.start('GameScene')
  }
}
