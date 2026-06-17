import { create } from 'zustand'

export const EQUIPMENT_TYPES = {
  TREADMILL: { id: 'treadmill', name: '跑步机', color: '#4A90D9', risk: 'low' },
  EXERCISE_BIKE: { id: 'exercise_bike', name: '功率自行车', color: '#50C878', risk: 'low' },
  DUMBBELL: { id: 'dumbbell', name: '哑铃组', color: '#FFA500', risk: 'medium' },
  PULLEY: { id: 'pulley', name: '滑轮训练器', color: '#9370DB', risk: 'medium' },
  PARALLEL_BARS: { id: 'parallel_bars', name: '双杠', color: '#DC143C', risk: 'high' },
  ULTRASOUND: { id: 'ultrasound', name: '超声波治疗仪', color: '#00CED1', risk: 'low' },
}

export const PATIENT_TYPES = {
  MILD: { id: 'mild', name: '轻症患者', color: '#90EE90', difficulty: 1 },
  MODERATE: { id: 'moderate', name: '中症患者', color: '#FFD700', difficulty: 2 },
  SEVERE: { id: 'severe', name: '重症患者', color: '#FF6347', difficulty: 3 },
}

const initialState = {
  phase: 'menu',
  currentLevel: 1,
  score: 0,
  combo: 0,
  maxCombo: 0,
  decisionTimeHistory: [],
  failedReplays: [],
  
  assessmentScore: null,
  prescription: null,
  calendarPlan: null,
  
  patients: [],
  equipment: [],
  scheduledPatients: [],
  timeElapsed: 0,
  timeLimit: 180,
  isPaused: false,
  
  insuranceWarning: null,
  gameResult: null,
  
  statistics: {
    totalGames: 0,
    totalCompleted: 0,
    completionRate: 0,
    levelStats: {},
    avgDecisionTime: 0,
    equipmentErrorReasons: {
      misallocation: 0,
      timingConflict: 0,
      riskMismatch: 0,
      overcapacity: 0,
    },
  },
  
  replayData: null,
}

