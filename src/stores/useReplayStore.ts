import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ReplayRecord, StuckPoint, OperationRecord } from '../types';

interface ReplayState {
  replays: ReplayRecord[];
  currentReplay: ReplayRecord | null;
  isPlaying: boolean;
  playbackSpeed: number;
  currentTime: number;
}

interface ReplayActions {
  saveReplay: (replay: ReplayRecord) => void;
  loadReplay: (replayId: string) => void;
  playReplay: () => void;
  pauseReplay: () => void;
  seekToTime: (time: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  getStuckPoints: () => StuckPoint[];
  getCurrentOperation: () => OperationRecord | null;
  getOperationsUpToTime: () => OperationRecord[];
  clearReplays: () => void;
  deleteReplay: (replayId: string) => void;
  getRecentReplays: (count?: number) => ReplayRecord[];
}

type ReplayStore = ReplayState & ReplayActions;

const MAX_REPLAYS = 3;

const isMaterialFailure = (replay: ReplayRecord): boolean => {
  if (replay.success) return false;
  
  const materialRelatedOps = replay.operations.filter((op) =>
    ['check_materials', 'show_missing_modal', 'skip_material', 'resolve_material'].includes(op.type)
  );
  
  const hasMissingMaterial = replay.operations.some(
    (op) => op.type === 'check_materials' && op.payload.complete === false
  );
  
  const hasSkipMaterial = replay.operations.some((op) => op.type === 'skip_material');
  
  return materialRelatedOps.length > 0 && (hasMissingMaterial || hasSkipMaterial);
};

const calculateMaterialStuckPoints = (replay: ReplayRecord): StuckPoint[] => {
  const stuckPoints: StuckPoint[] = [];
  const materialOps = replay.operations.filter((op) => op.phase === 'application');
  
  if (materialOps.length === 0) return stuckPoints;
  
  let lastOpTime = materialOps[0].timestamp;
  
  materialOps.forEach((op, index) => {
    if (index > 0) {
      const gap = op.timestamp - lastOpTime;
      if (gap > 10000) {
        let description = '在材料审核阶段停留过久';
        
        if (op.type === 'check_materials' && !op.payload.complete) {
          description = '发现材料缺失，未能及时处理';
        } else if (op.type === 'skip_material') {
          description = '跳过缺失材料，扣分处理';
        } else if (op.type === 'resolve_material') {
          description = '补全材料耗时过长';
        }
        
        stuckPoints.push({
          timestamp: lastOpTime,
          phase: 'application',
          description,
          duration: gap,
        });
      }
    }
    lastOpTime = op.timestamp;
  });
  
  return stuckPoints;
};

export const useReplayStore = create<ReplayStore>()(
  persist(
    (set, get) => ({
      replays: [],
      currentReplay: null,
      isPlaying: false,
      playbackSpeed: 1,
      currentTime: 0,

      saveReplay: (replay: ReplayRecord) => {
        if (!isMaterialFailure(replay)) {
          return;
        }
        
        const enhancedReplay: ReplayRecord = {
          ...replay,
          stuckPoints: [...replay.stuckPoints, ...calculateMaterialStuckPoints(replay)],
        };
        
        const { replays } = get();
        const newReplays = [enhancedReplay, ...replays].slice(0, MAX_REPLAYS);
        set({ replays: newReplays });
      },

      loadReplay: (replayId: string) => {
        const { replays } = get();
        const replay = replays.find((r) => r.id === replayId);
        if (replay) {
          set({
            currentReplay: replay,
            currentTime: 0,
            isPlaying: false,
          });
        }
      },

      playReplay: () => set({ isPlaying: true }),
      pauseReplay: () => set({ isPlaying: false }),

      seekToTime: (time: number) => {
        const { currentReplay } = get();
        if (!currentReplay) return;
        const clampedTime = Math.max(0, Math.min(time, currentReplay.duration));
        set({ currentTime: clampedTime });
      },

      setPlaybackSpeed: (speed: number) => set({ playbackSpeed: speed }),

      getStuckPoints: (): StuckPoint[] => {
        const { currentReplay } = get();
        return currentReplay?.stuckPoints || [];
      },

      getCurrentOperation: (): OperationRecord | null => {
        const { currentReplay, currentTime } = get();
        if (!currentReplay) return null;

        const startTime = currentReplay.operations[0]?.timestamp || 0;
        const targetTime = startTime + currentTime * 1000;

        let currentOp: OperationRecord | null = null;
        for (const op of currentReplay.operations) {
          if (op.timestamp <= targetTime) {
            currentOp = op;
          } else {
            break;
          }
        }
        return currentOp;
      },

      getOperationsUpToTime: (): OperationRecord[] => {
        const { currentReplay, currentTime } = get();
        if (!currentReplay) return [];

        const startTime = currentReplay.operations[0]?.timestamp || 0;
        const targetTime = startTime + currentTime * 1000;

        return currentReplay.operations.filter((op) => op.timestamp <= targetTime);
      },

      clearReplays: () => set({ replays: [], currentReplay: null }),

      deleteReplay: (replayId: string) => {
        const { replays, currentReplay } = get();
        set({
          replays: replays.filter((r) => r.id !== replayId),
          currentReplay: currentReplay?.id === replayId ? null : currentReplay,
        });
      },

      getRecentReplays: (count: number = MAX_REPLAYS): ReplayRecord[] => {
        const { replays } = get();
        return replays.slice(0, count);
      },
    }),
    {
      name: 'game-replays-storage',
      partialize: (state) => ({ replays: state.replays }),
    }
  )
);
