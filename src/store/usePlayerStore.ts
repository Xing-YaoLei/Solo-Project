import { create } from 'zustand';
import type { Player, UnlockedLevel } from '@/types/game';
import { storage } from '@/utils/storage';
import { generateId } from '@/utils/scoring';

interface PlayerState {
  player: Player | null;
  unlockedLevels: UnlockedLevel[];
  isTutorialCompleted: boolean;
  initPlayer: (name?: string) => void;
  loadPlayer: () => void;
  updateTotalScore: (points: number) => void;
  setCurrentLevel: (level: number) => void;
  unlockLevel: (levelId: string, score: number, stars: number) => void;
  setTutorialCompleted: (completed: boolean) => void;
  resetPlayer: () => void;
}

const getDefaultPlayer = (name: string = '咖啡店长'): Player => ({
  id: generateId(),
  name,
  totalScore: 0,
  currentLevel: 1,
  createdAt: new Date().toISOString(),
});

const getDefaultUnlockedLevels = (): UnlockedLevel[] => [
  {
    saveId: 'initial',
    levelId: 'level-1',
    isUnlocked: true,
    bestScore: 0,
    stars: 0,
  },
];

export const usePlayerStore = create<PlayerState>((set, get) => ({
  player: null,
  unlockedLevels: [],
  isTutorialCompleted: false,

  initPlayer: (name?: string) => {
    const player = getDefaultPlayer(name);
    const unlockedLevels = getDefaultUnlockedLevels();
    
    storage.savePlayer(player);
    storage.saveUnlockedLevels(unlockedLevels);
    storage.saveTutorialCompleted(false);
    
    set({ player, unlockedLevels, isTutorialCompleted: false });
  },

  loadPlayer: () => {
    const savedPlayer = storage.loadPlayer<Player | null>(null);
    const savedUnlockedLevels = storage.loadUnlockedLevels<UnlockedLevel[]>([]);
    const tutorialCompleted = storage.loadTutorialCompleted();
    
    if (savedPlayer) {
      set({
        player: savedPlayer,
        unlockedLevels: savedUnlockedLevels.length > 0 ? savedUnlockedLevels : getDefaultUnlockedLevels(),
        isTutorialCompleted: tutorialCompleted,
      });
    }
  },

  updateTotalScore: (points: number) => {
    const { player } = get();
    if (!player) return;
    
    const updatedPlayer = {
      ...player,
      totalScore: player.totalScore + points,
    };
    
    storage.savePlayer(updatedPlayer);
    set({ player: updatedPlayer });
  },

  setCurrentLevel: (level: number) => {
    const { player } = get();
    if (!player) return;
    
    const updatedPlayer = {
      ...player,
      currentLevel: level,
    };
    
    storage.savePlayer(updatedPlayer);
    set({ player: updatedPlayer });
  },

  unlockLevel: (levelId: string, score: number, stars: number) => {
    const { unlockedLevels } = get();
    
    const existingIndex = unlockedLevels.findIndex((u) => u.levelId === levelId);
    let updatedUnlocked: UnlockedLevel[];
    
    if (existingIndex >= 0) {
      updatedUnlocked = [...unlockedLevels];
      updatedUnlocked[existingIndex] = {
        ...updatedUnlocked[existingIndex],
        isUnlocked: true,
        bestScore: Math.max(updatedUnlocked[existingIndex].bestScore, score),
        stars: Math.max(updatedUnlocked[existingIndex].stars, stars),
      };
    } else {
      updatedUnlocked = [
        ...unlockedLevels,
        {
          saveId: generateId(),
          levelId,
          isUnlocked: true,
          bestScore: score,
          stars,
        },
      ];
    }
    
    storage.saveUnlockedLevels(updatedUnlocked);
    set({ unlockedLevels: updatedUnlocked });
  },

  setTutorialCompleted: (completed: boolean) => {
    storage.saveTutorialCompleted(completed);
    set({ isTutorialCompleted: completed });
  },

  resetPlayer: () => {
    storage.removeFromStorage('coffee_game_player');
    storage.removeFromStorage('coffee_game_unlocked');
    storage.removeFromStorage('coffee_game_tutorial');
    storage.removeFromStorage('coffee_game_records');
    storage.removeFromStorage('coffee_game_replays');
    storage.removeFromStorage('coffee_game_save');
    
    set({
      player: null,
      unlockedLevels: [],
      isTutorialCompleted: false,
    });
  },
}));
