import type {
  GameState, Task, CalendarDay, ScheduledTreatment,
  ErrorRecord, RejectionRecord, Clue
} from '../game/types'
import { GAME_CONFIG } from '../game/constants'
import { generatePatient, generateClues } from '../config/patients'
import { TREATMENTS } from '../config/treatments'
import { INSTRUMENTS } from '../config/instruments'
import { LEVELS } from '../config/levels'
import { REJECTION_REASONS, ERROR_REASONS } from '../config/reasons'
import { StorageManager } from './StorageManager'

export class GameStateManager {
  private static instance: GameStateManager
  private state: GameState
  private currentClues: Map<string, Clue[]> = new Map()

  private constructor() {
    this.state = StorageManager.getInstance().getInitialGameState()
  }

  static getInstance(): GameStateManager {
    if (!GameStateManager.instance) {
      GameStateManager.instance = new GameStateManager()
    }
    return GameStateManager.instance
  }

  getState(): GameState {
    return { ...this.state }
  }

  setState(newState: GameState): void {
    this.state = newState
    StorageManager.getInstance().saveGame(this.state)
  }

  private syncToState(): void {
    StorageManager.getInstance().saveGame(this.state)
  }

  loadSavedState(): boolean {
    const saved = StorageManager.getInstance().loadGame()
    if (saved) {
      this.state = saved
      if (!this.state.sessionScore) this.state.sessionScore = 0
      if (!this.state.errors) this.state.errors = []
      if (!this.state.rejections) this.state.rejections = []
      return true
    }
    return false
  }

  resetState(): void {
    this.state = StorageManager.getInstance().getInitialGameState()
    this.currentClues.clear()
    StorageManager.getInstance().clearSave()
  }

  getCurrentLevelConfig() {
    return LEVELS.find(l => l.id === this.state.currentLevel) || LEVELS[0]
  }

  getUnlockedTreatments(): string[] {
    const treatments: string[] = []
    for (const level of LEVELS) {
      if (level.id <= this.state.currentLevel) {
        treatments.push(...level.unlockTreatments)
      }
    }
    return treatments
  }

  getUnlockedInstruments(): string[] {
    const instruments: string[] = []
    for (const level of LEVELS) {
      if (level.id <= this.state.currentLevel) {
        instruments.push(...level.unlockInstruments)
      }
    }
    return instruments
  }

  generateTasks(): Task[] {
    const levelConfig = this.getCurrentLevelConfig()
    const unlockedTreatments = this.getUnlockedTreatments()
    const existingDayTaskIds = new Set(
      this.state.tasks
        .filter(t => t.assignedDate === `day_${this.state.currentDay}`)
        .map(t => t.id)
    )

    if (existingDayTaskIds.size > 0) {
      return this.state.tasks.filter(t => t.assignedDate === `day_${this.state.currentDay}`)
    }

    const newTasks: Task[] = []

    for (let i = 0; i < levelConfig.taskCount; i++) {
      const patient = generatePatient(unlockedTreatments)
      const clues = generateClues(patient)
      this.currentClues.set(patient.id, clues)

      const task: Task = {
        id: `task_${Date.now()}_${i}`,
        patient,
        assignedDate: `day_${this.state.currentDay}`,
        deadline: 3,
        difficulty: Math.min(5, Math.ceil(Math.random() * levelConfig.complexity)) as 1 | 2 | 3 | 4 | 5,
        reward: 200 + patient.requiredTreatments.length * 100 + levelConfig.complexity * 50,
        hints: clues.map(c => c.content),
        treatments: patient.requiredTreatments,
        isCompleted: false,
        isAccepted: false
      }
      newTasks.push(task)
    }

    this.state.tasks = [...this.state.tasks, ...newTasks]
    this.syncToState()
    return newTasks
  }

  getCurrentDayTasks(): Task[] {
    return this.state.tasks.filter(t => t.assignedDate === `day_${this.state.currentDay}`)
  }

  getAllTasks(): Task[] {
    return [...this.state.tasks]
  }

  getClues(patientId: string): Clue[] {
    return this.currentClues.get(patientId) || []
  }

  revealClue(patientId: string, clueId: string): Clue | null {
    const clues = this.currentClues.get(patientId)
    if (!clues) return null
    const clue = clues.find(c => c.id === clueId)
    if (clue) {
      clue.isRevealed = true
    }
    return clue || null
  }

  acceptTask(taskId: string): boolean {
    const task = this.state.tasks.find(t => t.id === taskId)
    if (!task || task.isAccepted) return false
    task.isAccepted = true
    this.syncToState()
    return true
  }

