import { create } from 'zustand';
import type { GameState, Vehicle, DiagnosisItem, RepairItem, SceneKey } from '@/types';
import { isTutorialComplete } from '@/utils/Storage';

interface GameStore extends GameState {
  setScene: (scene: SceneKey) => void;
  setLevel: (level: number) => void;
  setVehicle: (vehicle: Vehicle | null) => void;
  setDiagnosisResults: (results: DiagnosisItem[]) => void;
  toggleRepairItem: (itemId: string) => void;
  setAvailableRepairItems: (items: RepairItem[]) => void;
  clearSelectedItems: () => void;
  setStartTime: (time: number) => void;
  setTutorialStep: (step: number) => void;
  resetLevel: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  currentScene: 'Boot',
  currentLevel: 1,
  currentVehicle: null,
  diagnosisResults: [],
  selectedRepairItems: [],
  availableRepairItems: [],
  startTime: 0,
  isFirstPlay: !isTutorialComplete(),
  tutorialStep: 0,
  levelStartTime: 0,

  setScene: (scene) => set({ currentScene: scene }),
  setLevel: (level) => set({ currentLevel: level }),
  setVehicle: (vehicle) => set({ currentVehicle: vehicle }),
  setDiagnosisResults: (results) => set({ diagnosisResults: results }),

  toggleRepairItem: (itemId) => {
    const current = get().selectedRepairItems;
    if (current.includes(itemId)) {
      set({ selectedRepairItems: current.filter(id => id !== itemId) });
    } else {
      set({ selectedRepairItems: [...current, itemId] });
    }
  },

  setAvailableRepairItems: (items) => set({ availableRepairItems: items }),
  clearSelectedItems: () => set({ selectedRepairItems: [] }),
  setStartTime: (time) => set({ startTime: time, levelStartTime: time }),
  setTutorialStep: (step) => set({ tutorialStep: step }),

  resetLevel: () => set({
    selectedRepairItems: [],
    diagnosisResults: [],
    currentVehicle: null,
    availableRepairItems: [],
    startTime: 0,
    levelStartTime: Date.now()
  }),

  resetGame: () => set({
    currentScene: 'Menu',
    currentLevel: 1,
    currentVehicle: null,
    diagnosisResults: [],
    selectedRepairItems: [],
    availableRepairItems: [],
    startTime: 0,
    tutorialStep: 0,
    levelStartTime: Date.now()
  })
}));
