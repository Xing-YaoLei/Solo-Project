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
  assessmentTime: null,
  assessmentAnswers: null,
  prescription: null,
  prescriptionTime: null,
  calendarPlan: null,
  calendarTime: null,
  
  lastAssignmentTime: 0,
  
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
      assessmentTime: null,
      assessmentAnswers: null,
      prescription: null,
      prescriptionTime: null,
      calendarPlan: null,
      calendarTime: null,
      lastAssignmentTime: 0,
      timeElapsed: 0,
      isPaused: false,
      insuranceWarning: null,
      gameResult: null,
      replayData: null,
      scheduledPatients: [],
    })
  },

  completeAssessment: (score, timeTaken, answers) => {
    set({ 
      assessmentScore: score, 
      assessmentTime: timeTaken,
      assessmentAnswers: answers,
      phase: 'prescription',
      decisionTimeHistory: [
        ...get().decisionTimeHistory,
        { phase: 'assessment', time: timeTaken, score },
      ],
    })
  },

  setPrescription: (prescription, timeTaken) => {
    set({ 
      prescription, 
      prescriptionTime: timeTaken,
      phase: 'calendar',
      decisionTimeHistory: [
        ...get().decisionTimeHistory,
        { phase: 'prescription', time: timeTaken, prescriptionId: prescription.id },
      ],
    })
  },

  setCalendarPlan: (plan, timeTaken) => {
    const state = get()
    set({ 
      calendarPlan: plan, 
      calendarTime: timeTaken,
      phase: 'gameplay',
      lastAssignmentTime: 0,
      decisionTimeHistory: [
        ...state.decisionTimeHistory,
        { phase: 'calendar', time: timeTaken, totalSlots: plan.totalSlots },
      ],
    })
    get().initializeLevel()
  },

  initializeLevel: () => {
    const { currentLevel, prescription, assessmentScore, calendarPlan } = get()
    
    // 根据评估分数调整难度
    const scoreMultiplier = assessmentScore ? (assessmentScore / 10) : 1
    const basePatientCount = 3 + currentLevel * 2
    const patientCount = Math.round(basePatientCount * (0.8 + scoreMultiplier * 0.4))
    
    const baseEquipmentCount = 3 + Math.floor(currentLevel / 2)
    const equipmentCount = baseEquipmentCount
    
    // 根据处方调整时间限制
    let timeLimit = 180
    if (prescription) {
      const durationMap = {
        strength: 150,
        cardio: 180,
        mobility: 170,
        physical: 160,
      }
      timeLimit = durationMap[prescription.id] || 180
    }
    
    // 根据日历计划调整时间限制
    if (calendarPlan) {
      const slots = calendarPlan.totalSlots
      if (slots < 3) {
        timeLimit = Math.max(120, timeLimit - 30)
      } else if (slots > 6) {
        timeLimit = timeLimit + 20
      }
    }
    
    const allEquipmentTypes = Object.values(EQUIPMENT_TYPES)
    const allPatientTypes = Object.values(PATIENT_TYPES)
    
    // 根据处方优先选择相关器械
    let equipmentTypePool = [...allEquipmentTypes]
    if (prescription && prescription.equipment) {
      const preferredTypes = prescription.equipment
      const otherTypes = allEquipmentTypes.filter(e => !preferredTypes.includes(e.id))
      equipmentTypePool = [
        ...preferredTypes.map(id => allEquipmentTypes.find(e => e.id === id)),
        ...preferredTypes.map(id => allEquipmentTypes.find(e => e.id === id)),
        ...otherTypes,
      ].filter(Boolean)
    }
    
    const equipment = []
    const availableEquipmentTypes = []
    
    for (let i = 0; i < equipmentCount; i++) {
      const typeIndex = i % equipmentTypePool.length
      const type = equipmentTypePool[typeIndex]
      
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
    
    // 根据评估分数调整患者难度权重
    let patientTypeWeights = [0.6, 0.3, 0.1]
    if (assessmentScore) {
      if (assessmentScore <= 8) {
        patientTypeWeights = [0.7, 0.25, 0.05]
      } else if (assessmentScore <= 14) {
        patientTypeWeights = [0.4, 0.4, 0.2]
      } else {
        patientTypeWeights = [0.2, 0.4, 0.4]
      }
    }
    
    // 根据处方优先选择相关的需求器械
    let patientNeedsPool = [...availableEquipmentForLevel]
    if (prescription && prescription.equipment) {
      const preferredEquipment = availableEquipmentForLevel.filter(e => 
        prescription.equipment.includes(e.id)
      )
      const otherEquipment = availableEquipmentForLevel.filter(e => 
        !prescription.equipment.includes(e.id)
      )
      patientNeedsPool = [
        ...preferredEquipment,
        ...preferredEquipment,
        ...otherEquipment,
      ]
    }
    
    const patients = []
    for (let i = 0; i < patientCount; i++) {
      const rand = Math.random()
      let typeIndex = 0
      let cumulative = 0
      for (let j = 0; j < patientTypeWeights.length; j++) {
        cumulative += patientTypeWeights[j]
        if (rand < cumulative) {
          typeIndex = j
          break
        }
      }
      const type = allPatientTypes[Math.min(typeIndex, allPatientTypes.length - 1)]
      
      const needsEquipment = patientNeedsPool[
        Math.floor(Math.random() * patientNeedsPool.length)
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
      timeLimit,
    })
  },

  assignPatientToEquipment: (patientId, equipmentId) => {
    const state = get()
    const patient = state.patients.find(p => p.id === patientId)
    const equipment = state.equipment.find(e => e.id === equipmentId)
    
    if (!patient || !equipment) return false
    if (patient.status !== 'waiting') return false
    
    const decisionTime = state.timeElapsed - state.lastAssignmentTime
    
    if (equipment.isOccupied) {
      set(state => ({
        lastAssignmentTime: state.timeElapsed,
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
        decisionTimeHistory: [
          ...state.decisionTimeHistory,
          { phase: 'dispatch', time: decisionTime, success: false, errorType: 'timingConflict' },
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
        lastAssignmentTime: state.timeElapsed,
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
        decisionTimeHistory: [
          ...state.decisionTimeHistory,
          { phase: 'dispatch', time: decisionTime, success: false, errorType: 'misallocation' },
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
        lastAssignmentTime: state.timeElapsed,
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
            errorType: 'riskMismatch',
          },
        ],
        decisionTimeHistory: [
          ...state.decisionTimeHistory,
          { phase: 'dispatch', time: decisionTime, success: false, errorType: 'riskMismatch' },
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
      return false
    }
    
    if (patient.insuranceRisk && Math.random() < 0.25) {
      set({ insuranceWarning: { patientId, equipmentId, time: state.timeElapsed } })
    }
    
    const newCombo = state.combo + 1
    let scoreGain = 10 + Math.floor(newCombo * 1.5)
    
    set(state => ({
      lastAssignmentTime: state.timeElapsed,
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
      decisionTimeHistory: [
        ...state.decisionTimeHistory,
        { phase: 'dispatch', time: decisionTime, success: true },
      ],
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
      
      const dispatchTimes = state.decisionTimeHistory
        .filter(d => d.phase === 'dispatch' && typeof d.time === 'number')
        .map(d => d.time)
      
      const newAvgDecisionTime = dispatchTimes.length > 0
        ? (state.statistics.avgDecisionTime * state.statistics.totalGames + 
           dispatchTimes.reduce((a, b) => a + b, 0) / dispatchTimes.length) / 
          (state.statistics.totalGames + 1)
        : state.statistics.avgDecisionTime
      
      const assessmentTime = state.assessmentTime || 0
      const prescriptionTime = state.prescriptionTime || 0
      const calendarTime = state.calendarTime || 0
      
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
            [levelKey]: {
              ...newLevelStat,
              assessmentTime,
              prescriptionTime,
              calendarTime,
              avgDispatchTime: dispatchTimes.length > 0 
                ? dispatchTimes.reduce((a, b) => a + b, 0) / dispatchTimes.length 
                : 0,
              totalDecisionTime: assessmentTime + prescriptionTime + calendarTime + 
                (dispatchTimes.reduce((a, b) => a + b, 0)),
              finalScore: state.score,
              finalCompletion: completionRate,
              assessmentScore: state.assessmentScore,
              prescription: state.prescription?.id,
              calendarSlots: state.calendarPlan?.totalSlots,
            },
          },
          avgDecisionTime: newAvgDecisionTime,
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