  scheduleTreatment(
    taskId: string,
    treatmentId: string,
    timeSlot: number,
    instrumentId: string
  ): { success: boolean; message?: string } {
    const task = this.state.tasks.find(t => t.id === taskId)
    if (!task || !task.isAccepted || task.isCompleted) {
      return { success: false, message: '任务无效或已完成' }
    }

    const treatment = TREATMENTS[treatmentId]
    if (!treatment) {
      return { success: false, message: '治疗项目不存在' }
    }

    const instrument = this.state.instruments.find(i => i.id === instrumentId)
    if (!instrument) {
      return { success: false, message: '器械不存在' }
    }

    if (instrument.status !== 'available') {
      return { success: false, message: '器械当前不可用' }
    }

    if (treatment.requiredInstrument !== instrumentId) {
      this.addError(taskId, treatmentId, ERROR_REASONS[0])
      return { success: false, message: ERROR_REASONS[0] }
    }

    const dayIndex = this.state.currentDay - 1
    if (dayIndex >= this.state.calendar.length) {
      return { success: false, message: '日期无效' }
    }

    const calendarDay = this.state.calendar[dayIndex]
    if (calendarDay.treatments.some(t => t.timeSlot === timeSlot && t.instrumentId === instrumentId)) {
      this.addError(taskId, treatmentId, ERROR_REASONS[2])
      return { success: false, message: ERROR_REASONS[2] }
    }

    if (calendarDay.treatments.length >= calendarDay.maxSlots) {
      return { success: false, message: '今日治疗时段已满' }
    }

    const patientClues = this.currentClues.get(task.patient.id) || []
    const riskClue = patientClues.find(c => c.type === 'risk')
    if (riskClue && riskClue.isRevealed && riskClue.content.includes('超声波') && treatmentId === 'ultrasound_therapy') {
      this.addError(taskId, treatmentId, ERROR_REASONS[1])
      return { success: false, message: ERROR_REASONS[1] }
    }

    const scheduled: ScheduledTreatment = {
      id: `sched_${Date.now()}_${Math.random()}`,
      treatmentId,
      patientId: task.patient.id,
      timeSlot,
      instrumentId,
      isCompleted: false,
      isInsuranceApproved: false
    }

    calendarDay.treatments.push(scheduled)
    instrument.status = 'in-use'
    instrument.durability = Math.max(0, instrument.durability - 10)

    if (instrument.durability <= 20) {
      instrument.status = 'maintenance'
    }

    this.syncToState()
    return { success: true }
  }

  completeTreatment(scheduledId: string): {
    success: boolean
    payment?: number
    rejection?: RejectionRecord
  } {
    const calendarDay = this.state.calendar[this.state.currentDay - 1]
    const scheduled = calendarDay?.treatments.find(t => t.id === scheduledId)

    if (!scheduled || scheduled.isCompleted) {
      return { success: false }
    }

    const treatment = TREATMENTS[scheduled.treatmentId]
    const task = this.state.tasks.find(t => t.patient.id === scheduled.patientId)
    const instrument = this.state.instruments.find(i => i.id === scheduled.instrumentId)

    if (!treatment || !task) {
      return { success: false }
    }

    scheduled.isCompleted = true
    if (instrument) {
      instrument.status = instrument.durability <= 20 ? 'maintenance' : 'available'
    }

    let insuranceApproved = true
    let rejectionReason = ''
    let rejection: RejectionRecord | undefined

    if (treatment.insuranceCovered) {
      if (Math.random() < GAME_CONFIG.INSURANCE_AUDIT_CHANCE) {
        insuranceApproved = false
        rejectionReason = REJECTION_REASONS[Math.floor(Math.random() * REJECTION_REASONS.length)]

        rejection = {
          taskId: task.id,
          treatmentId: treatment.id,
          patientName: task.patient.name,
          treatmentName: treatment.name,
          reason: rejectionReason,
          amount: Math.floor(treatment.cost * treatment.insuranceRatio),
          timestamp: Date.now()
        }
        this.state.rejections.push(rejection)
        this.state.sessionScore += GAME_CONFIG.SCORE_PENALTY_REJECTION
        this.state.reputation = Math.max(GAME_CONFIG.MIN_REPUTATION, this.state.reputation - 2)
      }
    } else if (task.patient.insuranceType === 'basic') {
      insuranceApproved = false
      rejectionReason = REJECTION_REASONS[0]
      rejection = {
        taskId: task.id,
        treatmentId: treatment.id,
        patientName: task.patient.name,
        treatmentName: treatment.name,
        reason: rejectionReason,
        amount: treatment.cost,
        timestamp: Date.now()
      }
      this.state.rejections.push(rejection)
      this.state.sessionScore += GAME_CONFIG.SCORE_PENALTY_REJECTION
    }

    scheduled.isInsuranceApproved = insuranceApproved

    let payment = 0
    if (insuranceApproved && treatment.insuranceCovered) {
      payment = Math.floor(treatment.cost * treatment.insuranceRatio)
    }
    payment += Math.floor(treatment.cost * (1 - (treatment.insuranceCovered ? treatment.insuranceRatio : 0)))

    this.state.money += payment
    this.state.sessionScore += GAME_CONFIG.SCORE_BASE
    if (insuranceApproved) {
      this.state.sessionScore += GAME_CONFIG.SCORE_BONUS_PERFECT
      this.state.reputation = Math.min(GAME_CONFIG.MAX_REPUTATION, this.state.reputation + 1)
    }

    this.checkTaskCompletion(task)
    this.syncToState()

    return { success: true, payment, rejection }
  }

