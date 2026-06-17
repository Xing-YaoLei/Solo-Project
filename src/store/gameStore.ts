import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  GameState,
  GameSettings,
  GameTask,
  PlayerAction,
  GameStats,
  LevelConfig,
  ReplayRecord,
  ElderlyProfile,
  TaskOption
} from '../types/game'
import { elderlyProfiles } from '../data/elderlyProfiles'
import { activities } from '../data/activities'
import { riskEvents } from '../data/riskEvents'
import { levels as levelConfigs } from '../data/levels'

interface GameStore {
  gameState: GameState
  currentLevel: LevelConfig | null
  currentElderly: ElderlyProfile[]
  activeTasks: GameTask[]
  completedTasks: GameTask[]
  timeRemaining: number
  score: number
  combo: number
  maxCombo: number
  actions: PlayerAction[]
  stats: GameStats
  settings: GameSettings
  levels: LevelConfig[]
  replayRecords: ReplayRecord[]
  selectedReplay: ReplayRecord | null
  replayActionIndex: number
  taskCounter: number
  lastTaskTime: number

  setGameState: (state: GameState) => void
  startGame: (levelId: string) => void
  pauseGame: () => void
  resumeGame: () => void
  endGame: () => void
  restartGame: () => void
  goToReview: () => void
  goToReplay: (replayId: string) => void
  exitToMenu: () => void

  updateTime: (delta: number) => void
  generateTask: () => void
  selectTaskOption: (taskId: string, optionId: string) => void
  timeoutTask: (taskId: string) => void

  calculateStats: () => GameStats
  saveReplay: () => void

  updateSettings: (settings: Partial<GameSettings>) => void
  unlockNextLevel: () => void
  setReplayActionIndex: (index: number) => void
  playSound: (type: 'correct' | 'wrong' | 'urgent' | 'click' | 'complete') => void
  vibrate: (pattern: number | number[]) => void
}

const initialStats: GameStats = {
  score: 0,
  correctCount: 0,
  wrongCount: 0,
  totalTasks: 0,
  accuracy: 0,
  maxCombo: 0,
  averageResponseTime: 0,
  speedBonus: 0,
  comboBonus: 0,
  penalty: 0
}

const initialSettings: GameSettings = {
  soundEnabled: true,
  soundVolume: 0.5,
  animationEnabled: true,
  vibrationEnabled: true,
  musicEnabled: false,
  musicVolume: 0.3
}

const generateTaskOptions = (type: GameTask['type'], elderly: ElderlyProfile, correctAction: string): { options: TaskOption[], correctOptionId: string } => {
  const correctOption: TaskOption = {
    id: 'opt_correct',
    text: correctAction,
    icon: '✓',
    consequence: '正确的处理方式'
  }

  let wrongOptions: TaskOption[] = []

  if (type === 'medication_reminder') {
    wrongOptions = [
      { id: 'opt_wrong_1', text: '直接给药，不用核对', icon: '✗', consequence: '可能导致用药错误' },
      { id: 'opt_wrong_2', text: '跳过给药，等下次再说', icon: '✗', consequence: '延误治疗' },
      { id: 'opt_wrong_3', text: '加倍剂量补服', icon: '✗', consequence: '药物过量风险' }
    ]
  } else if (type === 'activity_checkin') {
    wrongOptions = [
      { id: 'opt_wrong_1', text: '不提醒，让老人自己决定', icon: '✗', consequence: '老人可能错过活动' },
      { id: 'opt_wrong_2', text: '催促老人快点', icon: '✗', consequence: '可能导致跌倒或情绪不稳' },
      { id: 'opt_wrong_3', text: '代替老人签到', icon: '✗', consequence: '记录不准确' }
    ]
  } else if (type === 'risk_event') {
    wrongOptions = [
      { id: 'opt_wrong_1', text: '忽略，继续其他工作', icon: '✗', consequence: '可能导致严重后果' },
      { id: 'opt_wrong_2', text: '自行处理，不报告', icon: '✗', consequence: '缺乏专业指导' },
      { id: 'opt_wrong_3', text: '惊慌失措，大声呼救', icon: '✗', consequence: '可能吓到其他老人' }
    ]
  } else {
    wrongOptions = [
      { id: 'opt_wrong_1', text: '凭记忆处理', icon: '✗', consequence: '可能遗漏重要信息' },
      { id: 'opt_wrong_2', text: '快速浏览即可', icon: '✗', consequence: '信息了解不全面' },
      { id: 'opt_wrong_3', text: '跳过档案查看', icon: '✗', consequence: '缺乏了解导致失误' }
    ]
  }

  const options = [correctOption, ...wrongOptions]
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]]
  }

  return { options, correctOptionId: 'opt_correct' }
}

