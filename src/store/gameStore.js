import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const INITIAL_LEVELS = [
  { id: 1, name: '新手入门', duration: 90, taskCount: 5, unlocked: true },
  { id: 2, name: '基础训练', duration: 120, taskCount: 8, unlocked: false },
  { id: 3, name: '进阶挑战', duration: 150, taskCount: 12, unlocked: false },
  { id: 4, name: '专家模式', duration: 180, taskCount: 16, unlocked: false },
]

const useGameStore = create(
  persist(
    (set, get) => ({
      levels: INITIAL_LEVELS,
      currentLevel: null,
      gameState: 'idle',
      timeRemaining: 0,
      score: 0,
      tasks: [],
      currentTaskIndex: 0,
      mistakes: [],
      failureReasons: [],
      failureHistory: [],
      replayData: [],
      replayIndex: 0,
      isReplaying: false,
      completedFollowUpTasks: [],
      showNextTaskWarning: false,
      nextTaskWarningType: null,
      currentGameFollowUpCount: 0,
      statistics: {
        totalGames: 0,
        totalSuccess: 0,
        totalFailures: 0,
        totalFollowUps: 0,
        completedFollowUps: 0,
        memberProfileErrors: 0,
        prescriptionErrors: 0,
        pharmacistErrors: 0,
        batchExpiryErrors: 0,
        levelStats: {},
      },

      startGame: (levelId) => {
        const level = get().levels.find(l => l.id === levelId)
        if (!level) return
        const tasks = generateTasks(level.taskCount)
        const followUpCount = tasks.filter(t => t.requiresFollowUp).length
        const currentStats = get().statistics
        set({
          currentLevel: level,
          gameState: 'playing',
          timeRemaining: level.duration,
          score: 0,
          tasks,
          currentTaskIndex: 0,
          mistakes: [],
          failureReasons: [],
          replayData: [],
          replayIndex: 0,
          isReplaying: false,
          completedFollowUpTasks: [],
          showNextTaskWarning: false,
          nextTaskWarningType: null,
          currentGameFollowUpCount: followUpCount,
          statistics: {
            ...currentStats,
            totalFollowUps: currentStats.totalFollowUps + followUpCount,
          },
        })
      },

      completeFollowUp: (taskId) => {
        const { completedFollowUpTasks, statistics } = get()
        if (completedFollowUpTasks.includes(taskId)) return
        set({
          completedFollowUpTasks: [...completedFollowUpTasks, taskId],
          statistics: {
            ...statistics,
            completedFollowUps: statistics.completedFollowUps + 1,
          },
        })
      },

      triggerNextTaskWarning: (type) => {
        set({
          showNextTaskWarning: true,
          nextTaskWarningType: type,
        })
        setTimeout(() => {
          set({
            showNextTaskWarning: false,
            nextTaskWarningType: null,
          })
        }, 3000)
      },

      tickTime: () => {
        const { timeRemaining, gameState, endGame, tasks, currentTaskIndex } = get()
        if (gameState !== 'playing') return
        if (timeRemaining <= 1) {
          const reason = {
            type: 'timeout',
            task: tasks[currentTaskIndex],
            message: '超时未处理',
            timestamp: Date.now(),
          }
          set(s => ({
            failureReasons: [...s.failureReasons, reason],
          }))
          endGame('fail')
        } else {
          set(s => ({ timeRemaining: s.timeRemaining - 1 }))
        }
      },

      processTask: (taskId, decision, details) => {
        const { tasks, currentTaskIndex, score, replayData, statistics } = get()
        const task = tasks.find(t => t.id === taskId)
        if (!task) return

        const isCorrect = checkDecisionCorrectness(task, decision, details)
        const timestamp = Date.now()

        const replayStep = {
          task,
          decision,
          details,
          isCorrect,
          timestamp,
          timeRemaining: get().timeRemaining,
          score: isCorrect ? score + task.points : score,
        }

        let newMistakes = []
        let newFailureReasons = []
        let newStatistics = { ...statistics }
        let memberProfileErrors = 0
        let prescriptionErrors = 0
        let pharmacistErrors = 0
        let batchExpiryErrors = 0

        if (task.requiresFollowUp) {
          newStatistics = {
            ...newStatistics,
            totalFollowUps: newStatistics.totalFollowUps + 1,
          }
        }

        if (!isCorrect) {
          const mistake = {
            task,
            decision,
            details,
            expected: getExpectedDecision(task),
            timestamp,
          }
          newMistakes = [mistake]

          const reason = {
            type: task.type,
            task,
            message: getErrorMessage(task, decision, details),
            timestamp,
          }
          newFailureReasons = [reason]

          if (task.type === 'prescription') {
            if (details?.memberInfoMismatch) memberProfileErrors++
            else prescriptionErrors++
          } else if (task.type === 'pharmacist') {
            pharmacistErrors++
          } else if (task.type === 'batch') {
            if (details?.memberInfoMismatch) memberProfileErrors++
            else batchExpiryErrors++
          }

          newStatistics = {
            ...newStatistics,
            prescriptionErrors: newStatistics.prescriptionErrors + prescriptionErrors,
            pharmacistErrors: newStatistics.pharmacistErrors + pharmacistErrors,
            batchExpiryErrors: newStatistics.batchExpiryErrors + batchExpiryErrors,
            memberProfileErrors: newStatistics.memberProfileErrors + memberProfileErrors,
          }
        }

        set(s => ({
          score: isCorrect ? s.score + task.points : s.score,
          currentTaskIndex: s.currentTaskIndex + 1,
          mistakes: [...s.mistakes, ...newMistakes],
          failureReasons: [...s.failureReasons, ...newFailureReasons],
          replayData: [...s.replayData, replayStep],
          statistics: newStatistics,
        }))

        if (get().currentTaskIndex >= tasks.length) {
          get().endGame(isCorrect || get().mistakes.length < 3 ? 'win' : 'fail')
        }

        if (!isCorrect && get().mistakes.length >= 3) {
          get().endGame('fail')
        }
      },

      endGame: (result) => {
        const { currentLevel, score, mistakes, replayData, statistics, failureHistory, tasks, completedFollowUpTasks } = get()
        const isWin = result === 'win'
        const followUps = tasks.filter(t => t.requiresFollowUp)
        const playerCompletedFollowUps = completedFollowUpTasks.length

        const newFailureHistory = isWin
          ? failureHistory
          : [
              {
                id: Date.now(),
                level: currentLevel,
                timestamp: Date.now(),
                score,
                mistakes,
                replayData,
                failureReasons: get().failureReasons,
                completedFollowUps: playerCompletedFollowUps,
                totalFollowUps: followUps.length,
              },
              ...failureHistory,
            ].slice(0, 10)

        const newLevelStats = { ...statistics.levelStats }
        const levelKey = `level_${currentLevel?.id || 0}`
        const prevStats = newLevelStats[levelKey] || { games: 0, wins: 0, bestScore: 0, avgFollowUps: 0 }

        newLevelStats[levelKey] = {
          games: prevStats.games + 1,
          wins: prevStats.wins + (isWin ? 1 : 0),
          bestScore: Math.max(prevStats.bestScore, score),
          avgFollowUps: Math.round((prevStats.avgFollowUps * prevStats.games + playerCompletedFollowUps) / (prevStats.games + 1)),
        }

        let newLevels = get().levels
        if (isWin && currentLevel) {
          newLevels = get().levels.map(l => {
            if (l.id === currentLevel.id + 1) return { ...l, unlocked: true }
            return l
          })
        }

        set({
          gameState: result,
          levels: newLevels,
          failureHistory: newFailureHistory,
          currentGameFollowUpCount: 0,
          statistics: {
            ...statistics,
            totalGames: statistics.totalGames + 1,
            totalSuccess: statistics.totalSuccess + (isWin ? 1 : 0),
            totalFailures: statistics.totalFailures + (isWin ? 0 : 1),
            levelStats: newLevelStats,
          },
        })
      },

      resetGame: () => {
        const { currentGameFollowUpCount, statistics, gameState } = get()
        const isGameInProgress = gameState === 'playing'
        set({
          gameState: 'idle',
          currentLevel: null,
          timeRemaining: 0,
          score: 0,
          tasks: [],
          currentTaskIndex: 0,
          mistakes: [],
          failureReasons: [],
          replayData: [],
          completedFollowUpTasks: [],
          showNextTaskWarning: false,
          nextTaskWarningType: null,
          currentGameFollowUpCount: 0,
          statistics: isGameInProgress && currentGameFollowUpCount > 0
            ? {
                ...statistics,
                totalFollowUps: Math.max(0, statistics.totalFollowUps - currentGameFollowUpCount),
              }
            : statistics,
        })
      },

      startReplay: (failureId) => {
        const failure = get().failureHistory.find(f => f.id === failureId)
        if (!failure) return
        set({
          isReplaying: true,
          replayData: failure.replayData,
          replayIndex: 0,
          currentLevel: failure.level,
        })
      },

      nextReplayStep: () => {
        const { replayData, replayIndex } = get()
        if (replayIndex < replayData.length - 1) {
          set(s => ({ replayIndex: s.replayIndex + 1 }))
        }
      },

      prevReplayStep: () => {
        const { replayIndex } = get()
        if (replayIndex > 0) {
          set(s => ({ replayIndex: s.replayIndex - 1 }))
        }
      },

      stopReplay: () => set({
        isReplaying: false,
        replayIndex: 0,
      }),

      clearFailureHistory: () => set({ failureHistory: [] }),
    }),
    {
      name: 'pharmacy-game-storage',
      partialize: (state) => ({
        levels: state.levels,
        failureHistory: state.failureHistory,
        statistics: state.statistics,
      }),
    }
  )
)

