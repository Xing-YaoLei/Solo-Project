import { create } from 'zustand';
import type { BatchStatus } from '@/types';

interface FilterState {
  status: BatchStatus[];
  dateRange: [string, string] | null;
  region: string[];
  responsiblePerson: string[];
  category: string[];
  keyword: string;
}

interface AppState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  inventoryFilters: FilterState;
  setInventoryFilters: (filters: Partial<FilterState>) => void;
  resetInventoryFilters: () => void;
}

const initialFilters: FilterState = {
  status: [],
  dateRange: null,
  region: [],
  responsiblePerson: [],
  category: [],
  keyword: '',
};

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  inventoryFilters: initialFilters,
  setInventoryFilters: (filters) => set(state => ({
    inventoryFilters: { ...state.inventoryFilters, ...filters },
  })),
  resetInventoryFilters: () => set({ inventoryFilters: initialFilters }),
}));
