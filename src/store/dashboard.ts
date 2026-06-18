import { create } from 'zustand';

interface DashboardState {
  selectedDateRange: {
    start: string;
    end: string;
  };
  selectedRegion: string | null;
  selectedStoreIds: string[];
  alertRefreshInterval: number;
}

interface DashboardActions {
  setDateRange: (range: { start: string; end: string }) => void;
  setSelectedRegion: (region: string | null) => void;
  toggleStoreId: (storeId: string) => void;
  setAlertRefreshInterval: (interval: number) => void;
}

export const useDashboardStore = create<DashboardState & DashboardActions>((set) => ({
  selectedDateRange: {
    start: '',
    end: '',
  },
  selectedRegion: null,
  selectedStoreIds: [],
  alertRefreshInterval: 30000,

  setDateRange: (range) => set({ selectedDateRange: range }),
  setSelectedRegion: (region) => set({ selectedRegion: region }),
  toggleStoreId: (storeId) =>
    set((state) => ({
      selectedStoreIds: state.selectedStoreIds.includes(storeId)
        ? state.selectedStoreIds.filter((id) => id !== storeId)
        : [...state.selectedStoreIds, storeId],
    })),
  setAlertRefreshInterval: (interval) => set({ alertRefreshInterval: interval }),
}));
