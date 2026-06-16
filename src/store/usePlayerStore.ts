import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PlayerData, GameResult, LevelProgress } from '@/types/game';
import { calculateStars, getLevelById } from '@/data/levels';

interface PlayerState extends PlayerData {
  addGameResult: (result: GameResult) => void;
  getLevelProgress: (levelId: number) => LevelProgress;
  getBestScoreForLevel: (levelId: number) => number;
  resetProgress: () => void;
  getLevelHistory: (levelId: number) => GameResult[];
}

const initialPlayerData: PlayerData = {
  levelProgress: {},
  gameHistory: [],
  totalScore: 0,
  totalPlays: 0,
};

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      ...initialPlayerData,
      addGameResult: (result) => {
        set((state) => {
          const existingProgress = state.levelProgress[result.levelId] || {
            levelId: result.levelId,
            bestScore: 0,
            bestStars: 0,
            completed: false,
            playCount: 0,
          };
          const level = getLevelById(result.levelId);
          const targetScore = level?.targetScore || 1000;
          const stars = calculateStars(result.totalScore, targetScore);
          const newProgress: LevelProgress = {
            ...existingProgress,
            bestScore: Math.max(existingProgress.bestScore, result.totalScore),
            bestStars: Math.max(existingProgress.bestStars, stars),
            completed: existingProgress.completed || result.isWin,
            playCount: existingProgress.playCount + 1,
          };
          return {
            levelProgress: {
              ...state.levelProgress,
              [result.levelId]: newProgress,
            },
            gameHistory: [...state.gameHistory, result],
            totalScore: state.totalScore + result.totalScore,
            totalPlays: state.totalPlays + 1,
          };
        });
      },
      getLevelProgress: (levelId) => {
        return get().levelProgress[levelId] || {
          levelId,
          bestScore: 0,
          bestStars: 0,
          completed: false,
          playCount: 0,
        };
      },
      getBestScoreForLevel: (levelId) => {
        return get().getLevelProgress(levelId).bestScore;
      },
      resetProgress: () => {
        set(initialPlayerData);
      },
      getLevelHistory: (levelId) => {
        return get().gameHistory.filter((r) => r.levelId === levelId).reverse();
      },
    }),
    {
      name: 'pharmacy-game-player-v1',
    }
  )
);
