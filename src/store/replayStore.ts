import { create } from 'zustand';
import type { ReplayData, ReplayFrame, LagPoint, GameState } from '@/types';
import { loadReplays, saveReplay, getReplayById, deleteReplay } from '@/utils/storage';
import { generateId } from '@/utils/math';
import { GAME_CONFIG } from '@/config/difficulty';

interface ReplayState {
  replays: ReplayData[];
  currentReplay: ReplayData | null;
  currentFrameIndex: number;
  isPlaying: boolean;
  playbackSpeed: number;
  lagPoints: LagPoint[];
  lastInteractionTime: number;
  pendingLagStart: number | null;
}

interface ReplayActions {
  loadReplays: () => void;
  startRecording: (sessionId: string, difficulty: string) => void;
  recordFrame: (gameState: GameState, interaction?: { type: 'drag' | 'click' | 'key'; target: string }) => void;
  recordInteraction: () => void;
  stopRecording: (success: boolean, finalScore: number, failureReason?: string) => ReplayData | null;
  loadReplay: (replayId: string) => boolean;
  playReplay: () => void;
  pauseReplay: () => void;
  seekToFrame: (frameIndex: number) => void;
  seekToLagPoint: (lagPointIndex: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  getCurrentFrame: () => ReplayFrame | null;
  getNextFrame: () => ReplayFrame | null;
  closeReplay: () => void;
  removeReplay: (replayId: string) => void;
  clearReplays: () => void;
  detectLagPoint: () => void;
}

const initialState: ReplayState = {
  replays: [],
  currentReplay: null,
  currentFrameIndex: 0,
  isPlaying: false,
  playbackSpeed: 1,
  lagPoints: [],
  lastInteractionTime: Date.now(),
  pendingLagStart: null,
};

let recordingSession: {
  sessionId: string;
  difficulty: string;
  startTime: number;
  frames: ReplayFrame[];
  lagPoints: LagPoint[];
} | null = null;

let frameCount = 0;
const FRAME_INTERVAL = 100;

export const useReplayStore = create<ReplayState & ReplayActions>((set, get) => ({
  ...initialState,

  loadReplays: () => {
    const replays = loadReplays();
    set({ replays });
  },

  startRecording: (sessionId: string, difficulty: string) => {
    recordingSession = {
      sessionId,
      difficulty,
      startTime: Date.now(),
      frames: [],
      lagPoints: [],
    };
    frameCount = 0;
    set({
      lagPoints: [],
      lastInteractionTime: Date.now(),
      pendingLagStart: null,
    });
  },

  recordFrame: (gameState: GameState, interaction?: { type: 'drag' | 'click' | 'key'; target: string }) => {
    if (!recordingSession) return;
    
    frameCount++;
    if (frameCount % Math.max(1, Math.floor(FRAME_INTERVAL / 16)) !== 0) return;
    
    const frame: ReplayFrame = {
      timestamp: Date.now() - recordingSession.startTime,
      playerPosition: [...gameState.playerPosition] as [number, number, number],
      cameraRotation: [...gameState.cameraRotation] as [number, number, number],
      spots: gameState.spots.map(s => ({ ...s })),
      currentTask: gameState.phase,
      interaction: interaction ? { ...interaction } : undefined,
    };
    
    recordingSession.frames.push(frame);
  },

  recordInteraction: () => {
    const now = Date.now();
    const state = get();
    
    if (state.pendingLagStart !== null) {
      const lagDuration = (now - state.pendingLagStart) / 1000;
      if (lagDuration >= GAME_CONFIG.lagThresholdSeconds) {
        let reason: LagPoint['reason'] = 'thinking';
        let description = '思考中';
        
        if (lagDuration >= 10) {
          reason = 'waiting';
          description = '等待超时';
        } else if (lagDuration >= 5) {
          reason = 'interaction';
          description = '交互困难';
        }
        
        const lagPoint: LagPoint = {
          timestamp: state.pendingLagStart,
          duration: lagDuration,
          reason,
          description,
          position: get().currentReplay
            ? get().currentReplay.frames[get().currentFrameIndex]?.playerPosition || [0, 0, 0]
            : [0, 0, 0],
        };
        
        if (recordingSession) {
          recordingSession.lagPoints.push(lagPoint);
        }
        
        set(state => ({
          lagPoints: [...state.lagPoints, lagPoint],
        }));
      }
    }
    
    set({
      lastInteractionTime: now,
      pendingLagStart: null,
    });
  },

  detectLagPoint: () => {
    const state = get();
    const now = Date.now();
    const timeSinceInteraction = (now - state.lastInteractionTime) / 1000;
    
    if (timeSinceInteraction >= GAME_CONFIG.lagThresholdSeconds && state.pendingLagStart === null) {
      set({ pendingLagStart: state.lastInteractionTime });
    }
  },

  stopRecording: (success: boolean, finalScore: number, failureReason?: string): ReplayData | null => {
    if (!recordingSession) return null;
    
    if (success) {
      recordingSession = null;
      return null;
    }
    
    const replayData: ReplayData = {
      id: generateId(),
      sessionId: recordingSession.sessionId,
      difficulty: recordingSession.difficulty,
      startTime: recordingSession.startTime,
      endTime: Date.now(),
      frames: recordingSession.frames,
      lagPoints: recordingSession.lagPoints,
      failureReason: failureReason || '未知原因',
      finalScore,
    };
    
    const replays = saveReplay(replayData);
    recordingSession = null;
    
    set({ replays });
    return replayData;
  },

  loadReplay: (replayId: string): boolean => {
    const replay = getReplayById(replayId);
    if (!replay) return false;
    
    set({
      currentReplay: replay,
      currentFrameIndex: 0,
      isPlaying: false,
      lagPoints: replay.lagPoints,
    });
    return true;
  },

  playReplay: () => set({ isPlaying: true }),
  pauseReplay: () => set({ isPlaying: false }),

  seekToFrame: (frameIndex: number) => {
    const state = get();
    if (!state.currentReplay) return;
    
    const clampedIndex = Math.max(0, Math.min(frameIndex, state.currentReplay.frames.length - 1));
    set({ currentFrameIndex: clampedIndex });
  },

  seekToLagPoint: (lagPointIndex: number) => {
    const state = get();
    if (!state.currentReplay || lagPointIndex >= state.lagPoints.length) return;
    
    const lagPoint = state.lagPoints[lagPointIndex];
    const frameIndex = state.currentReplay.frames.findIndex(
      f => f.timestamp >= lagPoint.timestamp - recordingSession!.startTime
    );
    
    if (frameIndex !== -1) {
      set({ currentFrameIndex: frameIndex, isPlaying: false });
    }
  },

  setPlaybackSpeed: (speed: number) => set({ playbackSpeed: speed }),

  getCurrentFrame: (): ReplayFrame | null => {
    const state = get();
    if (!state.currentReplay) return null;
    return state.currentReplay.frames[state.currentFrameIndex] || null;
  },

  getNextFrame: (): ReplayFrame | null => {
    const state = get();
    if (!state.currentReplay) return null;
    
    const nextIndex = state.currentFrameIndex + state.playbackSpeed;
    if (nextIndex >= state.currentReplay.frames.length) {
      set({ isPlaying: false });
      return state.currentReplay.frames[state.currentReplay.frames.length - 1];
    }
    
    set({ currentFrameIndex: Math.floor(nextIndex) });
    return state.currentReplay.frames[Math.floor(nextIndex)];
  },

  closeReplay: () => {
    set({
      currentReplay: null,
      currentFrameIndex: 0,
      isPlaying: false,
      lagPoints: [],
    });
  },

  removeReplay: (replayId: string) => {
    const replays = deleteReplay(replayId);
    set(state => ({
      replays,
      currentReplay: state.currentReplay?.id === replayId ? null : state.currentReplay,
    }));
  },

  clearReplays: () => {
    const replays: ReplayData[] = [];
    localStorage.setItem('parking_game_replays', JSON.stringify(replays));
    set({ replays, currentReplay: null });
  },
}));