const createTask = (
  type: GameTask['type'],
  elderly: ElderlyProfile,
  timestamp: number,
  difficulty: number,
  taskCounter: number
): GameTask => {
  let title = ''
  let description = ''
  let correctAction = ''
  let timeLimit = 20
  let points = 100

  if (type === 'medication_reminder') {
    const med = elderly.medications[Math.floor(Math.random() * elderly.medications.length)]
    title = `用药提醒 - ${elderly.name}`
    description = `${elderly.name} 的 ${med.name} ${med.dosage} 用药时间到了。`
    correctAction = `核对药物信息，确认 ${med.name} ${med.dosage}，观察老人状态后给药并记录`
    timeLimit = Math.max(10, 25 - difficulty * 2)
    points = 100 + difficulty * 20
  } else if (type === 'activity_checkin') {
    const act = activities[Math.floor(Math.random() * activities.length)]
    title = `活动签到 - ${elderly.name}`
    description = `${elderly.name} 应该参加 ${act.name}，请确认其状态。`
    correctAction = `查看 ${elderly.name} 的状态，询问是否参加 ${act.name}，给予适当协助`
    timeLimit = Math.max(8, 20 - difficulty * 2)
    points = 80 + difficulty * 15
  } else if (type === 'risk_event') {
    const risk = riskEvents.find(r => r.elderlyId === elderly.id) || riskEvents[0]
    title = `⚠️ 紧急事件 - ${elderly.name}`
    description = risk.description
    correctAction = risk.correctActions[Math.floor(Math.random() * risk.correctActions.length)]
    timeLimit = Math.max(5, risk.timeLimit - difficulty)
    points = 150 + difficulty * 30
  } else {
    title = `档案查看 - ${elderly.name}`
    description = `请查看 ${elderly.name} 的档案信息，了解其健康状况。`
    correctAction = `仔细查看 ${elderly.name} 的病史、用药和注意事项，确保信息准确`
    timeLimit = Math.max(15, 30 - difficulty * 2)
    points = 60 + difficulty * 10
  }

  const { options, correctOptionId } = generateTaskOptions(type, elderly, correctAction)

  return {
    id: `task_${Date.now()}_${taskCounter}`,
    type,
    title,
    description,
    elderlyId: elderly.id,
    timestamp,
    timeLimit,
    options,
    correctOptionId,
    points
  }
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      gameState: 'menu',
      currentLevel: null,
      currentElderly: [],
      activeTasks: [],
      completedTasks: [],
      timeRemaining: 0,
      score: 0,
      combo: 0,
      maxCombo: 0,
      actions: [],
      stats: initialStats,
      settings: initialSettings,
      levels: levelConfigs,
      replayRecords: [],
      selectedReplay: null,
      replayActionIndex: -1,
      taskCounter: 0,
      lastTaskTime: 0,

      setGameState: (state) => set({ gameState: state }),

      startGame: (levelId) => {
        const level = get().levels.find(l => l.id === levelId)
        if (!level || !level.unlocked) return

        const shuffledElderly = [...elderlyProfiles].sort(() => Math.random() - 0.5)
        const selectedElderly = shuffledElderly.slice(0, level.elderlyCount)

        set({
          gameState: 'playing',
          currentLevel: level,
          currentElderly: selectedElderly,
          activeTasks: [],
          completedTasks: [],
          timeRemaining: level.duration,
          score: 0,
          combo: 0,
          maxCombo: 0,
          actions: [],
          stats: initialStats,
          taskCounter: 0,
          lastTaskTime: 0,
          selectedReplay: null,
          replayActionIndex: -1
        })
      },

      pauseGame: () => {
        if (get().gameState === 'playing') {
          set({ gameState: 'paused' })
        }
      },

      resumeGame: () => {
        if (get().gameState === 'paused') {
          set({ gameState: 'playing' })
        }
      },

      endGame: () => {
        const state = get()
        const stats = state.calculateStats()
        set({
          gameState: 'review',
          stats,
          score: stats.score
        })
        state.saveReplay()
        state.unlockNextLevel()
      },

      restartGame: () => {
        const level = get().currentLevel
        if (level) {
          get().startGame(level.id)
        }
      },

      goToReview: () => set({ gameState: 'review' }),

      goToReplay: (replayId) => {
        const replay = get().replayRecords.find(r => r.id === replayId)
        if (replay) {
          set({
            selectedReplay: replay,
            replayActionIndex: -1,
            gameState: 'replay'
          })
        }
      },

      exitToMenu: () => set({
        gameState: 'menu',
        currentLevel: null,
        activeTasks: [],
        completedTasks: [],
        selectedReplay: null,
        replayActionIndex: -1
      }),

      updateTime: (delta) => {
        const state = get()
        if (state.gameState !== 'playing') return

        const newTimeRemaining = state.timeRemaining - delta
        if (newTimeRemaining <= 0) {
          state.endGame()
          return
        }

        const elapsedTime = (state.currentLevel?.duration || 0) - newTimeRemaining
        let newActiveTasks = [...state.activeTasks]
        let newScore = state.score
        let newCombo = state.combo
        let newActions = [...state.actions]
        let newMaxCombo = state.maxCombo

        const timedOutTasks = newActiveTasks.filter(task => {
          const taskElapsed = elapsedTime - task.timestamp
          return taskElapsed >= task.timeLimit
        })

        timedOutTasks.forEach(task => {
          const action: PlayerAction = {
            taskId: task.id,
            optionId: 'timeout',
            timestamp: elapsedTime,
            isCorrect: false,
            timeSpent: task.timeLimit,
            combo: 0
          }
          newActions.push(action)
          newScore = Math.max(0, newScore - task.points * 0.5)
          newCombo = 0
        })

        newActiveTasks = newActiveTasks.filter(task => {
          const taskElapsed = elapsedTime - task.timestamp
          return taskElapsed < task.timeLimit
        })

        if (elapsedTime - state.lastTaskTime >= (state.currentLevel?.taskFrequency || 10) &&
            newActiveTasks.length < (state.currentLevel?.maxConcurrentTasks || 3)) {
          state.generateTask()
        }

        set({
          timeRemaining: newTimeRemaining,
          activeTasks: newActiveTasks,
          score: newScore,
          combo: newCombo,
          maxCombo: newMaxCombo,
          actions: newActions
        })
      },

      generateTask: () => {
        const state = get()
        if (!state.currentLevel || state.currentElderly.length === 0) return

        const elapsedTime = (state.currentLevel.duration || 0) - state.timeRemaining
        const elderly = state.currentElderly[Math.floor(Math.random() * state.currentElderly.length)]

        const taskTypes: GameTask['type'][] = ['medication_reminder', 'activity_checkin', 'profile_review']
        if (state.currentLevel.difficulty >= 2) {
          taskTypes.push('risk_event')
        }
        if (state.currentLevel.difficulty >= 3) {
          taskTypes.push('risk_event')
        }

        const type = taskTypes[Math.floor(Math.random() * taskTypes.length)]
        const task = createTask(
          type,
          elderly,
          elapsedTime,
          state.currentLevel.difficulty,
          state.taskCounter
        )

        set(prev => ({
          activeTasks: [...prev.activeTasks, task],
          taskCounter: prev.taskCounter + 1,
          lastTaskTime: elapsedTime
        }))

        if (type === 'risk_event') {
          state.playSound('urgent')
          state.vibrate([100, 50, 100])
        }
      },

      selectTaskOption: (taskId, optionId) => {
        const state = get()
        const task = state.activeTasks.find(t => t.id === taskId)
        if (!task) return

        const elapsedTime = (state.currentLevel?.duration || 0) - state.timeRemaining
        const timeSpent = elapsedTime - task.timestamp
        const isCorrect = optionId === task.correctOptionId

        let newCombo = isCorrect ? state.combo + 1 : 0
        let pointsEarned = 0
        let speedBonus = 0
        let comboBonus = 0
        let penalty = 0

        if (isCorrect) {
          pointsEarned = task.points
          const speedRatio = Math.max(0, 1 - timeSpent / task.timeLimit)
          speedBonus = Math.floor(task.points * speedRatio * 0.5)
          comboBonus = Math.floor(task.points * 0.1 * Math.min(newCombo, 10))
          state.playSound('correct')
          state.vibrate(50)
        } else {
          penalty = Math.floor(task.points * 0.5)
          state.playSound('wrong')
          state.vibrate([100, 100])
        }

        const newScore = Math.max(0, state.score + pointsEarned + speedBonus + comboBonus - penalty)
        const newMaxCombo = Math.max(state.maxCombo, newCombo)

        const action: PlayerAction = {
          taskId,
          optionId,
          timestamp: elapsedTime,
          isCorrect,
          timeSpent,
          combo: newCombo
        }

        const newActiveTasks = state.activeTasks.filter(t => t.id !== taskId)
        const newCompletedTasks = [...state.completedTasks, task]

        set({
          activeTasks: newActiveTasks,
          completedTasks: newCompletedTasks,
          score: newScore,
          combo: newCombo,
          maxCombo: newMaxCombo,
          actions: [...state.actions, action]
        })

        if (newCompletedTasks.length > 0 && newCompletedTasks.length % 10 === 0) {
          state.playSound('complete')
        }
      },

      timeoutTask: (taskId) => {
        const state = get()
        const task = state.activeTasks.find(t => t.id === taskId)
        if (!task) return

        const elapsedTime = (state.currentLevel?.duration || 0) - state.timeRemaining
        const action: PlayerAction = {
          taskId,
          optionId: 'timeout',
          timestamp: elapsedTime,
          isCorrect: false,
          timeSpent: task.timeLimit,
          combo: 0
        }

        const penalty = Math.floor(task.points * 0.5)

        set(prev => ({
          activeTasks: prev.activeTasks.filter(t => t.id !== taskId),
          completedTasks: [...prev.completedTasks, task],
          score: Math.max(0, prev.score - penalty),
          combo: 0,
          actions: [...prev.actions, action]
        }))
      },

      calculateStats: () => {
        const state = get()
        const { actions, score, maxCombo } = state
        const totalTasks = actions.length
        const correctCount = actions.filter(a => a.isCorrect).length
        const wrongCount = totalTasks - correctCount
        const accuracy = totalTasks > 0 ? correctCount / totalTasks : 0
        const totalTime = actions.reduce((sum, a) => sum + a.timeSpent, 0)
        const averageResponseTime = totalTasks > 0 ? totalTime / totalTasks : 0

        let speedBonus = 0
        let comboBonus = 0
        let penalty = 0

        actions.forEach(action => {
          if (action.isCorrect) {
            const task = state.completedTasks.find(t => t.id === action.taskId)
            if (task) {
              const speedRatio = Math.max(0, 1 - action.timeSpent / task.timeLimit)
              speedBonus += Math.floor(task.points * speedRatio * 0.5)
              comboBonus += Math.floor(task.points * 0.1 * Math.min(action.combo, 10))
            }
          } else {
            const task = state.completedTasks.find(t => t.id === action.taskId)
            if (task) {
              penalty += Math.floor(task.points * 0.5)
            }
          }
        })

        return {
          score,
          correctCount,
          wrongCount,
          totalTasks,
          accuracy,
          maxCombo,
          averageResponseTime,
          speedBonus,
          comboBonus,
          penalty
        }
      },

      saveReplay: () => {
        const state = get()
        if (!state.currentLevel) return

        const stats = state.calculateStats()
        const replay: ReplayRecord = {
          id: `replay_${Date.now()}`,
          timestamp: Date.now(),
          levelId: state.currentLevel.id,
          score: stats.score,
          accuracy: stats.accuracy,
          combo: stats.maxCombo,
          actions: [...state.actions],
          completedTasks: [...state.completedTasks],
          finalStats: stats
        }

        const levelReplays = state.replayRecords.filter(r => r.levelId === state.currentLevel!.id)
        const otherReplays = state.replayRecords.filter(r => r.levelId !== state.currentLevel!.id)
        const newLevelReplays = [replay, ...levelReplays].slice(0, 3)

        set({
          replayRecords: [...otherReplays, ...newLevelReplays]
        })
      },

      updateSettings: (newSettings) => {
        set(state => ({
          settings: { ...state.settings, ...newSettings }
        }))
      },

      unlockNextLevel: () => {
        const state = get()
        if (!state.currentLevel) return

        const currentIndex = state.levels.findIndex(l => l.id === state.currentLevel!.id)
        if (currentIndex >= 0 && currentIndex < state.levels.length - 1) {
          const accuracy = state.stats.accuracy
          if (accuracy >= state.currentLevel.targetAccuracy) {
            set(state => ({
              levels: state.levels.map((l, i) =>
                i === currentIndex + 1 ? { ...l, unlocked: true } : l
              )
            }))
          }
        }
      },

      setReplayActionIndex: (index) => set({ replayActionIndex: index }),

      playSound: (type) => {
        const state = get()
        if (!state.settings.soundEnabled) return

        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()

          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)
          gainNode.gain.value = state.settings.soundVolume

          switch (type) {
            case 'correct':
              oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime)
              oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1)
              oscillator.start(audioContext.currentTime)
              oscillator.stop(audioContext.currentTime + 0.2)
              break
            case 'wrong':
              oscillator.frequency.setValueAtTime(200, audioContext.currentTime)
              oscillator.type = 'sawtooth'
              oscillator.start(audioContext.currentTime)
              oscillator.stop(audioContext.currentTime + 0.3)
              break
            case 'urgent':
              oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
              oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)
              oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2)
              oscillator.start(audioContext.currentTime)
              oscillator.stop(audioContext.currentTime + 0.3)
              break
            case 'click':
              oscillator.frequency.setValueAtTime(440, audioContext.currentTime)
              oscillator.start(audioContext.currentTime)
              oscillator.stop(audioContext.currentTime + 0.05)
              break
            case 'complete':
              oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime)
              oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.15)
              oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.3)
              oscillator.start(audioContext.currentTime)
              oscillator.stop(audioContext.currentTime + 0.5)
              break
          }
        } catch (e) {
          console.log('Audio not supported')
        }
      },

      vibrate: (pattern) => {
        const state = get()
        if (!state.settings.vibrationEnabled) return
        if ('vibrate' in navigator) {
          navigator.vibrate(pattern)
        }
      }
    }),
    {
      name: 'elder-care-game-storage',
      partialize: (state) => ({
        settings: state.settings,
        levels: state.levels,
        replayRecords: state.replayRecords
      })
    }
  )
)