export const useGameStore = create((set, get) => ({
  ...initialState,

  startGame: (level = 1) => {
    const state = get()
    set({
      phase: 'assessment',
      currentLevel: level,
      score: 0,
      combo: 0,
      maxCombo: 0,
      decisionTimeHistory: [],
      assessmentScore: null,
      prescription: null,
      calendarPlan: null,
      timeElapsed: 0,
      isPaused: false,
      insuranceWarning: null,
      gameResult: null,
      replayData: null,
    })
  },

  completeAssessment: (score) => {
    set({ assessmentScore: score, phase: 'prescription' })
  },

  setPrescription: (prescription) => {
    set({ prescription, phase: 'calendar' })
  },

  setCalendarPlan: (plan) => {
    set({ calendarPlan: plan, phase: 'gameplay' })
    get().initializeLevel()
  },

  initializeLevel: () => {
    const { currentLevel, prescription } = get()
    const patientCount = 3 + currentLevel * 2
    const equipmentCount = 3 + Math.floor(currentLevel / 2)
    
    const equipmentTypes = Object.values(EQUIPMENT_TYPES)
    const patientTypes = Object.values(PATIENT_TYPES)
    
    const equipment = []
    for (let i = 0; i < equipmentCount; i++) {
      const type = equipmentTypes[i % equipmentTypes.length]
      equipment.push({
        id: `eq-${i}`,
        type: type.id,
        name: `${type.name} ${i + 1}`,
        color: type.color,
        risk: type.risk,
        position: [
          (i % 3 - 1) * 4,
          0,
          Math.floor(i / 3) * 3 - 2,
        ],
        isOccupied: false,
        occupiedBy: null,
        usageTime: 0,
      })
    }
    
    const patients = []
    for (let i = 0; i < patientCount; i++) {
      const typeIndex = Math.min(
        Math.floor(Math.random() * (currentLevel + 1)),
        patientTypes.length - 1
      )
      const type = patientTypes[typeIndex]
      const needsEquipment = equipmentTypes[
        Math.floor(Math.random() * equipmentTypes.length)
      ]
      patients.push({
        id: `patient-${i}`,
        name: `患者 ${i + 1}`,
        type: type.id,
        color: type.color,
        difficulty: type.difficulty,
        requiredEquipment: needsEquipment.id,
        requiredDuration: 30 + Math.floor(Math.random() * 30),
        waitTime: 0,
        status: 'waiting',
        satisfaction: 100,
        insuranceRisk: Math.random() < 0.2 + currentLevel * 0.05,
        position: [
          (i % 4 - 1.5) * 2,
          0,
          -6 - Math.floor(i / 4) * 1.5,
        ],
      })
    }
    
    set({
      equipment,
      patients,
      scheduledPatients: [],
      timeLimit: 180 + currentLevel * 30,
    })
  },

  assignPatientToEquipment: (patientId, equipmentId) => {
    const state = get()
    const patient = state.patients.find(p => p.id === patientId)
    const equipment = state.equipment.find(e => e.id === equipmentId)
    
    if (!patient || !equipment || equipment.isOccupied) return false
    
    const isCorrectEquipment = patient.requiredEquipment === equipment.type
    const riskMismatch = equipment.risk === 'high' && patient.type === 'mild'
    
    let scoreGain = 10
    let decisionTime = 0
    
    if (!isCorrectEquipment) {
      scoreGain = -15
      set(state => ({
        statistics: {
          ...state.statistics,
          equipmentErrorReasons: {
            ...state.statistics.equipmentErrorReasons,
            misallocation: state.statistics.equipmentErrorReasons.misallocation + 1,
          },
        },
      }))
    }
    
    if (riskMismatch) {
      scoreGain -= 10
      set(state => ({
        statistics: {
          ...state.statistics,
          equipmentErrorReasons: {
            ...state.statistics.equipmentErrorReasons,
            riskMismatch: state.statistics.equipmentErrorReasons.riskMismatch + 1,
          },
        },
      }))
    }
    
    if (patient.insuranceRisk && Math.random() < 0.3) {
      set({ insuranceWarning: { patientId, equipmentId } })
      scoreGain -= 5
    }
    
    const newCombo = isCorrectEquipment ? state.combo + 1 : 0
    if (isCorrectEquipment) {
      scoreGain += Math.floor(newCombo * 2)
    }
    
    set(state => ({
      score: Math.max(0, state.score + scoreGain),
      combo: newCombo,
      maxCombo: Math.max(state.maxCombo, newCombo),
      patients: state.patients.map(p =>
        p.id === patientId ? { ...p, status: 'treatment' } : p
      ),
      equipment: state.equipment.map(e =>
        e.id === equipmentId
          ? { ...e, isOccupied: true, occupiedBy: patientId, usageTime: patient.requiredDuration }
          : e
      ),
      scheduledPatients: [
        ...state.scheduledPatients,
        { patientId, equipmentId, startTime: state.timeElapsed, result: scoreGain > 0 ? 'success' : 'fail' },
      ],
      decisionTimeHistory: [...state.decisionTimeHistory, decisionTime],
    }))
    
    return true
  },

  tick: (deltaTime) => {
    const state = get()
    if (state.phase !== 'gameplay' || state.isPaused) return
    
    const newTimeElapsed = state.timeElapsed + deltaTime
    
    const updatedEquipment = state.equipment.map(e => {
      if (e.isOccupied && e.usageTime > 0) {
        const newUsageTime = e.usageTime - deltaTime
        if (newUsageTime <= 0) {
          return { ...e, isOccupied: false, occupiedBy: null, usageTime: 0 }
        }
        return { ...e, usageTime: newUsageTime }
      }
      return e
    })
    
    const freedPatientIds = state.equipment
      .filter(e => e.isOccupied && e.usageTime > 0)
      .map(e => {
        const eq = updatedEquipment.find(ue => ue.id === e.id)
        return eq && !eq.isOccupied ? e.occupiedBy : null
      })
      .filter(Boolean)
    
    const updatedPatients = state.patients.map(p => {
      if (freedPatientIds.includes(p.id)) {
        return { ...p, status: 'completed' }
      }
      if (p.status === 'waiting') {
        return { ...p, waitTime: p.waitTime + deltaTime }
      }
      return p
    })
    
    if (newTimeElapsed >= state.timeLimit) {
      get().endGame('timeup')
      return
    }
    
    const allCompleted = updatedPatients.every(p => p.status === 'completed')
    if (allCompleted) {
      get().endGame('success')
      return
    }
    
    set({
      timeElapsed: newTimeElapsed,
      equipment: updatedEquipment,
      patients: updatedPatients,
    })
  },

  endGame: (result) => {
    const state = get()
    const completedCount = state.patients.filter(p => p.status === 'completed').length
    const totalCount = state.patients.length
    const completionRate = completedCount / totalCount
    
    const replayData = {
      timestamp: Date.now(),
      level: state.currentLevel,
      score: state.score,
      result,
      completionRate,
      patients: state.patients,
      equipment: state.equipment,
      scheduledPatients: state.scheduledPatients,
    }
    
    const levelKey = `level_${state.currentLevel}`
    
    set(state => {
      const newTotalGames = state.statistics.totalGames + 1
      const newTotalCompleted = state.statistics.totalCompleted + (result === 'success' ? 1 : 0)
      const prevLevelStat = state.statistics.levelStats[levelKey] || { plays: 0, wins: 0, bestScore: 0, avgCompletion: 0 }
      
      const newLevelStat = {
        plays: prevLevelStat.plays + 1,
        wins: prevLevelStat.wins + (result === 'success' ? 1 : 0),
        bestScore: Math.max(prevLevelStat.bestScore, state.score),
        avgCompletion: (prevLevelStat.avgCompletion * prevLevelStat.plays + completionRate) / (prevLevelStat.plays + 1),
      }
      
      return {
        phase: 'settlement',
        gameResult: result,
        replayData,
        statistics: {
          ...state.statistics,
          totalGames: newTotalGames,
          totalCompleted: newTotalCompleted,
          completionRate: newTotalCompleted / newTotalGames,
          levelStats: {
            ...state.statistics.levelStats,
            [levelKey]: newLevelStat,
          },
          avgDecisionTime: state.decisionTimeHistory.length > 0
            ? state.decisionTimeHistory.reduce((a, b) => a + b, 0) / state.decisionTimeHistory.length
            : state.statistics.avgDecisionTime,
        },
        failedReplays: result !== 'success'
          ? [replayData, ...state.failedReplays].slice(0, 5)
          : state.failedReplays,
      }
    })
  },

  setPhase: (phase) => set({ phase }),
  togglePause: () => set(state => ({ isPaused: !state.isPaused })),
  clearInsuranceWarning: () => set({ insuranceWarning: null }),
  
  goToMenu: () => set({ phase: 'menu' }),
  goToStatistics: () => set({ phase: 'statistics' }),
  goToReplay: (replayData) => set({ phase: 'replay', replayData }),
  
  resetGame: () => set(initialState),
}))
