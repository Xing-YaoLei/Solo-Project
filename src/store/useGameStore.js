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
  initialLevelPatients: [],
  initialLevelEquipment: [],
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
    totalMisallocations: 0,
    equipmentErrorReasons: {
      misallocation: 0,
      timingConflict: 0,
      riskMismatch: 0,
      overcapacity: 0,
    },
  },
  
  replayData: null,
  replayTime: 0,
  isReplayPlaying: false,
  replaySpeed: 1,
}

let replayIntervalId = null

export const useGameStore = create((set, get) => ({
  ...initialState,

  startGame: (level = 1) => {
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
      scheduledPatients: [],
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
    
    const allEquipmentTypes = Object.values(EQUIPMENT_TYPES)
    const allPatientTypes = Object.values(PATIENT_TYPES)
    
    const equipment = []
    const availableEquipmentTypes = []
    
    for (let i = 0; i < equipmentCount; i++) {
      const typeIndex = i % allEquipmentTypes.length
      const type = allEquipmentTypes[typeIndex]
      
      if (!availableEquipmentTypes.find(t => t.id === type.id)) {
        availableEquipmentTypes.push(type)
      }
      
      const col = i % 3
      const row = Math.floor(i / 3)
      
      equipment.push({
        id: `eq-${i}`,
        type: type.id,
        name: `${type.name} ${Math.floor(i / allEquipmentTypes.length) + 1}`,
        color: type.color,
        risk: type.risk,
        position: [
          (col - 1) * 4,
          0,
          row * 3 - 2,
        ],
        isOccupied: false,
        occupiedBy: null,
        usageTime: 0,
        totalUsedTime: 0,
      })
    }
    
    const equipmentTypesInLevel = [...new Set(equipment.map(e => e.type))]
    const availableEquipmentForLevel = availableEquipmentTypes.filter(
      eq => equipmentTypesInLevel.includes(eq.id)
    )
    
    const patients = []
    for (let i = 0; i < patientCount; i++) {
      const typeIndex = Math.min(
        Math.floor(Math.random() * Math.min(currentLevel + 1, allPatientTypes.length)),
        allPatientTypes.length - 1
      )
      const type = allPatientTypes[typeIndex]
      
      const needsEquipment = availableEquipmentForLevel[
        Math.floor(Math.random() * availableEquipmentForLevel.length)
      ]
      
      const col = i % 4
      const row = Math.floor(i / 4)
      
      patients.push({
        id: `patient-${i}`,
        name: `患者 ${i + 1}`,
        type: type.id,
        color: type.color,
        difficulty: type.difficulty,
        requiredEquipment: needsEquipment.id,
        requiredDuration: 25 + Math.floor(Math.random() * 25),
        waitTime: 0,
        status: 'waiting',
        satisfaction: 100,
        insuranceRisk: Math.random() < 0.15 + currentLevel * 0.03,
        misallocatedCount: 0,
        position: [
          (col - 1.5) * 2.2,
          0,
          -6 - row * 1.8,
        ],
        targetEquipmentPosition: null,
      })
    }
    
    set({
      equipment,
      patients,
      scheduledPatients: [],
      initialLevelPatients: patients.map(p => ({ ...p })),
      initialLevelEquipment: equipment.map(e => ({ ...e })),
      timeLimit: 150 + currentLevel * 30,
    })
  },

  assignPatientToEquipment: (patientId, equipmentId) => {
    const state = get()
    const patient = state.patients.find(p => p.id === patientId)
    const equipment = state.equipment.find(e => e.id === equipmentId)
    
    if (!patient || !equipment) return false
    if (patient.status !== 'waiting') return false
    
    if (equipment.isOccupied) {
      set(state => ({
        scheduledPatients: [
          ...state.scheduledPatients,
          {
            patientId,
            equipmentId,
            startTime: state.timeElapsed,
            duration: 0,
            type: 'assign',
            success: false,
            errorType: 'timingConflict',
          },
        ],
        statistics: {
          ...state.statistics,
          totalMisallocations: state.statistics.totalMisallocations + 1,
          equipmentErrorReasons: {
            ...state.statistics.equipmentErrorReasons,
            timingConflict: state.statistics.equipmentErrorReasons.timingConflict + 1,
          },
        },
      }))
      return false
    }
    
    const isCorrectEquipment = patient.requiredEquipment === equipment.type
    const riskMismatch = equipment.risk === 'high' && patient.type === 'mild'
    
    if (!isCorrectEquipment) {
      set(state => ({
        score: Math.max(0, state.score - 10),
        combo: 0,
        patients: state.patients.map(p =>
          p.id === patientId ? { ...p, misallocatedCount: (p.misallocatedCount || 0) + 1 } : p
        ),
        scheduledPatients: [
          ...state.scheduledPatients,
          {
            patientId,
            equipmentId,
            startTime: state.timeElapsed,
            duration: 0,
            type: 'assign',
            success: false,
            errorType: 'misallocation',
          },
        ],
        statistics: {
          ...state.statistics,
          totalMisallocations: state.statistics.totalMisallocations + 1,
          equipmentErrorReasons: {
            ...state.statistics.equipmentErrorReasons,
            misallocation: state.statistics.equipmentErrorReasons.misallocation + 1,
          },
        },
      }))
      return false
    }
    
    if (riskMismatch) {
      set(state => ({
        scheduledPatients: [
          ...state.scheduledPatients,
          {
            patientId,
            equipmentId,
            startTime: state.timeElapsed,
            duration: 0,
            type: 'assign',
            success: false,
            errorType: 'riskMismatch',
          },
        ],
        statistics: {
          ...state.statistics,
          totalMisallocations: state.statistics.totalMisallocations + 1,
          equipmentErrorReasons: {
            ...state.statistics.equipmentErrorReasons,
            riskMismatch: state.statistics.equipmentErrorReasons.riskMismatch + 1,
          },
        },
      }))
    }
    
    if (patient.insuranceRisk && Math.random() < 0.25) {
      set({ insuranceWarning: { patientId, equipmentId, time: state.timeElapsed } })
    }
    
    const newCombo = state.combo + 1
    let scoreGain = 10 + Math.floor(newCombo * 1.5)
    
    set(state => ({
      score: state.score + scoreGain,
      combo: newCombo,
      maxCombo: Math.max(state.maxCombo, newCombo),
      patients: state.patients.map(p =>
        p.id === patientId ? { ...p, status: 'treatment' } : p
      ),
      equipment: state.equipment.map(e =>
        e.id === equipmentId
          ? { ...e, isOccupied: true, occupiedBy: patientId, usageTime: patient.requiredDuration, totalUsedTime: e.totalUsedTime + patient.requiredDuration }
          : e
      ),
      scheduledPatients: [
        ...state.scheduledPatients,
        {
          patientId,
          equipmentId,
          startTime: state.timeElapsed,
          duration: patient.requiredDuration,
          type: 'assign',
          success: true,
        },
      ],
      decisionTimeHistory: [...state.decisionTimeHistory, 0],
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
    const isWin = result === 'success'
    
    const gameErrorReasons = {
      misallocation: 0,
      timingConflict: 0,
      riskMismatch: 0,
      overcapacity: 0,
    }
    state.scheduledPatients.forEach(s => {
      if (!s.success && s.errorType && gameErrorReasons.hasOwnProperty(s.errorType)) {
        gameErrorReasons[s.errorType]++
      }
    })
    
    const replayData = {
      timestamp: Date.now(),
      level: state.currentLevel,
      score: state.score,
      result,
      isWin,
      completionRate,
      completedCount,
      totalCount,
      maxCombo: state.maxCombo,
      totalMisallocations: state.scheduledPatients.filter(s => !s.success).length,
      gameErrorReasons,
      timeLimit: state.timeLimit,
      initialPatients: state.initialLevelPatients.map(p => ({ ...p })),
      initialEquipment: state.initialLevelEquipment.map(e => ({ ...e })),
      events: state.scheduledPatients.map(s => ({ ...s })),
      finalPatients: state.patients.map(p => ({ ...p })),
      finalEquipment: state.equipment.map(e => ({ ...e })),
    }
    
    const levelKey = `level_${state.currentLevel}`
    
    set(state => {
      const newTotalGames = state.statistics.totalGames + 1
      const newTotalCompleted = state.statistics.totalCompleted + (isWin ? 1 : 0)
      const prevLevelStat = state.statistics.levelStats[levelKey] || { 
        plays: 0, 
        wins: 0, 
        bestScore: 0, 
        avgCompletion: 0,
        avgScore: 0,
        totalScore: 0,
      }
      
      const newLevelStat = {
        plays: prevLevelStat.plays + 1,
        wins: prevLevelStat.wins + (isWin ? 1 : 0),
        bestScore: Math.max(prevLevelStat.bestScore, state.score),
        totalScore: prevLevelStat.totalScore + state.score,
        avgScore: (prevLevelStat.totalScore + state.score) / (prevLevelStat.plays + 1),
        avgCompletion: (prevLevelStat.avgCompletion * prevLevelStat.plays + completionRate) / (prevLevelStat.plays + 1),
        winRate: (prevLevelStat.wins + (isWin ? 1 : 0)) / (prevLevelStat.plays + 1),
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
        failedReplays: !isWin
          ? [replayData, ...state.failedReplays].slice(0, 5)
          : state.failedReplays,
      }
    })
  },

  setReplayTime: (time) => set({ replayTime: time }),
  
  setReplayPlaying: (playing) => {
    const state = get()
    
    if (playing && state.replayData) {
      if (replayIntervalId) {
        clearInterval(replayIntervalId)
      }
      
      const intervalMs = 50
      
      replayIntervalId = setInterval(() => {
        const currentState = get()
        if (!currentState.isReplayPlaying || !currentState.replayData) {
          clearInterval(replayIntervalId)
          replayIntervalId = null
          return
        }
        
        const delta = intervalMs / 1000
        const newTime = currentState.replayTime + delta * currentState.replaySpeed
        
        if (newTime >= currentState.replayData.timeLimit) {
          set({ 
            replayTime: currentState.replayData.timeLimit, 
            isReplayPlaying: false 
          })
          clearInterval(replayIntervalId)
          replayIntervalId = null
          return
        }
        
        set({ replayTime: newTime })
      }, intervalMs)
      
      set({ isReplayPlaying: true })
    } else {
      if (replayIntervalId) {
        clearInterval(replayIntervalId)
        replayIntervalId = null
      }
      set({ isReplayPlaying: false })
    }
  },
  
  setReplaySpeed: (speed) => set({ replaySpeed: speed }),
  
  getReplayStateAtTime: (time) => {
    const { replayData } = get()
    if (!replayData) return null
    
    const patients = replayData.initialPatients.map(p => ({ 
      ...p, 
      targetEquipmentPosition: null,
      isAttemptingWrong: false,
      wrongAttemptEndTime: null,
    }))
    const equipment = replayData.initialEquipment.map(e => ({ ...e }))
    
    const allEventsBeforeTime = replayData.events
      .filter(e => e.startTime <= time)
      .sort((a, b) => a.startTime - b.startTime)
    
    const successEvents = allEventsBeforeTime.filter(e => e.type === 'assign' && e.success)
    const errorEvents = allEventsBeforeTime.filter(e => e.type === 'assign' && !e.success)
    
    successEvents.forEach(event => {
      const patient = patients.find(p => p.id === event.patientId)
      const eq = equipment.find(e => e.id === event.equipmentId)
      
      if (patient && eq) {
        const endTime = event.startTime + event.duration
        
        if (patient.lastSuccessfulAssignment) {
          const prevEnd = patient.lastSuccessfulAssignment.startTime + patient.lastSuccessfulAssignment.duration
          if (time < prevEnd) return
        }
        
        if (time < endTime) {
          patient.status = 'treatment'
          patient.targetEquipmentPosition = [eq.position[0], 0, eq.position[2] + 1]
          eq.isOccupied = true
          eq.occupiedBy = patient.id
          eq.usageTime = endTime - time
        } else {
          patient.status = 'completed'
          patient.targetEquipmentPosition = [eq.position[0] * 0.3, 0, 8]
          eq.isOccupied = false
          eq.occupiedBy = null
          eq.usageTime = 0
        }
        patient.lastSuccessfulAssignment = event
      }
    })
    
    errorEvents.forEach(event => {
      const patient = patients.find(p => p.id === event.patientId)
      const eq = equipment.find(e => e.id === event.equipmentId)
      
      if (patient && eq) {
        const wrongEndTime = event.startTime + 2
        
        if (time >= event.startTime && time < wrongEndTime && !patient.lastSuccessfulAssignment) {
          patient.isAttemptingWrong = true
          patient.wrongAttemptEndTime = wrongEndTime
          patient.targetEquipmentPosition = [eq.position[0], 0, eq.position[2] + 1]
        } else if (time >= wrongEndTime && !patient.lastSuccessfulAssignment) {
          patient.isAttemptingWrong = false
          patient.targetEquipmentPosition = null
        }
      }
    })
    
    const waitingPatientList = patients.filter(p => p.status === 'waiting')
    waitingPatientList.forEach((p, idx) => {
      if (!p.targetEquipmentPosition && !p.isAttemptingWrong) {
        const col = idx % 4
        const row = Math.floor(idx / 4)
        p.targetEquipmentPosition = [
          (col - 1.5) * 2.2,
          0,
          -6 - row * 1.8,
        ]
      }
    })
    
    patients.forEach(p => {
      if (p.status === 'waiting' && !p.isAttemptingWrong) {
        p.waitTime = time
      }
    })
    
    const eventsForTimeline = replayData.events
      .filter(e => e.startTime <= time)
      .sort((a, b) => a.startTime - b.startTime)
    
    return { 
      patients, 
      equipment, 
      eventsBeforeTime: eventsForTimeline,
      successEvents: successEvents.length,
      errorEvents: errorEvents.length,
    }
  },

  setPhase: (phase) => set({ phase }),
  togglePause: () => set(state => ({ isPaused: !state.isPaused })),
  clearInsuranceWarning: () => set({ insuranceWarning: null }),
  
  goToMenu: () => set({ phase: 'menu' }),
  goToStatistics: () => set({ phase: 'statistics' }),
  goToReplay: (replayData) => {
    if (replayIntervalId) {
      clearInterval(replayIntervalId)
      replayIntervalId = null
    }
    set({ 
      phase: 'replay', 
      replayData,
      replayTime: 0,
      isReplayPlaying: false,
      replaySpeed: 1,
    })
  },
  
  resetGame: () => set(initialState),
}))

if (typeof window !== 'undefined') {
  window.__gameStore = useGameStore
}
