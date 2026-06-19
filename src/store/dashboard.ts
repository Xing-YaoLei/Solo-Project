import { create } from 'zustand';
import {
  DashboardData,
  WorkorderTrendPoint,
  InventoryCategoryData,
  Quote,
  Inspection,
  User,
} from '@/types';
import {
  MOCK_USER,
  getMockDashboardData,
  getMockWorkorderTrend,
  getMockInventoryData,
  getMockQuotes,
  getMockInspections,
} from '@/lib/mockData';

interface DashboardState {
  user: User;
  dashboardData: DashboardData | null;
  workorderTrend: WorkorderTrendPoint[];
  inventoryData: InventoryCategoryData[];
  quotes: Quote[];
  inspections: Inspection[];
  isLoading: boolean;
  isExportModalOpen: boolean;
  isShareModalOpen: boolean;
  expandedQuoteId: string | null;

  loadAllData: () => Promise<void>;
  refreshData: () => Promise<void>;
  toggleQuoteExpand: (id: string) => void;
  setExportModalOpen: (open: boolean) => void;
  setShareModalOpen: (open: boolean) => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  user: MOCK_USER,
  dashboardData: null,
  workorderTrend: [],
  inventoryData: [],
  quotes: [],
  inspections: [],
  isLoading: true,
  isExportModalOpen: false,
  isShareModalOpen: false,
  expandedQuoteId: null,

  loadAllData: async () => {
    set({ isLoading: true });
    await new Promise((r) => setTimeout(r, 600));
    set({
      dashboardData: getMockDashboardData(),
      workorderTrend: getMockWorkorderTrend(),
      inventoryData: getMockInventoryData(),
      quotes: getMockQuotes(),
      inspections: getMockInspections(),
      isLoading: false,
    });
  },

  refreshData: async () => {
    set({ isLoading: true });
    await new Promise((r) => setTimeout(r, 800));
    set({
      dashboardData: getMockDashboardData(),
      workorderTrend: getMockWorkorderTrend(),
      inventoryData: getMockInventoryData(),
      quotes: getMockQuotes(),
      inspections: getMockInspections(),
      isLoading: false,
    });
  },

  toggleQuoteExpand: (id: string) => {
    const current = get().expandedQuoteId;
    set({ expandedQuoteId: current === id ? null : id });
  },

  setExportModalOpen: (open: boolean) => set({ isExportModalOpen: open }),
  setShareModalOpen: (open: boolean) => set({ isShareModalOpen: open }),
}));
