import { create } from 'zustand'
import type { ReplayData, PlaybackState, HesitationPoint, ActionLog } from '@/types/replay'
import { getReplays as getStoredReplays, setReplays as setStoredReplays } from '@/utils/storage'

interface ReplayState {
  replays: ReplayData[]
  currentReplay: ReplayData | null
  playbackState: PlaybackState
  hesitationPoints: HesitationPoint[]
  loadReplays: (levelId?: string) => void
  playReplay: (recordId: string) => void
  pauseReplay: () => void
  resumeReplay: () => void
  seekReplay: (time: number) => void
  addReplay: (replay: ReplayData, maxPerLevel?: number) => void
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
        hint: `在「${actionLog[i].actionType}」操作前犹豫 ${(gap / 1000).toFixed(1)} 秒，请仔细分析当时的判断逻辑。`,
      })
    }
  }
  return points
}

const getReplaysWithLevelId = (): ReplayData[] => {
  const stored = getStoredReplays()
  return stored.map((r) => ({
    ...r,
    levelId: (r as ReplayData & { levelId?: string }).levelId ?? 'level-1',
  })) as ReplayData[]
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
    const allReplays = getReplaysWithLevelId()
    const filtered = levelId
      ? allReplays.filter((r) => (r as ReplayData & { levelId?: string }).levelId === levelId)
      : allReplays
    set({ replays: filtered.slice(0, 3) })
  },
  playReplay: (recordId) => {
    const allReplays = getReplaysWithLevelId()
    const replay = allReplays.find((r) => r.recordId === recordId)
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
  resumeReplay: () => {
    const state = get()
    if (state.currentReplay && state.playbackState.currentTime < state.playbackState.duration) {
      set((state) => ({
        playbackState: {
          ...state.playbackState,
          isPlaying: true,
        },
      }))
    }
  },
  seekReplay: (time) => {
    set((state) => ({
      playbackState: {
        ...state.playbackState,
        currentTime: Math.max(0, Math.min(state.playbackState.duration, time)),
      },
    }))
  },
  addReplay: (replay, maxPerLevel = 3) => {
    const allReplays = getReplaysWithLevelId()
    const replayWithLevel = {
      ...replay,
      levelId: (replay as ReplayData & { levelId?: string }).levelId ?? 'level-1',
    }
    allReplays.unshift(replayWithLevel)
    
    const levelReplayCount: Record<string, number> = {}
    const filtered: ReplayData[] = []
    for (const r of allReplays) {
      const levelId = (r as ReplayData & { levelId?: string }).levelId ?? 'unknown'
      levelReplayCount[levelId] = (levelReplayCount[levelId] ?? 0) + 1
      if (levelReplayCount[levelId] <= maxPerLevel) {
        filtered.push(r)
      }
    }
    
    setStoredReplays(filtered)
    set({ replays: filtered.slice(0, 3) })
  },
}))
