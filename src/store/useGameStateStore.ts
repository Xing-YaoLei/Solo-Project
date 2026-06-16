import { create } from 'zustand';
import type { GameState, GameResult, Level } from '@/types/game';

interface GameStateStore {
  currentLevel: Level | null;
  gameState: GameState | null;
  lastResult: GameResult | null;
  selectedLevelId: number | null;
  lastPlayedLevelId: number | null;
  setCurrentLevel: (level: Level | null) => void;
  setSelectedLevelId: (id: number | null) => void;
  initGameState: (level: Level) => void;
  updateGameState: (updates: Partial<GameState>) => void;
  setLastResult: (result: GameResult | null) => void;
  resetGameState: () => void;
}

const initialState: Omit<GameStateStore, 'setCurrentLevel' | 'setSelectedLevelId' | 'initGameState' | 'updateGameState' | 'setLastResult' | 'resetGameState'> = {
  currentLevel: null,
  gameState: null,
  lastResult: null,
  selectedLevelId: null,
  lastPlayedLevelId: null,
};

export const useGameStateStore = create<GameStateStore>()((set, get) => ({
  ...initialState,
  setCurrentLevel: (level) => set({ currentLevel: level }),
  setSelectedLevelId: (id) => set({ selectedLevelId: id }),
  initGameState: (level) => {
    const now = Date.now();
    const gameState: GameState = {
      currentLevelId: level.id,
      timeRemaining: level.timeLimit,
      score: 0,
      combo: 0,
      maxCombo: 0,
      errors: 0,
      totalPlacements: 0,
      correctPlacements: 0,
      startTime: now,
      placementTimes: [],
      lastPlacementTime: now,
      isPaused: false,
      isGameOver: false,
    };
    set({ 
      currentLevel: level, 
      gameState, 
      lastPlayedLevelId: level.id,
    });
  },
  updateGameState: (updates) => {
    const { gameState } = get();
    if (gameState) {
      set({ gameState: { ...gameState, ...updates } });
    }
  },
  setLastResult: (result) => set({ lastResult: result }),
  resetGameState: () => set({ gameState: null }),
}));
