import { create } from 'zustand';
import type { GameStore, GamePhase, OperationRecord, UtilizationDataPoint, ReplayRecord, StuckPoint } from '../types';
import { getLevelById, getMaterialsByStudentId } from '../data/levels';

const initialState = {
  currentLevelId: null,
  currentPhase: 'observe' as GamePhase,
  score: 0,
  timeRemaining: 0,
  isPaused: false,
  isGameOver: false,
  selectedStudentId: null,
  missingMaterials: [],
  operationHistory: [],
  classroomUtilization: [],
  reviewedStudents: [],
  scoredStudents: [],
  showMissingMaterialModal: false,
  currentMissingMaterialStudent: null,
};

const calculateStuckPoints = (operations: OperationRecord[]): StuckPoint[] => {
  const stuckPoints: StuckPoint[] = [];
  let lastOperationTime = 0;
  let lastPhase: GamePhase = 'observe';

  operations.forEach((op, index) => {
    if (index > 0) {
      const gap = op.timestamp - lastOperationTime;
      if (gap > 15000) {
        stuckPoints.push({
          timestamp: lastOperationTime,
          phase: lastPhase,
          description: `在${getPhaseName(lastPhase)}阶段停留过久`,
          duration: gap,
        });
      }
    }
    lastOperationTime = op.timestamp;
    lastPhase = op.phase;
  });

  return stuckPoints;
};

