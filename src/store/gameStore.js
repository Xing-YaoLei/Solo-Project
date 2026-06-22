import { create } from 'zustand';
import { levels, mockLeaderboard } from '../data/levels';

const getInitialState = () => {
  const saved = localStorage.getItem('courtCalendarGame');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        unlockedLevels: parsed.unlockedLevels || [1],
        levelStars: parsed.levelStars || {},
        levelStats: parsed.levelStats || {},
        totalGames: parsed.totalGames || 0,
        bestSatisfaction: parsed.bestSatisfaction || 0,
        bestTime: parsed.bestTime || Infinity,
        playerName: parsed.playerName || '玩家',
        currentScreen: 'menu',
        isPlaying: false,
        isPaused: false,
        timeRemaining: 0,
        assignments: {},
        satisfaction: 0,
        showTutorial: false,
        tutorialStep: 0,
        showResult: false,
        resultData: null,
        leaderboardTab: 'satisfaction',
        selectedCase: null,
        conflictMessage: null,
        successMessage: null,
      };
    } catch (e) {
      console.error('Failed to parse saved state', e);
    }
  }
  return {
    unlockedLevels: [1],
    levelStars: {},
    levelStats: {},
    totalGames: 0,
    bestSatisfaction: 0,
    bestTime: Infinity,
    playerName: '玩家',
  };
};