function generateTasks(count) {
  const taskTypes = ['prescription', 'pharmacist', 'batch']
  const diseases = ['高血压', '糖尿病', '冠心病', '哮喘', '高血脂']
  const medicines = ['硝苯地平', '二甲双胍', '阿托伐他汀', '阿司匹林', '布地奈德']
  const memberNames = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十']

  const tasks = []
  for (let i = 0; i < count; i++) {
    const type = taskTypes[i % taskTypes.length]
    const disease = diseases[Math.floor(Math.random() * diseases.length)]
    const medicine = medicines[Math.floor(Math.random() * medicines.length)]
    const member = memberNames[Math.floor(Math.random() * memberNames.length)]
    const hasProblem = Math.random() > 0.5
    const clarity = hasProblem ? Math.random() * 0.3 + 0.1 : Math.random() * 0.3 + 0.7

    const baseTask = {
      id: i + 1,
      type,
      disease,
      medicine,
      member,
      memberId: 'M' + String(1000 + Math.floor(Math.random() * 9000)),
      age: 40 + Math.floor(Math.random() * 40),
      points: 10 + Math.floor(Math.random() * 20),
      requiresFollowUp: Math.random() > 0.4,
      warningBeforeAppear: i > 0 && Math.random() > 0.5,
    }

    if (type === 'prescription') {
      const correctDose = ['5mg', '10mg', '20mg', '50mg', '100mg'][Math.floor(Math.random() * 5)]
      tasks.push({
        ...baseTask,
        imageClarity: clarity,
        isBlurry: clarity < 0.4,
        prescriptionDose: hasProblem ? (Math.random() > 0.5 ? '剂量不符' : '用药频次错误') : correctDose,
        correctDose,
        memberInfoMismatch: hasProblem && Math.random() > 0.6,
      })
    } else if (type === 'pharmacist') {
      tasks.push({
        ...baseTask,
        pharmacistOpinion: hasProblem
          ? (Math.random() > 0.5 ? '建议调整剂量' : '存在药物相互作用风险')
          : '审核通过，无异常',
        hasConflict: hasProblem,
      })
    } else {
      const today = new Date()
      const validDate = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate())
      const expiryDate = hasProblem
        ? new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
        : validDate
      tasks.push({
        ...baseTask,
        batchNumber: 'B' + String(10000 + Math.floor(Math.random() * 90000)),
        expiryDate: expiryDate.toISOString().split('T')[0],
        isExpired: hasProblem,
        correctBatch: 'B' + String(20000 + Math.floor(Math.random() * 90000)),
        memberInfoMismatch: hasProblem && Math.random() > 0.7,
      })
    }
  }
  return tasks
}