const getPhaseName = (phase: GamePhase): string => {
  const names: Record<GamePhase, string> = {
    observe: '观察学生名单',
    transcript: '处理成绩单',
    application: '审核申请材料',
    complete: '完成评分',
  };
  return names[phase];
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  startLevel: (levelId: string) => {
    const level = getLevelById(levelId);
    if (!level) return;

    set({
      currentLevelId: levelId,
      currentPhase: 'observe',
      score: 0,
      timeRemaining: level.timeLimit,
      isPaused: false,
      isGameOver: false,
      selectedStudentId: null,
      missingMaterials: [],
      operationHistory: [],
      classroomUtilization: [
        { time: level.timeLimit, utilization: 100, phase: 'observe' },
      ],
      reviewedStudents: [],
      scoredStudents: [],
      showMissingMaterialModal: false,
      currentMissingMaterialStudent: null,
    });

    get().addOperation('level_start', { levelId, levelName: level.name });
  },

  nextPhase: () => {
    const { currentPhase } = get();
    const phases: GamePhase[] = ['observe', 'transcript', 'application', 'complete'];
    const currentIndex = phases.indexOf(currentPhase);
    
    if (currentIndex < phases.length - 1) {
      const nextPhase = phases[currentIndex + 1];
      set({ currentPhase: nextPhase });
      get().addOperation('phase_change', { from: currentPhase, to: nextPhase });
    }
  },

  prevPhase: () => {
    const { currentPhase } = get();
    const phases: GamePhase[] = ['observe', 'transcript', 'application', 'complete'];
    const currentIndex = phases.indexOf(currentPhase);
    
    if (currentIndex > 0) {
      const prevPhase = phases[currentIndex - 1];
      set({ currentPhase: prevPhase });
      get().addOperation('phase_change', { from: currentPhase, to: prevPhase });
    }
  },

  selectStudent: (studentId: string) => {
    const { selectedStudentId, reviewedStudents, currentPhase } = get();
    
    if (selectedStudentId !== studentId) {
      set({ selectedStudentId: studentId });
      
      if (!reviewedStudents.includes(studentId)) {
        set({ reviewedStudents: [...reviewedStudents, studentId] });
        set((state) => ({ score: state.score + 5 }));
      }
      
      get().addOperation('select_student', { studentId }, currentPhase);
    }
  },

  submitScore: (studentId: string, score: number) => {
    const { scoredStudents, currentPhase } = get();
    
    if (!scoredStudents.includes(studentId)) {
      set({ scoredStudents: [...scoredStudents, studentId] });
      set((state) => ({ score: state.score + score }));
      get().addOperation('submit_score', { studentId, score }, currentPhase);
    }
  },

  checkMaterials: (studentId: string): boolean => {
    const { currentLevelId } = get();
    if (!currentLevelId) return false;

    const level = getLevelById(currentLevelId);
    if (!level) return false;

    const studentMaterials = getMaterialsByStudentId(level, studentId);
    if (!studentMaterials) return false;

    const requiredMaterials = studentMaterials.materials.filter((m) => m.required);
    const allSubmitted = requiredMaterials.every((m) => m.submitted);

    get().addOperation('check_materials', { studentId, complete: allSubmitted });

    return allSubmitted;
  },

  getMissingMaterials: (studentId: string) => {
    const { currentLevelId } = get();
    if (!currentLevelId) return [];

    const level = getLevelById(currentLevelId);
    if (!level) return [];

    const studentMaterials = getMaterialsByStudentId(level, studentId);
    if (!studentMaterials) return [];

    return studentMaterials.materials.filter((m) => m.required && !m.submitted);
  },

  showMissingModal: (studentId: string) => {
    set({
      showMissingMaterialModal: true,
      currentMissingMaterialStudent: studentId,
    });
    get().addOperation('show_missing_modal', { studentId });
  },

  hideMissingModal: () => {
    set({
      showMissingMaterialModal: false,
      currentMissingMaterialStudent: null,
    });
  },

  resolveMissingMaterial: (studentId: string, materialId: string) => {
    const { currentLevelId } = get();
    if (!currentLevelId) return;

    const level = getLevelById(currentLevelId);
    if (!level) return;

    const studentMaterials = getMaterialsByStudentId(level, studentId);
    if (!studentMaterials) return;

    const material = studentMaterials.materials.find((m) => m.id === materialId);
    if (material) {
      material.submitted = true;
      set((state) => ({ score: state.score + 10 }));
      get().addOperation('resolve_material', { studentId, materialId });
    }
  },

  skipMissingMaterial: (studentId: string) => {
    set((state) => ({ score: Math.max(0, state.score - 15) }));
    get().addOperation('skip_material', { studentId, penalty: -15 });
    get().hideMissingModal();
  },

  pauseGame: () => {
    set({ isPaused: true });
    get().addOperation('pause_game', {});
  },

  resumeGame: () => {
    set({ isPaused: false });
    get().addOperation('resume_game', {});
  },

  completeLevel: (success: boolean): ReplayRecord => {
    const { currentLevelId, score, operationHistory, classroomUtilization, timeRemaining } = get();
    const level = getLevelById(currentLevelId || '');
    
    const replay: ReplayRecord = {
      id: `replay-${Date.now()}`,
      levelId: currentLevelId || '',
      levelName: level?.name || '未知关卡',
      timestamp: Date.now(),
      duration: (level?.timeLimit || 0) - timeRemaining,
      success,
      finalScore: score,
      operations: operationHistory,
      stuckPoints: calculateStuckPoints(operationHistory),
      utilizationHistory: classroomUtilization,
    };

    set({ isGameOver: true });
    get().addOperation('level_complete', { success, finalScore: score });

    return replay;
  },

  tick: (delta: number) => {
    const { isPaused, isGameOver, timeRemaining, currentLevelId } = get();
    
    if (isPaused || isGameOver || !currentLevelId) return;

    const newTime = Math.max(0, timeRemaining - delta);
    set({ timeRemaining: newTime });

    if (newTime <= 0) {
      get().completeLevel(false);
    }
  },

  addUtilizationPoint: (utilization: number) => {
    const { timeRemaining, currentPhase, classroomUtilization } = get();
    classroomUtilization.push({
      time: timeRemaining,
      utilization,
      phase: currentPhase,
    });
  },

  addOperation: (type: string, payload: Record<string, any>, phaseOverride?: GamePhase) => {
    const { operationHistory, currentPhase, currentLevelId } = get();
    if (!currentLevelId) return;

    const record: OperationRecord = {
      timestamp: Date.now(),
      type,
      payload,
      phase: phaseOverride || currentPhase,
    };
    set({ operationHistory: [...operationHistory, record] });
  },

  resetGame: () => {
    set(initialState);
  },
}));
