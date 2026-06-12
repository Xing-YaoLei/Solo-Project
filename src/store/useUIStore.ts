import { create } from 'zustand';

interface UIState {
  showTaskPanel: boolean;
  showCluePanel: boolean;
  showDecisionPanel: boolean;
  showMemberProfile: boolean;
  showGameResult: boolean;
  showPauseMenu: boolean;
  showTutorial: boolean;
  activeTab: 'info' | 'transactions' | 'refunds' | 'benefits' | 'replays';
  currentMemberId: string | null;
  replaySpeed: number;
  isReplaying: boolean;
  replayCurrentTime: number;
  notification: { message: string; type: 'success' | 'error' | 'info' } | null;
  
  setShowTaskPanel: (show: boolean) => void;
  setShowCluePanel: (show: boolean) => void;
  setShowDecisionPanel: (show: boolean) => void;
  setShowMemberProfile: (show: boolean) => void;
  setShowGameResult: (show: boolean) => void;
  setShowPauseMenu: (show: boolean) => void;
  setShowTutorial: (show: boolean) => void;
  setActiveTab: (tab: UIState['activeTab']) => void;
  setCurrentMemberId: (id: string | null) => void;
  setReplaySpeed: (speed: number) => void;
  setIsReplaying: (replaying: boolean) => void;
  setReplayCurrentTime: (time: number) => void;
  showNotification: (message: string, type: 'success' | 'error' | 'info') => void;
  hideNotification: () => void;
  resetAllPanels: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  showTaskPanel: true,
  showCluePanel: true,
  showDecisionPanel: false,
  showMemberProfile: false,
  showGameResult: false,
  showPauseMenu: false,
  showTutorial: false,
  activeTab: 'info',
  currentMemberId: null,
  replaySpeed: 1,
  isReplaying: false,
  replayCurrentTime: 0,
  notification: null,

  setShowTaskPanel: (show) => set({ showTaskPanel: show }),
  setShowCluePanel: (show) => set({ showCluePanel: show }),
  setShowDecisionPanel: (show) => set({ showDecisionPanel: show }),
  setShowMemberProfile: (show) => set({ showMemberProfile: show }),
  setShowGameResult: (show) => set({ showGameResult: show }),
  setShowPauseMenu: (show) => set({ showPauseMenu: show }),
  setShowTutorial: (show) => set({ showTutorial: show }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setCurrentMemberId: (id) => set({ currentMemberId: id }),
  setReplaySpeed: (speed) => set({ replaySpeed: speed }),
  setIsReplaying: (replaying) => set({ isReplaying: replaying }),
  setReplayCurrentTime: (time) => set({ replayCurrentTime: time }),

  showNotification: (message, type) => {
    set({ notification: { message, type } });
    setTimeout(() => set({ notification: null }), 3000);
  },

  hideNotification: () => set({ notification: null }),

  resetAllPanels: () => set({
    showTaskPanel: true,
    showCluePanel: true,
    showDecisionPanel: false,
    showMemberProfile: false,
    showGameResult: false,
    showPauseMenu: false,
    activeTab: 'info',
  }),
}));
