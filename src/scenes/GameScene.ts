import Phaser from 'phaser'
import Matter from 'matter-js'
import { GAME_CONFIG, COLORS } from '../game/constants'
import { GameStateManager } from '../managers/GameStateManager'
import { StorageManager } from '../managers/StorageManager'
import { TREATMENTS } from '../config/treatments'
import { LEVELS } from '../config/levels'
import type { Task, TrainingRecord, LeaderboardEntry } from '../game/types'

export class GameScene extends Phaser.Scene {
  private stateManager!: GameStateManager
  private storageManager!: StorageManager
  private selectedTask: Task | null = null
  private uiElements: Map<string, Phaser.GameObjects.GameObject> = new Map()
  private matterEngine!: Matter.Engine

  constructor() {
    super('GameScene')
  }

  init(): void {
    this.stateManager = GameStateManager.getInstance()
    this.storageManager = StorageManager.getInstance()
    ;(window as any).__gameStateManager = this.stateManager
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.BACKGROUND)

    this.initMatterPhysics()
    this.createHeader()
    this.createTaskList()
    this.createCalendar()
    this.createInstrumentPanel()
    this.createBottomBar()

    if (this.stateManager.getCurrentDayTasks().length === 0) {
      this.stateManager.generateTasks()
    }

    this.refreshUI()
  }

  private initMatterPhysics(): void {
    this.matterEngine = Matter.Engine.create()
    this.matterEngine.gravity.y = 0
    Matter.Engine.update(this.matterEngine, 1000 / 60)
  }

  update(_time: number, delta: number): void {
    Matter.Engine.update(this.matterEngine, delta)
  }

  private createHeader(): void {
    this.add.rectangle(GAME_CONFIG.WIDTH / 2, 30, GAME_CONFIG.WIDTH, 60, COLORS.SURFACE)

    const state = this.stateManager.getState()
    const levelConfig = this.stateManager.getCurrentLevelConfig()

    this.add.text(30, 30, `第 ${state.currentDay} 天`, {
      font: 'bold 20px Arial', color: '#ffffff'
    }).setOrigin(0, 0.5)

    this.add.text(150, 30, `关卡 ${state.currentLevel}: ${levelConfig.name}`, {
      font: 'bold 18px Arial', color: '#4a90d9'
    }).setOrigin(0, 0.5)

    this.add.text(GAME_CONFIG.WIDTH - 350, 30, '💰', { font: '20px Arial' }).setOrigin(0, 0.5)
    const moneyText = this.add.text(GAME_CONFIG.WIDTH - 320, 30, `${state.money}`, {
      font: 'bold 20px Arial', color: '#ffd700'
    }).setOrigin(0, 0.5)
    this.uiElements.set('money', moneyText)

    this.add.text(GAME_CONFIG.WIDTH - 200, 30, '⭐', { font: '20px Arial' }).setOrigin(0, 0.5)
    const repText = this.add.text(GAME_CONFIG.WIDTH - 170, 30, `${state.reputation}`, {
      font: 'bold 20px Arial', color: '#50c878'
    }).setOrigin(0, 0.5)
    this.uiElements.set('reputation', repText)

    const scoreText = this.add.text(GAME_CONFIG.WIDTH / 2 + 100, 30, `得分: ${this.stateManager.getSessionScore()}`, {
      font: 'bold 18px Arial', color: '#ffffff'
    }).setOrigin(0.5)
    this.uiElements.set('score', scoreText)

    const menuBtn = this.add.rectangle(GAME_CONFIG.WIDTH - 50, 30, 80, 40, COLORS.SURFACE_LIGHT)
      .setInteractive({ useHandCursor: true })
    this.add.text(GAME_CONFIG.WIDTH - 50, 30, '菜单', {
      font: 'bold 16px Arial', color: '#ffffff'
    }).setOrigin(0.5)

    menuBtn.on('pointerdown', () => this.showPauseMenu())
    menuBtn.on('pointerover', () => menuBtn.setFillStyle(COLORS.PRIMARY))
    menuBtn.on('pointerout', () => menuBtn.setFillStyle(COLORS.SURFACE_LIGHT))
  }

  private createTaskList(): void {
    this.add.rectangle(310, 380, 580, 620, COLORS.SURFACE, 0.8)
      .setStrokeStyle(2, COLORS.SURFACE_LIGHT)

    this.add.text(40, 80, '📋 今日任务', {
      font: 'bold 22px Arial', color: '#ffffff'
    })

    const taskContainer = this.add.container(40, 120)
    this.uiElements.set('taskContainer', taskContainer)
  }

  private createCalendar(): void {
    this.add.rectangle(GAME_CONFIG.WIDTH / 2 + 30, 380, 620, 580, COLORS.SURFACE, 0.8)
      .setStrokeStyle(2, COLORS.SURFACE_LIGHT)
      .setName('calendarBg')

    this.add.text(680, 80, '📅 治疗日历', {
      font: 'bold 22px Arial', color: '#ffffff'
    })

    const dayLabel = this.add.text(680, 120, '', {
      font: 'bold 18px Arial', color: '#4a90d9'
    })
    this.uiElements.set('dayLabel', dayLabel)

    const calendarContainer = this.add.container(660, 160)
    this.uiElements.set('calendarContainer', calendarContainer)
  }

  private createInstrumentPanel(): void {
    this.add.rectangle(990, 540, 580, 180, COLORS.SURFACE, 0.8)
      .setStrokeStyle(2, COLORS.SURFACE_LIGHT)

    this.add.text(680, 470, '🔧 器械状态', {
      font: 'bold 22px Arial', color: '#ffffff'
    })

    const instrumentContainer = this.add.container(680, 510)
    this.uiElements.set('instrumentContainer', instrumentContainer)
  }

  private createBottomBar(): void {
    this.add.rectangle(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT - 30, GAME_CONFIG.WIDTH, 60, COLORS.SURFACE)

    const nextDayBtn = this.add.rectangle(GAME_CONFIG.WIDTH - 150, GAME_CONFIG.HEIGHT - 30, 140, 40, COLORS.SECONDARY)
      .setInteractive({ useHandCursor: true })
    this.add.text(GAME_CONFIG.WIDTH - 150, GAME_CONFIG.HEIGHT - 30, '进入下一天', {
      font: 'bold 16px Arial', color: '#ffffff'
    }).setOrigin(0.5)

    nextDayBtn.on('pointerdown', () => this.advanceDay())
    nextDayBtn.on('pointerover', () => nextDayBtn.setFillStyle(Phaser.Display.Color.IntegerToColor(COLORS.SECONDARY).lighten(15).color))
    nextDayBtn.on('pointerout', () => nextDayBtn.setFillStyle(COLORS.SECONDARY))

    const saveBtn = this.add.rectangle(GAME_CONFIG.WIDTH - 310, GAME_CONFIG.HEIGHT - 30, 140, 40, COLORS.PRIMARY)
      .setInteractive({ useHandCursor: true })
    this.add.text(GAME_CONFIG.WIDTH - 310, GAME_CONFIG.HEIGHT - 30, '保存游戏', {
      font: 'bold 16px Arial', color: '#ffffff'
    }).setOrigin(0.5)

    saveBtn.on('pointerdown', () => this.saveGame())
    saveBtn.on('pointerover', () => saveBtn.setFillStyle(Phaser.Display.Color.IntegerToColor(COLORS.PRIMARY).lighten(15).color))
    saveBtn.on('pointerout', () => saveBtn.setFillStyle(COLORS.PRIMARY))

    const statusText = this.add.text(40, GAME_CONFIG.HEIGHT - 30, '', {
      font: '16px Arial', color: '#a0a0a0'
    })
    this.uiElements.set('status', statusText)
  }

  private refreshUI(): void {
    this.refreshTaskList()
    this.refreshCalendar()
    this.refreshInstrumentPanel()
    this.refreshHeader()
  }

  private refreshHeader(): void {
    const state = this.stateManager.getState()

    const moneyText = this.uiElements.get('money') as Phaser.GameObjects.Text
    if (moneyText) moneyText.setText(`${state.money}`)

    const repText = this.uiElements.get('reputation') as Phaser.GameObjects.Text
    if (repText) repText.setText(`${state.reputation}`)

    const scoreText = this.uiElements.get('score') as Phaser.GameObjects.Text
    if (scoreText) scoreText.setText(`得分: ${this.stateManager.getSessionScore()}`)

    const dayLabel = this.uiElements.get('dayLabel') as Phaser.GameObjects.Text
    if (dayLabel) {
      const levelConfig = this.stateManager.getCurrentLevelConfig()
      dayLabel.setText(`第 ${state.currentDay} 天 - 目标得分: ${levelConfig.targetScore}`)
    }
  }

  private refreshTaskList(): void {
    const container = this.uiElements.get('taskContainer') as Phaser.GameObjects.Container
    if (!container) return
    container.removeAll(true)

    const tasks = this.stateManager.getCurrentDayTasks()

    tasks.forEach((task, index) => {
      const y = index * 130
      const isSelected = this.selectedTask?.id === task.id

      const card = this.add.rectangle(270, y + 55, 540, 120, isSelected ? COLORS.SURFACE_LIGHT : COLORS.SURFACE)
        .setStrokeStyle(2, isSelected ? COLORS.PRIMARY : COLORS.SURFACE_LIGHT)
        .setInteractive({ useHandCursor: true })

      const avatar = this.add.text(20, y + 10, task.patient.avatar, { font: '36px Arial' })
      const nameT = this.add.text(70, y + 10, task.patient.name, {
        font: 'bold 18px Arial', color: '#ffffff'
      })
      const diagT = this.add.text(70, y + 35, task.patient.diagnosis, {
        font: '14px Arial', color: '#a0a0a0'
      })

      const difficultyStars = '⭐'.repeat(task.difficulty)
      const starT = this.add.text(200, y + 10, difficultyStars, { font: '14px Arial', color: '#ffd93d' })

      const treatmentNames = task.treatments.slice(0, 3).map(tid => TREATMENTS[tid]?.name || tid).join('、')
      const treatT = this.add.text(20, y + 60, `所需治疗: ${treatmentNames}`, {
        font: '13px Arial', color: '#4a90d9'
      })

      const rewardT = this.add.text(20, y + 85, `奖励: ${task.reward} 💰`, {
        font: '14px Arial', color: '#ffd700'
      })

      const statusColor = task.isCompleted ? COLORS.SUCCESS : task.isAccepted ? COLORS.WARNING : COLORS.TEXT_SECONDARY
      const statusText = task.isCompleted ? '已完成' : task.isAccepted ? '进行中' : '待接受'
      const stT = this.add.text(450, y + 10, statusText, {
        font: 'bold 14px Arial', color: `#${statusColor.toString(16).padStart(6, '0')}`
      }).setOrigin(1, 0)

      card.on('pointerdown', () => {
        this.selectedTask = task
        this.refreshUI()
        this.showTaskDetail(task)
      })

      container.add([card, avatar, nameT, diagT, starT, treatT, rewardT, stT])
    })
  }

  private destroyPanels(names: string[]): void {
    this.children.each(c => {
      const go = c as Phaser.GameObjects.GameObject
      if (names.includes(go.name)) {
        go.destroy()
      }
    })
  }

  private showTaskDetail(task: Task): void {
    this.destroyPanels(['detailPanel', 'treatmentPanel', 'timeSlotPanel', 'instrumentPanel_sel'])

    this.add.rectangle(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2, 700, 500, COLORS.SURFACE)
      .setStrokeStyle(3, COLORS.PRIMARY)
      .setName('detailPanel')

    this.add.text(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 - 220, '任务详情', {
      font: 'bold 28px Arial', color: '#ffffff'
    }).setOrigin(0.5).setName('detailPanel')

    const closeBtn = this.add.rectangle(GAME_CONFIG.WIDTH / 2 + 320, GAME_CONFIG.HEIGHT / 2 - 220, 40, 40, COLORS.ACCENT)
      .setInteractive({ useHandCursor: true })
      .setName('detailPanel')
    this.add.text(GAME_CONFIG.WIDTH / 2 + 320, GAME_CONFIG.HEIGHT / 2 - 220, '✕', {
      font: 'bold 20px Arial', color: '#ffffff'
    }).setOrigin(0.5).setName('detailPanel')

    closeBtn.on('pointerdown', () => this.destroyPanels(['detailPanel']))

    this.add.text(GAME_CONFIG.WIDTH / 2 - 300, GAME_CONFIG.HEIGHT / 2 - 170, `${task.patient.avatar} ${task.patient.name}`, {
      font: 'bold 24px Arial', color: '#ffffff'
    }).setOrigin(0, 0.5).setName('detailPanel')

    this.add.text(GAME_CONFIG.WIDTH / 2 - 300, GAME_CONFIG.HEIGHT / 2 - 130,
      `年龄: ${task.patient.age}岁 | 性别: ${task.patient.gender === 'male' ? '男' : '女'} | 诊断: ${task.patient.diagnosis}`,
      { font: '16px Arial', color: '#a0a0a0' }
    ).setOrigin(0, 0.5).setName('detailPanel')

    this.add.text(GAME_CONFIG.WIDTH / 2 - 300, GAME_CONFIG.HEIGHT / 2 - 90, '症状:', {
      font: 'bold 18px Arial', color: '#4a90d9'
    }).setOrigin(0, 0.5).setName('detailPanel')
    this.add.text(GAME_CONFIG.WIDTH / 2 - 300, GAME_CONFIG.HEIGHT / 2 - 60, task.patient.symptoms.join('、'), {
      font: '14px Arial', color: '#ffffff', wordWrap: { width: 600 }
    }).setOrigin(0, 0.5).setName('detailPanel')

    this.add.text(GAME_CONFIG.WIDTH / 2 - 300, GAME_CONFIG.HEIGHT / 2 - 20, '所需治疗项目:', {
      font: 'bold 18px Arial', color: '#4a90d9'
    }).setOrigin(0, 0.5).setName('detailPanel')
    task.treatments.forEach((tid, i) => {
      const t = TREATMENTS[tid]
      if (t) {
        const insuredText = t.insuranceCovered ? `医保报销${Math.floor(t.insuranceRatio * 100)}%` : '自费'
        this.add.text(GAME_CONFIG.WIDTH / 2 - 300, GAME_CONFIG.HEIGHT / 2 + 15 + i * 30,
          `• ${t.name} (${t.cost}元, ${insuredText})`,
          { font: '14px Arial', color: '#ffffff' }
        ).setOrigin(0, 0.5).setName('detailPanel')
      }
    })

    const clues = this.stateManager.getClues(task.patient.id)
    this.add.text(GAME_CONFIG.WIDTH / 2 - 300, GAME_CONFIG.HEIGHT / 2 + 110, '线索:', {
      font: 'bold 18px Arial', color: '#4a90d9'
    }).setOrigin(0, 0.5).setName('detailPanel')
    clues.forEach((clue, i) => {
      if (clue.isRevealed) {
        this.add.text(GAME_CONFIG.WIDTH / 2 - 300, GAME_CONFIG.HEIGHT / 2 + 140 + i * 25,
          `• ${clue.content}`,
          { font: '13px Arial', color: '#a0a0a0' }
        ).setOrigin(0, 0.5).setName('detailPanel')
      } else {
        const clueText = this.add.text(GAME_CONFIG.WIDTH / 2 - 300, GAME_CONFIG.HEIGHT / 2 + 140 + i * 25,
          `• [未解锁 - 点击观察]`,
          { font: '13px Arial', color: '#ff6b6b' }
        ).setOrigin(0, 0.5).setInteractive({ useHandCursor: true })
          .setName('detailPanel')
        clueText.on('pointerdown', () => {
          this.stateManager.revealClue(task.patient.id, clue.id)
          this.showTaskDetail(task)
        })
      }
    })

    if (!task.isAccepted && !task.isCompleted) {
      const acceptBtn = this.add.rectangle(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 + 200, 200, 50, COLORS.SUCCESS)
        .setInteractive({ useHandCursor: true })
        .setName('detailPanel')
      this.add.text(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 + 200, '接受任务', {
        font: 'bold 20px Arial', color: '#ffffff'
      }).setOrigin(0.5).setName('detailPanel')

      acceptBtn.on('pointerdown', () => {
        this.stateManager.acceptTask(task.id)
        this.destroyPanels(['detailPanel'])
        this.refreshUI()
        this.setStatus(`已接受任务: ${task.patient.name}的治疗任务`)
      })
      acceptBtn.on('pointerover', () => acceptBtn.setFillStyle(Phaser.Display.Color.IntegerToColor(COLORS.SUCCESS).lighten(15).color))
      acceptBtn.on('pointerout', () => acceptBtn.setFillStyle(COLORS.SUCCESS))
    }

    if (task.isAccepted && !task.isCompleted) {
      const scheduleBtn = this.add.rectangle(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 + 200, 200, 50, COLORS.PRIMARY)
        .setInteractive({ useHandCursor: true })
        .setName('detailPanel')
      this.add.text(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 + 200, '安排治疗', {
        font: 'bold 20px Arial', color: '#ffffff'
      }).setOrigin(0.5).setName('detailPanel')

      scheduleBtn.on('pointerdown', () => {
        this.destroyPanels(['detailPanel'])
        this.showTreatmentSelector(task)
      })
      scheduleBtn.on('pointerover', () => scheduleBtn.setFillStyle(Phaser.Display.Color.IntegerToColor(COLORS.PRIMARY).lighten(15).color))
      scheduleBtn.on('pointerout', () => scheduleBtn.setFillStyle(COLORS.PRIMARY))
    }
  }

  private showTreatmentSelector(task: Task): void {
    this.destroyPanels(['treatmentPanel', 'timeSlotPanel', 'instrumentPanel_sel'])

    this.add.rectangle(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2, 600, 450, COLORS.SURFACE)
      .setStrokeStyle(3, COLORS.PRIMARY)
      .setName('treatmentPanel')

    this.add.text(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 - 190, '选择治疗项目', {
      font: 'bold 24px Arial', color: '#ffffff'
    }).setOrigin(0.5).setName('treatmentPanel')

    this.add.text(GAME_CONFIG.WIDTH / 2 - 250, GAME_CONFIG.HEIGHT / 2 - 150, '请选择治疗项目和时段', {
      font: '16px Arial', color: '#a0a0a0'
    }).setOrigin(0, 0.5).setName('treatmentPanel')

    task.treatments.forEach((tid, tIndex) => {
      const treatment = TREATMENTS[tid]
      if (!treatment) return

      const y = GAME_CONFIG.HEIGHT / 2 - 100 + tIndex * 70
      const card = this.add.rectangle(GAME_CONFIG.WIDTH / 2, y, 520, 60, COLORS.SURFACE_LIGHT)
        .setStrokeStyle(2, COLORS.PRIMARY)
        .setInteractive({ useHandCursor: true })
        .setName('treatmentPanel')

      this.add.text(GAME_CONFIG.WIDTH / 2 - 240, y, `${treatment.name} - ${treatment.cost}元`, {
        font: 'bold 16px Arial', color: '#ffffff'
      }).setOrigin(0, 0.5).setName('treatmentPanel')

      const insuredText = treatment.insuranceCovered ? `报销${Math.floor(treatment.insuranceRatio * 100)}%` : '不报销'
      this.add.text(GAME_CONFIG.WIDTH / 2 - 240, y + 20,
        `医保: ${insuredText} | 器械: ${treatment.requiredInstrument}`,
        { font: '13px Arial', color: '#a0a0a0' }
      ).setOrigin(0, 0.5).setName('treatmentPanel')

      card.on('pointerdown', () => {
        this.showTimeSlotSelector(task, treatment.id)
      })
    })

    const closeBtn = this.add.rectangle(GAME_CONFIG.WIDTH / 2 + 260, GAME_CONFIG.HEIGHT / 2 - 190, 40, 40, COLORS.ACCENT)
      .setInteractive({ useHandCursor: true })
      .setName('treatmentPanel')
    this.add.text(GAME_CONFIG.WIDTH / 2 + 260, GAME_CONFIG.HEIGHT / 2 - 190, '✕', {
      font: 'bold 20px Arial', color: '#ffffff'
    }).setOrigin(0.5).setName('treatmentPanel')

    closeBtn.on('pointerdown', () => this.destroyPanels(['treatmentPanel']))
  }

  private showTimeSlotSelector(task: Task, treatmentId: string): void {
    this.destroyPanels(['timeSlotPanel', 'instrumentPanel_sel'])

    this.add.rectangle(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2, 500, 400, COLORS.SURFACE)
      .setStrokeStyle(3, COLORS.PRIMARY)
      .setName('timeSlotPanel')

    const treatment = TREATMENTS[treatmentId]
    this.add.text(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 - 160, `安排: ${treatment?.name || treatmentId}`, {
      font: 'bold 22px Arial', color: '#ffffff'
    }).setOrigin(0.5).setName('timeSlotPanel')

    this.add.text(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 - 120, '选择时间段和器械', {
      font: '16px Arial', color: '#a0a0a0'
    }).setOrigin(0.5).setName('timeSlotPanel')

    const state = this.stateManager.getState()
    const calendarDay = this.stateManager.getCalendarDay(state.currentDay)
    const timeSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']

    timeSlots.forEach((slot, slotIndex) => {
      const x = GAME_CONFIG.WIDTH / 2 - 180 + (slotIndex % 3) * 120
      const y = GAME_CONFIG.HEIGHT / 2 - 60 + Math.floor(slotIndex / 3) * 80

      const isOccupied = calendarDay?.treatments.some(t => t.timeSlot === slotIndex)
      const slotBtn = this.add.rectangle(x, y, 100, 60, isOccupied ? COLORS.ERROR : COLORS.SURFACE_LIGHT)
        .setStrokeStyle(2, isOccupied ? COLORS.ACCENT : COLORS.PRIMARY)
        .setInteractive({ useHandCursor: !isOccupied })
        .setName('timeSlotPanel')

      this.add.text(x, y, slot, {
        font: 'bold 16px Arial', color: '#ffffff'
      }).setOrigin(0.5).setName('timeSlotPanel')

      if (!isOccupied) {
        slotBtn.on('pointerdown', () => {
          this.showInstrumentSelector(task, treatmentId, slotIndex)
        })
      }
    })

    const closeBtn = this.add.rectangle(GAME_CONFIG.WIDTH / 2 + 210, GAME_CONFIG.HEIGHT / 2 - 160, 40, 40, COLORS.ACCENT)
      .setInteractive({ useHandCursor: true })
      .setName('timeSlotPanel')
    this.add.text(GAME_CONFIG.WIDTH / 2 + 210, GAME_CONFIG.HEIGHT / 2 - 160, '✕', {
      font: 'bold 20px Arial', color: '#ffffff'
    }).setOrigin(0.5).setName('timeSlotPanel')

    closeBtn.on('pointerdown', () => this.destroyPanels(['timeSlotPanel']))
  }

  private showInstrumentSelector(task: Task, treatmentId: string, timeSlot: number): void {
    this.destroyPanels(['instrumentPanel_sel'])

    this.add.rectangle(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2, 500, 400, COLORS.SURFACE)
      .setStrokeStyle(3, COLORS.PRIMARY)
      .setName('instrumentPanel_sel')

    const treatment = TREATMENTS[treatmentId]
    this.add.text(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 - 160, '选择治疗器械', {
      font: 'bold 22px Arial', color: '#ffffff'
    }).setOrigin(0.5).setName('instrumentPanel_sel')

    this.add.text(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 - 120, '所需器械类型已高亮显示', {
      font: '16px Arial', color: '#a0a0a0'
    }).setOrigin(0.5).setName('instrumentPanel_sel')

    const state = this.stateManager.getState()

    state.instruments.forEach((inst) => {
      const isRequired = inst.id === treatment?.requiredInstrument
      const isAvailable = inst.status === 'available'

      const card = this.add.rectangle(GAME_CONFIG.WIDTH / 2, 0, 440, 55, isRequired ? COLORS.PRIMARY : COLORS.SURFACE_LIGHT)
        .setStrokeStyle(2, isAvailable ? COLORS.SECONDARY : COLORS.TEXT_SECONDARY)
        .setInteractive({ useHandCursor: isAvailable })
        .setName('instrumentPanel_sel')

      const idx = state.instruments.indexOf(inst)
      const y = GAME_CONFIG.HEIGHT / 2 - 70 + idx * 65
      card.setY(y)

      this.add.text(GAME_CONFIG.WIDTH / 2 - 200, y, inst.icon, { font: '28px Arial' })
        .setOrigin(0, 0.5).setName('instrumentPanel_sel')

      this.add.text(GAME_CONFIG.WIDTH / 2 - 150, y - 10, inst.name, {
        font: 'bold 16px Arial', color: '#ffffff'
      }).setOrigin(0, 0.5).setName('instrumentPanel_sel')

      const instStatusText = inst.status === 'available' ? '可用' : inst.status === 'in-use' ? '使用中' : inst.status === 'maintenance' ? '需维护' : '损坏'
      this.add.text(GAME_CONFIG.WIDTH / 2 - 150, y + 12,
        `状态: ${instStatusText} | 耐久: ${inst.durability}/${inst.maxDurability}`,
        { font: '12px Arial', color: isAvailable ? '#50c878' : '#a0a0a0' }
      ).setOrigin(0, 0.5).setName('instrumentPanel_sel')

      if (isAvailable) {
        card.on('pointerdown', () => {
          const result = this.stateManager.scheduleTreatment(task.id, treatmentId, timeSlot, inst.id)
          if (result.success) {
            this.destroyPanels(['instrumentPanel_sel', 'timeSlotPanel', 'treatmentPanel'])
            this.refreshUI()
            this.setStatus('治疗安排成功!')
          } else {
            this.setStatus(`安排失败: ${result.message}`)
          }
        })
      }
    })

    const closeBtn = this.add.rectangle(GAME_CONFIG.WIDTH / 2 + 210, GAME_CONFIG.HEIGHT / 2 - 160, 40, 40, COLORS.ACCENT)
      .setInteractive({ useHandCursor: true })
      .setName('instrumentPanel_sel')
    this.add.text(GAME_CONFIG.WIDTH / 2 + 210, GAME_CONFIG.HEIGHT / 2 - 160, '✕', {
      font: 'bold 20px Arial', color: '#ffffff'
    }).setOrigin(0.5).setName('instrumentPanel_sel')

    closeBtn.on('pointerdown', () => this.destroyPanels(['instrumentPanel_sel']))
  }

  private refreshCalendar(): void {
    const container = this.uiElements.get('calendarContainer') as Phaser.GameObjects.Container
    if (!container) return
    container.removeAll(true)

    const state = this.stateManager.getState()
    const calendarDay = this.stateManager.getCalendarDay(state.currentDay)
    if (!calendarDay) return

    const allTasks = this.stateManager.getAllTasks()
    const timeSlots = ['09:00', '10:00', '14:00', '15:00', '16:00', '17:00']

    timeSlots.forEach((slot, index) => {
      const x = (index % 3) * 200
      const y = Math.floor(index / 3) * 180

      const scheduled = calendarDay.treatments.find(t => t.timeSlot === index)
      const treatment = scheduled ? TREATMENTS[scheduled.treatmentId] : null

      const slotBg = this.add.rectangle(x + 90, y + 80, 180, 160, scheduled ? COLORS.SURFACE_LIGHT : COLORS.BACKGROUND)
        .setStrokeStyle(2, scheduled ? COLORS.PRIMARY : COLORS.SURFACE_LIGHT)

      const timeLabel = this.add.text(x + 90, y + 15, slot, {
        font: 'bold 18px Arial', color: '#ffffff'
      }).setOrigin(0.5)

      const items: Phaser.GameObjects.GameObject[] = [slotBg, timeLabel]

      if (scheduled && treatment) {
        const treatName = this.add.text(x + 90, y + 45, treatment.name, {
          font: 'bold 14px Arial', color: '#4a90d9'
        }).setOrigin(0.5)
        items.push(treatName)

        const task = allTasks.find(t => t.patient.id === scheduled.patientId)
        const patientName = this.add.text(x + 90, y + 70, task?.patient?.name || '', {
          font: '13px Arial', color: '#ffffff'
        }).setOrigin(0.5)
        items.push(patientName)

        const statusLabel = scheduled.isCompleted
          ? (scheduled.isInsuranceApproved ? '✓ 已完成' : '✗ 已拒付')
          : '进行中'
        const statusColor = scheduled.isCompleted
          ? (scheduled.isInsuranceApproved ? '#50c878' : '#ff6b6b')
          : '#ffd93d'
        const statusT = this.add.text(x + 90, y + 100, statusLabel, {
          font: '12px Arial', color: statusColor
        }).setOrigin(0.5)
        items.push(statusT)

        if (!scheduled.isCompleted) {
          const completeBtn = this.add.rectangle(x + 90, y + 135, 120, 30, COLORS.SECONDARY)
            .setInteractive({ useHandCursor: true })
          const completeLabel = this.add.text(x + 90, y + 135, '完成治疗', {
            font: 'bold 13px Arial', color: '#ffffff'
          }).setOrigin(0.5)
          items.push(completeBtn, completeLabel)

          completeBtn.on('pointerdown', () => {
            const result = this.stateManager.completeTreatment(scheduled.id)
            if (result.success) {
              let msg = `治疗完成! 收入: ${result.payment}元`
              if (result.rejection) {
                msg += ` | 医保拒付: ${result.rejection.reason}`
              }
              this.setStatus(msg)
              this.refreshUI()
            }
          })
        }
      }

      container.add(items)
    })
  }

  private refreshInstrumentPanel(): void {
    const container = this.uiElements.get('instrumentContainer') as Phaser.GameObjects.Container
    if (!container) return
    container.removeAll(true)

    const state = this.stateManager.getState()
    state.instruments.forEach((inst, index) => {
      const x = (index % 3) * 190
      const y = Math.floor(index / 3) * 75

      const card = this.add.rectangle(x + 85, y + 35, 170, 65, COLORS.SURFACE_LIGHT)
        .setStrokeStyle(2, COLORS.PRIMARY)
        .setInteractive({ useHandCursor: true })

      const iconT = this.add.text(x + 15, y + 35, inst.icon, { font: '28px Arial' })

      const nameT = this.add.text(x + 50, y + 15, inst.name, {
        font: 'bold 13px Arial', color: '#ffffff'
      })

      const durPercent = inst.durability / inst.maxDurability
      const durColor = durPercent > 0.6 ? '50c878' : durPercent > 0.3 ? 'ffd93d' : 'ff6b6b'

      const durT = this.add.text(x + 50, y + 38, `${inst.durability}/${inst.maxDurability}`, {
        font: '11px Arial', color: `#${durColor}`
      })

      const items: Phaser.GameObjects.GameObject[] = [card, iconT, nameT, durT]

      if (inst.status === 'maintenance' || inst.durability <= 20) {
        const maintainBtn = this.add.rectangle(x + 140, y + 45, 50, 25, COLORS.WARNING)
          .setInteractive({ useHandCursor: true })
        const maintainLabel = this.add.text(x + 140, y + 45, '维护', {
          font: 'bold 11px Arial', color: '#000000'
        }).setOrigin(0.5)

        maintainBtn.on('pointerdown', () => {
          if (this.stateManager.maintainInstrument(inst.id)) {
            this.refreshUI()
            this.setStatus(`${inst.name} 维护完成!`)
          } else {
            this.setStatus('维护失败: 资金不足')
          }
        })

        items.push(maintainBtn, maintainLabel)
      }

      container.add(items)
    })
  }

  private advanceDay(): void {
    const state = this.stateManager.getState()

    if (state.currentDay >= 7) {
      this.endLevel()
      return
    }

    if (this.stateManager.advanceDay()) {
      this.stateManager.generateTasks()
      this.selectedTask = null
      this.refreshUI()
      this.setStatus(`进入第 ${state.currentDay + 1} 天`)
    }
  }

  private endLevel(): void {
    const state = this.stateManager.getState()
    const levelConfig = this.stateManager.getCurrentLevelConfig()
    const score = this.stateManager.getSessionScore()
    const stats = this.stateManager.getCompletionStats()
    const errors = this.stateManager.getErrors()
    const rejections = this.stateManager.getRejections()

    const record: TrainingRecord = {
      id: `record_${Date.now()}`,
      date: new Date().toISOString(),
      level: state.currentLevel,
      score,
      completedTasks: stats.completed,
      totalTasks: stats.total,
      errors,
      rejections,
      completionRate: stats.rate
    }
    this.storageManager.addTrainingRecord(record)

    const leaderboardEntry: LeaderboardEntry = {
      id: `lb_${Date.now()}`,
      playerName: '玩家',
      score,
      level: state.currentLevel,
      completionRate: stats.rate,
      date: new Date().toISOString()
    }
    this.storageManager.addLeaderboardEntry(leaderboardEntry)

    this.destroyPanels(['endLevelPanel'])

    this.add.rectangle(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2, 600, 500, COLORS.SURFACE)
      .setStrokeStyle(3, COLORS.PRIMARY)
      .setName('endLevelPanel')

    this.add.text(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 - 200, '关卡结算', {
      font: 'bold 32px Arial', color: '#ffffff'
    }).setOrigin(0.5).setName('endLevelPanel')

    this.add.text(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 - 140, `${levelConfig.name}`, {
      font: 'bold 24px Arial', color: '#4a90d9'
    }).setOrigin(0.5).setName('endLevelPanel')

    this.add.text(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 - 80,
      `完成任务: ${stats.completed}/${stats.total} (${(stats.rate * 100).toFixed(1)}%)`,
      { font: '18px Arial', color: '#ffffff' }
    ).setOrigin(0.5).setName('endLevelPanel')

    this.add.text(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 - 50, `总得分: ${score} / ${levelConfig.targetScore}`, {
      font: 'bold 24px Arial', color: score >= levelConfig.targetScore ? '#50c878' : '#ff6b6b'
    }).setOrigin(0.5).setName('endLevelPanel')

    this.add.text(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 - 10, `错误次数: ${errors.length}`, {
      font: '16px Arial', color: '#ff6b6b'
    }).setOrigin(0.5).setName('endLevelPanel')

    this.add.text(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 + 20, `医保拒付: ${rejections.length}次`, {
      font: '16px Arial', color: '#ffd93d'
    }).setOrigin(0.5).setName('endLevelPanel')

    if (errors.length > 0) {
      this.add.text(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 + 60, '错误详情:', {
        font: 'bold 16px Arial', color: '#ff6b6b'
      }).setOrigin(0.5).setName('endLevelPanel')
      errors.slice(0, 3).forEach((err, i) => {
        this.add.text(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 + 90 + i * 25,
          `• ${err.reason}`,
          { font: '13px Arial', color: '#a0a0a0' }
        ).setOrigin(0.5).setName('endLevelPanel')
      })
    }

    if (rejections.length > 0) {
      const rejOffset = errors.length > 0 ? 90 + Math.min(errors.length, 3) * 25 + 10 : 60
      this.add.text(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 + rejOffset, '医保拒付详情:', {
        font: 'bold 16px Arial', color: '#ffd93d'
      }).setOrigin(0.5).setName('endLevelPanel')
      rejections.slice(0, 3).forEach((rej, i) => {
        this.add.text(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 + rejOffset + 30 + i * 25,
          `• ${rej.reason} (损失${rej.amount}元)`,
          { font: '13px Arial', color: '#a0a0a0' }
        ).setOrigin(0.5).setName('endLevelPanel')
      })
    }

    const menuBtn = this.add.rectangle(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 + 200, 200, 50, COLORS.PRIMARY)
      .setInteractive({ useHandCursor: true })
      .setName('endLevelPanel')
    this.add.text(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 + 200, '返回菜单', {
      font: 'bold 20px Arial', color: '#ffffff'
    }).setOrigin(0.5).setName('endLevelPanel')

    menuBtn.on('pointerdown', () => this.scene.start('MainMenuScene'))
    menuBtn.on('pointerover', () => menuBtn.setFillStyle(Phaser.Display.Color.IntegerToColor(COLORS.PRIMARY).lighten(15).color))
    menuBtn.on('pointerout', () => menuBtn.setFillStyle(COLORS.PRIMARY))

    if (score >= levelConfig.targetScore && state.currentLevel < LEVELS.length) {
      const nextBtn = this.add.rectangle(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 + 140, 200, 50, COLORS.SUCCESS)
        .setInteractive({ useHandCursor: true })
        .setName('endLevelPanel')
      this.add.text(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 + 140, '进入下一关', {
        font: 'bold 20px Arial', color: '#ffffff'
      }).setOrigin(0.5).setName('endLevelPanel')

      nextBtn.on('pointerdown', () => {
        this.stateManager.levelUp()
        this.stateManager.resetSessionStats()
        this.scene.restart()
      })
      nextBtn.on('pointerover', () => nextBtn.setFillStyle(Phaser.Display.Color.IntegerToColor(COLORS.SUCCESS).lighten(15).color))
      nextBtn.on('pointerout', () => nextBtn.setFillStyle(COLORS.SUCCESS))
    }
  }

  private showPauseMenu(): void {
    this.destroyPanels(['pausePanel'])

    this.add.rectangle(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2, 400, 350, COLORS.SURFACE)
      .setStrokeStyle(3, COLORS.PRIMARY)
      .setName('pausePanel')

    this.add.text(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 - 120, '游戏暂停', {
      font: 'bold 28px Arial', color: '#ffffff'
    }).setOrigin(0.5).setName('pausePanel')

    const resumeBtn = this.add.rectangle(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 - 50, 200, 50, COLORS.SECONDARY)
      .setInteractive({ useHandCursor: true })
      .setName('pausePanel')
    this.add.text(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 - 50, '继续游戏', {
      font: 'bold 18px Arial', color: '#ffffff'
    }).setOrigin(0.5).setName('pausePanel')

    const saveBtn = this.add.rectangle(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 + 20, 200, 50, COLORS.PRIMARY)
      .setInteractive({ useHandCursor: true })
      .setName('pausePanel')
    this.add.text(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 + 20, '保存游戏', {
      font: 'bold 18px Arial', color: '#ffffff'
    }).setOrigin(0.5).setName('pausePanel')

    const quitBtn = this.add.rectangle(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 + 90, 200, 50, COLORS.ACCENT)
      .setInteractive({ useHandCursor: true })
      .setName('pausePanel')
    this.add.text(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2 + 90, '返回主菜单', {
      font: 'bold 18px Arial', color: '#ffffff'
    }).setOrigin(0.5).setName('pausePanel')

    resumeBtn.on('pointerdown', () => this.destroyPanels(['pausePanel']))
    saveBtn.on('pointerdown', () => {
      this.saveGame()
      this.destroyPanels(['pausePanel'])
    })
    quitBtn.on('pointerdown', () => this.scene.start('MainMenuScene'))

    resumeBtn.on('pointerover', () => resumeBtn.setFillStyle(Phaser.Display.Color.IntegerToColor(COLORS.SECONDARY).lighten(15).color))
    resumeBtn.on('pointerout', () => resumeBtn.setFillStyle(COLORS.SECONDARY))
    saveBtn.on('pointerover', () => saveBtn.setFillStyle(Phaser.Display.Color.IntegerToColor(COLORS.PRIMARY).lighten(15).color))
    saveBtn.on('pointerout', () => saveBtn.setFillStyle(COLORS.PRIMARY))
    quitBtn.on('pointerover', () => quitBtn.setFillStyle(Phaser.Display.Color.IntegerToColor(COLORS.ACCENT).lighten(15).color))
    quitBtn.on('pointerout', () => quitBtn.setFillStyle(COLORS.ACCENT))
  }

  private saveGame(): void {
    const state = this.stateManager.getState()
    this.storageManager.saveGame(state)
    this.setStatus('游戏已保存!')
  }

  private setStatus(message: string): void {
    const statusText = this.uiElements.get('status') as Phaser.GameObjects.Text
    if (statusText) statusText.setText(message)
  }
}
