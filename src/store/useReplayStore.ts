import { create } from 'zustand';
import { GameRecord, ReplayFrame } from '@/types';
import { getReplayRecords, getSavedRecords } from './useGameStore';

interface ReplayDifference {
  time: number;
  differences: Array<{
    recordId: string;
    action: string;
    isCorrect: boolean;
    productId: string;
  }>;
}

interface ReplayState {
  records: GameRecord[];
  allRecords: GameRecord[];
  selectedRecordIds: string[];
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
  playbackSpeed: number;

  loadRecords: () => void;
  selectRecord: (id: string) => void;
  deselectRecord: (id: string) => void;
  clearSelection: () => void;

  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  reset: () => void;

  tick: (deltaTime: number) => void;
  getCurrentFrames: () => Record<string, ReplayFrame | null>;
  calculateDifferences: () => ReplayDifference[];
}

export const useReplayStore = create<ReplayState>((set, get) => ({
  records: [],
  allRecords: [],
  selectedRecordIds: [],
  isPlaying: false,
  currentTime: 0,
  totalDuration: 0,
  playbackSpeed: 1,

  loadRecords: () => {
    const replayRecords = getReplayRecords();
    const allRecords = getSavedRecords();
    const maxDuration = Math.max(
      ...replayRecords.map((r) => r.totalTime),
      60
    );

    set({
      records: replayRecords,
      allRecords,
      totalDuration: maxDuration,
      selectedRecordIds:
        replayRecords.length > 0
          ? replayRecords.slice(0, 3).map((r) => r.id)
          : [],
    });
  },

  selectRecord: (id: string) => {
    const { selectedRecordIds, records } = get();
    if (selectedRecordIds.includes(id)) return;
    if (selectedRecordIds.length >= 3) return;

    const record = records.find((r) => r.id === id);
    if (!record) return;

    set({
      selectedRecordIds: [...selectedRecordIds, id],
    });
  },

  deselectRecord: (id: string) => {
    set((state) => ({
      selectedRecordIds: state.selectedRecordIds.filter(
        (rid) => rid !== id
      ),
    }));
  },

  clearSelection: () => {
    set({ selectedRecordIds: [] });
  },

  play: () => {
    const { currentTime, totalDuration } = get();
    if (currentTime >= totalDuration) {
      set({ currentTime: 0 });
    }
    set({ isPlaying: true });
  },

  pause: () => {
    set({ isPlaying: false });
  },

  seek: (time: number) => {
    set({ currentTime: Math.max(0, Math.min(time, get().totalDuration)) });
  },

  setPlaybackSpeed: (speed: number) => {
    set({ playbackSpeed: speed });
  },

  reset: () => {
    set({ currentTime: 0, isPlaying: false });
  },

  tick: (deltaTime: number) => {
    const { isPlaying, currentTime, totalDuration, playbackSpeed } = get();
    if (!isPlaying) return;

    const newTime = currentTime + deltaTime * playbackSpeed;
    if (newTime >= totalDuration) {
      set({ currentTime: totalDuration, isPlaying: false });
    } else {
      set({ currentTime: newTime });
    }
  },

  getCurrentFrames: () => {
    const { selectedRecordIds, records, currentTime } = get();
    const frames: Record<string, ReplayFrame | null> = {};

    selectedRecordIds.forEach((recordId) => {
      const record = records.find((r) => r.id === recordId);
      if (!record) {
        frames[recordId] = null;
        return;
      }

      const frame = record.replayData
        .filter((f) => f.time <= currentTime)
        .sort((a, b) => b.time - a.time)[0];

      frames[recordId] = frame || null;
    });

    return frames;
  },

  calculateDifferences: (): ReplayDifference[] => {
    const { selectedRecordIds, records } = get();
    if (selectedRecordIds.length < 2) return [];

    const selectedRecords = records.filter((r) =>
      selectedRecordIds.includes(r.id)
    );

    const allTimePoints = new Set<number>();
    selectedRecords.forEach((record) => {
      record.replayData.forEach((frame) => {
        allTimePoints.add(Math.round(frame.time * 10) / 10);
      });
    });

    const differences: ReplayDifference[] = [];

    Array.from(allTimePoints)
      .sort((a, b) => a - b)
      .forEach((time) => {
        const timeDiffs: ReplayDifference['differences'] = [];

        selectedRecords.forEach((record) => {
          const frame = record.replayData.find(
            (f) => Math.abs(f.time - time) < 0.15
          );
          if (frame) {
            timeDiffs.push({
              recordId: record.id,
              action: frame.action,
              isCorrect: frame.isCorrect,
              productId: frame.productId,
            });
          }
        });

        if (timeDiffs.length >= 2) {
          const actions = timeDiffs.map((d) => d.action + d.productId);
          const uniqueActions = new Set(actions);
          if (uniqueActions.size > 1 || timeDiffs.some((d) => !d.isCorrect)) {
            differences.push({
              time,
              differences: timeDiffs,
            });
          }
        }
      });

    return differences;
  },
}));
