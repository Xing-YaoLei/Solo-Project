import type { LeaderboardEntry } from '@/types';
import { GAME_CONFIG } from '@/config/constants';

const STORAGE_KEYS = {
  TUTORIAL: GAME_CONFIG.STORAGE_PREFIX + 'tutorial_done',
  LEADERBOARD_REWORK: GAME_CONFIG.STORAGE_PREFIX + 'lb_rework',
  LEADERBOARD_TIME: GAME_CONFIG.STORAGE_PREFIX + 'lb_time',
  PERSONAL_BEST: GAME_CONFIG.STORAGE_PREFIX + 'personal_best'
};

export function isTutorialComplete(): boolean {
  return localStorage.getItem(STORAGE_KEYS.TUTORIAL) === 'true';
}

export function setTutorialComplete(complete: boolean): void {
  localStorage.setItem(STORAGE_KEYS.TUTORIAL, complete ? 'true' : 'false');
}

export function getLeaderboardByRework(): LeaderboardEntry[] {
  const data = localStorage.getItem(STORAGE_KEYS.LEADERBOARD_REWORK);
  if (!data) return getDefaultLeaderboard();
  try {
    return JSON.parse(data);
  } catch {
    return getDefaultLeaderboard();
  }
}

export function getLeaderboardByTime(): LeaderboardEntry[] {
  const data = localStorage.getItem(STORAGE_KEYS.LEADERBOARD_TIME);
  if (!data) return getDefaultLeaderboard().sort((a, b) => a.avgCompletionTime - b.avgCompletionTime);
  try {
    return JSON.parse(data);
  } catch {
    return getDefaultLeaderboard().sort((a, b) => a.avgCompletionTime - b.avgCompletionTime);
  }
}

export function saveScore(entry: LeaderboardEntry): void {
  const reworkLb = getLeaderboardByRework();
  reworkLb.push(entry);
  reworkLb.sort((a, b) => a.reworkRate - b.reworkRate || b.totalScore - a.totalScore);
  localStorage.setItem(STORAGE_KEYS.LEADERBOARD_REWORK, JSON.stringify(reworkLb.slice(0, 20)));

  const timeLb = getLeaderboardByTime();
  timeLb.push(entry);
  timeLb.sort((a, b) => a.avgCompletionTime - b.avgCompletionTime || b.totalScore - a.totalScore);
  localStorage.setItem(STORAGE_KEYS.LEADERBOARD_TIME, JSON.stringify(timeLb.slice(0, 20)));
}

function getDefaultLeaderboard(): LeaderboardEntry[] {
  return [
    { playerName: '老司机王师傅', reworkRate: 2.1, avgCompletionTime: 58, totalScore: 9850, gamesPlayed: 120, timestamp: Date.now() },
    { playerName: '极速小李', reworkRate: 4.5, avgCompletionTime: 42, totalScore: 8720, gamesPlayed: 85, timestamp: Date.now() },
    { playerName: '仔细张工', reworkRate: 1.8, avgCompletionTime: 75, totalScore: 9200, gamesPlayed: 60, timestamp: Date.now() },
    { playerName: '学徒小赵', reworkRate: 12.3, avgCompletionTime: 110, totalScore: 4500, gamesPlayed: 25, timestamp: Date.now() },
    { playerName: '稳健陈师傅', reworkRate: 3.2, avgCompletionTime: 68, totalScore: 7900, gamesPlayed: 95, timestamp: Date.now() }
  ];
}