export const useGameStore = create((set, get) => ({
  ...getInitialState(),
  
  currentScreen: 'menu',
  currentLevel: null,
  isPlaying: false,
  isPaused: false,
  timeRemaining: 0,
  assignments: {},
  satisfaction: 0,
  showTutorial: false,
  tutorialStep: 0,
  showResult: false,
  resultData: null,
  leaderboardTab: 'satisfaction',
  selectedCase: null,
  conflictMessage: null,
  successMessage: null,

  saveProgress: () => {
    const state = get();
    const saveData = {
      unlockedLevels: state.unlockedLevels,
      levelStars: state.levelStars,
      levelStats: state.levelStats,
      totalGames: state.totalGames,
      bestSatisfaction: state.bestSatisfaction,
      bestTime: state.bestTime,
      playerName: state.playerName,
    };
    localStorage.setItem('courtCalendarGame', JSON.stringify(saveData));
  },

  goToScreen: (screen) => set({ currentScreen: screen }),

  startLevel: (levelId) => {
    const level = levels.find(l => l.id === levelId);
    if (!level) return;
    
    const needsTutorial = level.tutorial && !get().levelStats[levelId]?.completed;
    
    set({
      currentLevel: level,
      currentScreen: 'game',
      isPlaying: !needsTutorial,
      timeRemaining: level.targetTime,
      assignments: {},
      satisfaction: 0,
      showTutorial: needsTutorial,
      tutorialStep: 0,
      showResult: false,
      resultData: null,
      selectedCase: null,
      conflictMessage: null,
      successMessage: null,
    });
  },

  startGame: () => {
    set({ isPlaying: true, showTutorial: false });
  },

  pauseGame: () => set({ isPaused: true }),
  resumeGame: () => set({ isPaused: false }),

  tickTime: () => {
    const state = get();
    if (!state.isPlaying || state.isPaused || state.showResult) return;
    
    const newTime = state.timeRemaining - 1;
    if (newTime <= 0) {
      get().endLevel(false);
    } else {
      set({ timeRemaining: newTime });
    }
  },

  assignCase: (caseId, slotId) => {
    const state = get();
    const level = state.currentLevel;
    if (!level) return false;

    const slot = level.timeSlots.find(s => s.id === slotId);
    const caseItem = level.cases.find(c => c.id === caseId);
    if (!slot || !caseItem) return false;

    const newAssignments = { ...state.assignments };
    
    if (newAssignments[caseId]) {
      delete newAssignments[caseId];
    }
    
    const currentCount = Object.values(newAssignments).filter(s => s === slotId).length;
    
    if (currentCount >= slot.maxCapacity) {
      set({
        conflictMessage: `⚠️ ${slot.time} 时段容量已满！(${currentCount}/${slot.maxCapacity})`,
      });
      setTimeout(() => set({ conflictMessage: null }), 2000);
      return false;
    }

    newAssignments[caseId] = slotId;
    
    const satisfaction = calculateSatisfaction(level, newAssignments);
    
    const isPreferred = caseItem.preferredSlot === slotId;
    if (isPreferred) {
      set({
        successMessage: `✅ ${caseItem.name} 安排到偏好时段！`,
      });
      setTimeout(() => set({ successMessage: null }), 2000);
    }
    
    set({ assignments: newAssignments, satisfaction, selectedCase: null });
    return true;
  },

  unassignCase: (caseId) => {
    const state = get();
    const level = state.currentLevel;
    if (!level) return;

    const newAssignments = { ...state.assignments };
    delete newAssignments[caseId];
    
    const satisfaction = calculateSatisfaction(level, newAssignments);
    
    set({ assignments: newAssignments, satisfaction });
  },

  selectCase: (caseId) => {
    set({ selectedCase: caseId });
  },

  checkConflicts: () => {
    const state = get();
    const level = state.currentLevel;
    if (!level) return [];

    const conflicts = [];
    const slotCounts = {};

    level.timeSlots.forEach(slot => {
      slotCounts[slot.id] = 0;
    });

    Object.values(state.assignments).forEach(slotId => {
      slotCounts[slotId] = (slotCounts[slotId] || 0) + 1;
    });

    Object.entries(slotCounts).forEach(([slotId, count]) => {
      const slot = level.timeSlots.find(s => s.id === slotId);
      if (slot && count > slot.maxCapacity) {
        conflicts.push({
          slotId,
          slotTime: slot.time,
          currentCount: count,
          maxCapacity: slot.maxCapacity,
        });
      }
    });

    return conflicts;
  },

  submitLevel: () => {
    const state = get();
    const level = state.currentLevel;
    if (!level) return false;

    const conflicts = state.checkConflicts();
    const assignedCount = Object.keys(state.assignments).length;
    const totalCases = level.cases.length;

    if (conflicts.length > 0) {
      const conflictTimes = conflicts.map(c => `${c.slotTime}(${c.currentCount}/${c.maxCapacity})`).join('、');
      set({
        conflictMessage: `⚠️ 存在容量冲突：${conflictTimes}`,
      });
      setTimeout(() => set({ conflictMessage: null }), 2500);
      return false;
    }

    if (assignedCount < totalCases) {
      set({
        conflictMessage: `⚠️ 还有 ${totalCases - assignedCount} 个案件未排期，请先完成所有排期！`,
      });
      setTimeout(() => set({ conflictMessage: null }), 2500);
      return false;
    }

    state.endLevel(true);
    return true;
  },

  endLevel: (success) => {
    const state = get();
    const level = state.currentLevel;
    if (!level) return;

    const timeSpent = level.targetTime - state.timeRemaining;
    const satisfaction = state.satisfaction;
    
    let stars = 0;
    if (success) {
      if (satisfaction >= 90) stars = 3;
      else if (satisfaction >= 75) stars = 2;
      else stars = 1;
    }

    const levelStats = { ...state.levelStats };
    const currentStats = levelStats[level.id] || { completed: false, bestSatisfaction: 0, bestTime: Infinity, attempts: 0, stars: 0 };
    
    levelStats[level.id] = {
      completed: success || currentStats.completed,
      bestSatisfaction: Math.max(currentStats.bestSatisfaction, satisfaction),
      bestTime: success ? Math.min(currentStats.bestTime, timeSpent) : currentStats.bestTime,
      attempts: currentStats.attempts + 1,
      stars: Math.max(currentStats.stars, stars),
    };

    const unlockedLevels = [...state.unlockedLevels];
    if (success && !unlockedLevels.includes(level.id + 1) && levels.find(l => l.id === level.id + 1)) {
      unlockedLevels.push(level.id + 1);
    }

    const totalGames = state.totalGames + 1;
    const bestSatisfaction = Math.max(state.bestSatisfaction, satisfaction);
    const bestTime = success ? Math.min(state.bestTime, timeSpent) : state.bestTime;

    set({
      isPlaying: false,
      showResult: true,
      resultData: {
        success,
        satisfaction,
        timeSpent,
        stars,
      },
      levelStats,
      unlockedLevels,
      totalGames,
      bestSatisfaction,
      bestTime,
    });

    get().saveProgress();
  },

  confirmResult: () => {
    const state = get();
    if (state.resultData?.success) {
      set({ showResult: false, currentScreen: 'levelSelect' });
    } else {
      get().retryLevel();
    }
  },

  retryLevel: () => {
    const state = get();
    const level = state.currentLevel;
    if (!level) return;

    set({
      isPlaying: true,
      timeRemaining: level.targetTime,
      assignments: {},
      satisfaction: 0,
      showResult: false,
      resultData: null,
      selectedCase: null,
      showTutorial: false,
      conflictMessage: null,
      successMessage: null,
    });
  },

  resetLevel: () => {
    const state = get();
    const level = state.currentLevel;
    if (!level) return;

    set({
      timeRemaining: level.targetTime,
      assignments: {},
      satisfaction: 0,
      selectedCase: null,
      conflictMessage: null,
      successMessage: null,
    });
  },

  nextLevel: () => {
    const state = get();
    const currentLevelId = state.currentLevel?.id;
    if (!currentLevelId) return;

    const nextLevelId = currentLevelId + 1;
    if (state.unlockedLevels.includes(nextLevelId)) {
      get().startLevel(nextLevelId);
    } else {
      set({ currentScreen: 'levelSelect', showResult: false });
    }
  },

  setLeaderboardTab: (tab) => set({ leaderboardTab: tab }),

  getLeaderboard: () => {
    const state = get();
    const tab = state.leaderboardTab;
    
    const playerEntry = {
      rank: '-',
      name: state.playerName,
      score: tab === 'satisfaction' ? state.bestSatisfaction : (state.bestTime === Infinity ? '-' : state.bestTime),
      isPlayer: true,
    };

    const list = mockLeaderboard[tab] || [];
    
    let playerRank = -1;
    if (tab === 'satisfaction') {
      playerRank = list.filter(e => e.score > state.bestSatisfaction).length + 1;
    } else {
      playerRank = list.filter(e => e.score < (state.bestTime === Infinity ? 999 : state.bestTime)).length + 1;
    }
    
    playerEntry.rank = playerRank > 10 ? playerRank : playerRank;

    return { list, playerEntry, playerRank };
  },

  showTutorialStep: (step) => set({ showTutorial: true, tutorialStep: step }),
  
  nextTutorialStep: () => {
    const state = get();
    const level = state.currentLevel;
    if (!level?.tutorial) return;

    const nextStep = state.tutorialStep + 1;
    if (nextStep >= level.tutorial.length) {
      set({ showTutorial: false, tutorialStep: 0 });
      get().startGame();
    } else {
      set({ tutorialStep: nextStep });
    }
  },

  skipTutorial: () => {
    set({ showTutorial: false, tutorialStep: 0 });
    get().startGame();
  },

  setPlayerName: (name) => {
    set({ playerName: name });
    get().saveProgress();
  },
}));

function calculateSatisfaction(level, assignments) {
  if (level.cases.length === 0) return 0;

  let totalScore = 0;
  let maxScore = 0;

  level.cases.forEach(c => {
    const baseScore = 100;
    const priorityWeight = c.priority === 1 ? 1.5 : c.priority === 2 ? 1.2 : 1;
    maxScore += baseScore * priorityWeight;

    const assignedSlot = assignments[c.id];
    if (assignedSlot) {
      let score = baseScore * priorityWeight * 0.7;
      if (assignedSlot === c.preferredSlot) {
        score += baseScore * priorityWeight * 0.3;
      }
      totalScore += score;
    }
  });

  return maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
}
