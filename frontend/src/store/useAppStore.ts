import { create } from 'zustand';
import type { CompareMode } from '@/types';

interface ActivityOption {
  id: string;
  name: string;
}

interface AppState {
  startDate: string;
  endDate: string;
  compareMode: CompareMode;
  sidebarCollapsed: boolean;
  selectedSponsorshipId: string | null;
  selectedRefundId: string | null;
  currentActivityId: string;
  currentActivityName: string;
  activityOptions: ActivityOption[];

  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  setDateRange: (start: string, end: string) => void;
  setCompareMode: (mode: CompareMode) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSelectedSponsorshipId: (id: string | null) => void;
  setSelectedRefundId: (id: string | null) => void;
  setCurrentActivity: (id: string, name: string) => void;
  setActivityOptions: (options: ActivityOption[]) => void;
  resetFilters: () => void;
}

function getDefaultDateRange() {
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const format = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  return {
    startDate: format(thirtyDaysAgo),
    endDate: format(today),
  };
}

const defaultRange = getDefaultDateRange();

export const useAppStore = create<AppState>((set) => ({
  startDate: defaultRange.startDate,
  endDate: defaultRange.endDate,
  compareMode: 'none',
  sidebarCollapsed: false,
  selectedSponsorshipId: null,
  selectedRefundId: null,
  currentActivityId: 'act-001',
  currentActivityName: '2026 MP0415 春季盛典',
  activityOptions: [
    { id: 'act-001', name: '2026 MP0415 春季盛典' },
    { id: 'act-002', name: '2025 MP0415 年终大会' },
    { id: 'act-003', name: '2025 MP0415 嘉年华' },
  ],

  setStartDate: (date) => set({ startDate: date }),
  setEndDate: (date) => set({ endDate: date }),
  setDateRange: (start, end) => set({ startDate: start, endDate: end }),
  setCompareMode: (mode) => set({ compareMode: mode }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setSelectedSponsorshipId: (id) => set({ selectedSponsorshipId: id }),
  setSelectedRefundId: (id) => set({ selectedRefundId: id }),
  setCurrentActivity: (id, name) => set({ currentActivityId: id, currentActivityName: name }),
  setActivityOptions: (options) => set({ activityOptions: options }),
  resetFilters: () =>
    set({
      compareMode: 'none',
      selectedSponsorshipId: null,
      selectedRefundId: null,
    }),
}));

export default useAppStore;
