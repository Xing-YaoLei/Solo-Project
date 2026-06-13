import { create } from 'zustand';
import { GameRecord } from '@/types';
import { getSavedRecords } from './useGameStore';

interface StatsState {
  totalGames: number;
  averageScore: number;
  averageOnTimeRate: number;
  totalCorrect: number;
  totalWrong: number;
  errorDistribution: Record<string, number>;
  recentRecords: GameRecord[];
  isLoaded: boolean;

  loadStats: () => void;
  clearRecords: () => void;
}

export const useStatsStore = create<StatsState>((set) => ({
  totalGames: 0,
  averageScore: 0,
  averageOnTimeRate: 0,
  totalCorrect: 0,
  totalWrong: 0,
  errorDistribution: {},
  recentRecords: [],
  isLoaded: false,

  loadStats: () => {
    const records = getSavedRecords();

    if (records.length === 0) {
      set({
        totalGames: 0,
        averageScore: 0,
        averageOnTimeRate: 0,
        totalCorrect: 0,
        totalWrong: 0,
        errorDistribution: {},
        recentRecords: [],
        isLoaded: true,
      });
      return;
    }

    const totalGames = records.length;
    const averageScore = Math.round(
      records.reduce((sum, r) => sum + r.score, 0) / totalGames
    );
    const averageOnTimeRate = Math.round(
      records.reduce((sum, r) => sum + r.onTimeRate, 0) / totalGames
    );
    const totalCorrect = records.reduce((sum, r) => sum + r.correctCount, 0);
    const totalWrong = records.reduce((sum, r) => sum + r.wrongCount, 0);

    const errorDistribution: Record<string, number> = {};
    records.forEach((record) => {
      record.errors.forEach((error) => {
        errorDistribution[error] = (errorDistribution[error] || 0) + 1;
      });
    });

    const recentRecords = records.slice(0, 10);

    set({
      totalGames,
      averageScore,
      averageOnTimeRate,
      totalCorrect,
      totalWrong,
      errorDistribution,
      recentRecords,
      isLoaded: true,
    });
  },

  clearRecords: () => {
    localStorage.removeItem('community_groupbuy_records');
    localStorage.removeItem('community_groupbuy_replays');
    set({
      totalGames: 0,
      averageScore: 0,
      averageOnTimeRate: 0,
      totalCorrect: 0,
      totalWrong: 0,
      errorDistribution: {},
      recentRecords: [],
      isLoaded: true,
    });
  },
}));
