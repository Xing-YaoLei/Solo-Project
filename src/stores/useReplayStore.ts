import { create } from 'zustand'
import type { ReplayData, PlaybackState, HesitationPoint, ActionLog } from '@/types/replay'

interface ReplayState {
  replays: ReplayData[]
  currentReplay: ReplayData | null
  playbackState: PlaybackState
  hesitationPoints: HesitationPoint[]
  loadReplays: (levelId: string) => void
  playReplay: (recordId: string) => void
  pauseReplay: () => void
  seekReplay: (time: number) => void
}

const HESITATION_THRESHOLD = 2000

const detectHesitationPoints = (actionLog: ActionLog[], threshold: number): HesitationPoint[] => {
  const points: HesitationPoint[] = []
  for (let i = 1; i < actionLog.length; i++) {
    const gap = actionLog[i].timestamp - actionLog[i - 1].timestamp
    if (gap >= threshold) {
      points.push({
        id: `hp-${i}`,
        timestamp: actionLog[i - 1].timestamp,
        duration: gap,
        questionId: '',
        hint: `在 ${actionLog[i].actionType} 前犹豫 ${(gap / 1000).toFixed(1)} 秒`,
      })
    }
  }
  return points
}

export const useReplayStore = create<ReplayState>((set, get) => ({
  replays: [],
  currentReplay: null,
  playbackState: {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    speed: 1,
  },
  hesitationPoints: [],
  loadReplays: (levelId) => {
    const stored = localStorage.getItem('bnb_replays')
    const allReplays: (ReplayData & { levelId?: string })[] = stored ? JSON.parse(stored) : []
    const levelReplays = allReplays.filter((r) => r.levelId === levelId || !r.levelId) as ReplayData[]
    set({ replays: levelReplays })
  },
  playReplay: (recordId) => {
    const replay = get().replays.find((r) => r.recordId === recordId)
    if (replay) {
      const totalDuration = replay.actionLog.length > 0
        ? replay.actionLog[replay.actionLog.length - 1].timestamp - replay.actionLog[0].timestamp
        : 0
      const hesitationPoints = detectHesitationPoints(replay.actionLog, replay.hesitationThreshold || HESITATION_THRESHOLD)
      set({
        currentReplay: replay,
        hesitationPoints,
        playbackState: {
          isPlaying: true,
          currentTime: 0,
          duration: totalDuration,
          speed: 1,
        },
      })
    }
  },
  pauseReplay: () => {
    set((state) => ({
      playbackState: {
        ...state.playbackState,
        isPlaying: false,
      },
    }))
  },
  seekReplay: (time) => {
    set((state) => ({
      playbackState: {
        ...state.playbackState,
        currentTime: time,
      },
    }))
  },
}))