function checkDecisionCorrectness(task, decision, details) {
  if (task.type === 'prescription') {
    const hasIssue = task.isBlurry || task.prescriptionDose !== task.correctDose || task.memberInfoMismatch
    if (hasIssue) return decision === 'reject' || (decision === 'escalate' && task.isBlurry)
    return decision === 'approve'
  }
  if (task.type === 'pharmacist') {
    if (task.hasConflict) return decision === 'escalate'
    return decision === 'approve'
  }
  if (task.type === 'batch') {
    const hasIssue = task.isExpired || task.memberInfoMismatch
    if (hasIssue) return decision === 'reject'
    return decision === 'approve'
  }
  return false
}

function getExpectedDecision(task) {
  if (task.type === 'prescription') {
    const hasIssue = task.isBlurry || task.prescriptionDose !== task.correctDose || task.memberInfoMismatch
    if (hasIssue) return task.isBlurry ? 'escalate' : 'reject'
    return 'approve'
  }
  if (task.type === 'pharmacist') {
    return task.hasConflict ? 'escalate' : 'approve'
  }
  if (task.type === 'batch') {
    const hasIssue = task.isExpired || task.memberInfoMismatch
    return hasIssue ? 'reject' : 'approve'
  }
  return 'approve'
}

function getErrorMessage(task, decision, details) {
  if (task.type === 'prescription') {
    if (task.memberInfoMismatch) return `会员档案信息不匹配：${task.member} 的 ${task.disease} 记录有误`
    if (task.isBlurry && decision !== 'escalate') return '处方照片不清晰，应升级处理而非直接决定'
    if (task.prescriptionDose !== task.correctDose) return `处方剂量错误：应为 ${task.correctDose}`
    if (decision === 'reject' || decision === 'escalate') return '处方正常，不应拒绝或升级'
  }
  if (task.type === 'pharmacist') {
    if (task.hasConflict && decision !== 'escalate') return '药师指出存在问题，应升级处理'
    if (!task.hasConflict && decision !== 'approve') return '药师审核通过，不应拒绝或升级'
  }
  if (task.type === 'batch') {
    if (task.memberInfoMismatch) return `会员档案不匹配：${task.member} 的用药记录与批号 ${task.batchNumber} 不符`
    if (task.isExpired) return `药品已过期：效期 ${task.expiryDate}`
    if (!task.isExpired && decision === 'reject') return '批号效期正常，不应拒绝'
  }
  return '处理决策错误'
}

export default useGameStore
