import { create } from 'zustand';
import type { TrainingRecord, UserProgress, DispatchAnalysis, AccuracyPoint } from '@/types/record';
import { RecordStorage, UserStorage } from '@/utils/storage';

const DEFAULT_PROGRESS: UserProgress = {
  userId: UserStorage.CURRENT_USER.id,
  totalPoints: 0,
  totalTrainingTime: 0,
  completedLevels: [],
  unlockedLevels: ['level-001', 'level-002'],
  earnedBadges: [],
  accuracyHistory: [],
  records: [],
};

interface RecordState {
  records: TrainingRecord[];
  currentRecord: TrainingRecord | null;
  userProgress: UserProgress;

  loadAll: () => void;
  saveRecord: (record: TrainingRecord) => Promise<void>;
  getRecordDetail: (id: string) => TrainingRecord | null;
  setCurrentRecord: (id: string) => void;
  getDispatchAnalysis: () => DispatchAnalysis;
  addAccuracyPoint: (point: AccuracyPoint) => void;
}

export const useRecordStore = create<RecordState>((set, get) => ({
  records: [],
  currentRecord: null,
  userProgress: DEFAULT_PROGRESS,

  loadAll: () => {
    const records = RecordStorage.getAll<TrainingRecord>();
    const savedProgress = UserStorage.getProgress<UserProgress | null>(null);
    set({
      records,
      userProgress: savedProgress || { ...DEFAULT_PROGRESS, records },
    });
  },

  saveRecord: async (record) => {
    RecordStorage.add(record);
    const state = get();
    const newRecords = [record, ...state.records];

    const totalPoints = state.userProgress.totalPoints + record.rewardPoints;
    const totalTrainingTime = state.userProgress.totalTrainingTime + record.totalDuration;
    const completedLevels = record.mode === 'level' && !state.userProgress.completedLevels.includes(record.levelId)
      ? [...state.userProgress.completedLevels, record.levelId]
      : state.userProgress.completedLevels;

    const newHistory: AccuracyPoint[] = [
      ...state.userProgress.accuracyHistory,
      {
        date: record.createdAt,
        accuracy: record.accuracy,
        score: record.score,
        duration: record.totalDuration,
      },
    ].slice(-20);

    const newProgress = {
      ...state.userProgress,
      totalPoints,
      totalTrainingTime,
      completedLevels,
      accuracyHistory: newHistory,
      records: newRecords,
    };

    UserStorage.saveProgress(newProgress);

    set({
      records: newRecords,
      userProgress: newProgress,
    });
  },

  getRecordDetail: (id) => {
    return get().records.find(r => r.id === id) || RecordStorage.getById<TrainingRecord>(id);
  },

  setCurrentRecord: (id) => {
    const record = get().getRecordDetail(id);
    set({ currentRecord: record || null });
  },

  getDispatchAnalysis: () => {
    const { records } = get();
    if (records.length === 0) {
      return {
        avgDispatchDuration: 0,
        fastestDispatch: 0,
        slowestDispatch: 0,
        dispatchDistribution: [
          { range: '<60s', count: 0 },
          { range: '60-120s', count: 0 },
          { range: '120-300s', count: 0 },
          { range: '300-600s', count: 0 },
          { range: '>600s', count: 0 },
        ],
        phaseTimeBreakdown: [
          { phase: '规则识别', avgDuration: 0 },
          { phase: '证据选择', avgDuration: 0 },
          { phase: '明细排序', avgDuration: 0 },
          { phase: '赔付处理', avgDuration: 0 },
        ],
      };
    }

    const durations = records.map(r => r.dispatchDuration);
    const avg = durations.reduce((s, d) => s + d, 0) / durations.length;

    const dist = [
      { range: '<60s', count: durations.filter(d => d < 60).length },
      { range: '60-120s', count: durations.filter(d => d >= 60 && d < 120).length },
      { range: '120-300s', count: durations.filter(d => d >= 120 && d < 300).length },
      { range: '300-600s', count: durations.filter(d => d >= 300 && d < 600).length },
      { range: '>600s', count: durations.filter(d => d >= 600).length },
    ];

    const phaseMap: Record<string, number[]> = {
      rule: [],
      evidence: [],
      settlement: [],
      compensation: [],
    };
    records.forEach(r => {
      Object.entries(r.phaseDurations).forEach(([phase, dur]) => {
        if (phaseMap[phase]) phaseMap[phase].push(dur);
      });
    });

    const avgPhase = (arr: number[]): number => arr.length === 0 ? 0 : arr.reduce((s, v) => s + v, 0) / arr.length;
    const breakdown = [
      { phase: '规则识别', avgDuration: Math.round(avgPhase(phaseMap.rule)) },
      { phase: '证据选择', avgDuration: Math.round(avgPhase(phaseMap.evidence)) },
      { phase: '明细排序', avgDuration: Math.round(avgPhase(phaseMap.settlement)) },
      { phase: '赔付处理', avgDuration: Math.round(avgPhase(phaseMap.compensation)) },
    ];

    return {
      avgDispatchDuration: Math.round(avg),
      fastestDispatch: Math.round(Math.min(...durations)),
      slowestDispatch: Math.round(Math.max(...durations)),
      dispatchDistribution: dist,
      phaseTimeBreakdown: breakdown,
    };
  },

  addAccuracyPoint: (point) => {
    const state = get();
    const newHistory = [...state.userProgress.accuracyHistory, point].slice(-20);
    const newProgress = { ...state.userProgress, accuracyHistory: newHistory };
    UserStorage.saveProgress(newProgress);
    set({ userProgress: newProgress });
  },
}));