  private checkTaskCompletion(task: Task): void {
    const completedCount = this.state.calendar.reduce(
      (sum, day) => sum + day.treatments.filter(t => t.patientId === task.patient.id && t.isCompleted).length,
      0
    )

    if (completedCount >= task.treatments.length) {
      task.isCompleted = true
      if (!this.state.completedTasks.includes(task.id)) {
        this.state.completedTasks.push(task.id)
        this.state.money += task.reward
        this.state.sessionScore += task.reward / 2
      }
    }
  }

  addError(taskId: string, treatmentId: string, reason: string): void {
    const task = this.state.tasks.find(t => t.id === taskId)
    const treatment = TREATMENTS[treatmentId]
    const error: ErrorRecord = {
      taskId,
      treatmentId,
      patientName: task?.patient?.name || '未知患者',
      treatmentName: treatment?.name || treatmentId,
      reason,
      timestamp: Date.now()
    }
    this.state.errors.push(error)
    this.state.sessionScore += GAME_CONFIG.SCORE_PENALTY_ERROR
    this.state.reputation = Math.max(GAME_CONFIG.MIN_REPUTATION, this.state.reputation - 1)
    this.syncToState()
  }

  getErrors(): ErrorRecord[] {
    return [...this.state.errors]
  }

  getRejections(): RejectionRecord[] {
    return [...this.state.rejections]
  }

  getSessionScore(): number {
    return Math.max(0, this.state.sessionScore)
  }

  getCompletionStats(): { completed: number; total: number; rate: number } {
    const completed = this.state.tasks.filter(t => t.isCompleted).length
    const total = this.state.tasks.length
    return {
      completed,
      total,
      rate: total > 0 ? completed / total : 0
    }
  }

  advanceDay(): boolean {
    if (this.state.currentDay >= 7) {
      return false
    }
    this.state.currentDay++
    this.syncToState()
    return true
  }

  maintainInstrument(instrumentId: string): boolean {
    const instrument = this.state.instruments.find(i => i.id === instrumentId)
    if (!instrument) return false
    if (this.state.money < instrument.maintenanceCost) return false

    this.state.money -= instrument.maintenanceCost
    instrument.durability = instrument.maxDurability
    instrument.status = 'available'
    this.syncToState()
    return true
  }

  unlockInstrument(instrumentId: string): boolean {
    if (this.state.instruments.some(i => i.id === instrumentId)) return false
    const instrument = INSTRUMENTS[instrumentId]
    if (!instrument) return false

    this.state.instruments.push({ ...instrument })
    this.syncToState()
    return true
  }

  levelUp(): boolean {
    const currentLevel = this.getCurrentLevelConfig()
    if (this.state.sessionScore < currentLevel.targetScore) return false
    if (this.state.currentLevel >= LEVELS.length) return false

    this.state.currentLevel++
    const nextLevel = this.getCurrentLevelConfig()
    nextLevel.unlockInstruments.forEach(id => this.unlockInstrument(id))
    this.syncToState()
    return true
  }

  getCalendarDay(dayNumber: number): CalendarDay | undefined {
    return this.state.calendar[dayNumber - 1]
  }

  resetSessionStats(): void {
    this.state.sessionScore = 0
    this.state.errors = []
    this.state.rejections = []
    this.state.tasks = []
    this.state.completedTasks = []
    this.syncToState()
  }
}
