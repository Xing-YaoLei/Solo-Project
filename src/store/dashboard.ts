import { create } from 'zustand';
import {
  DashboardData,
  WorkorderTrendPoint,
  InventoryCategoryData,
  Quote,
  Inspection,
  User,
} from '@/types';

interface DashboardState {
  user: User | null;
  dashboardData: DashboardData | null;
  workorderTrend: WorkorderTrendPoint[];
  inventoryData: InventoryCategoryData[];
  quotes: Quote[];
  inspections: Inspection[];
  isLoading: boolean;
  isExportModalOpen: boolean;
  isShareModalOpen: boolean;
  expandedQuoteId: string | null;
  shareScope: string[] | null;
  shareRole: string | null;

  loadAllData: (scope?: string[]) => Promise<void>;
  refreshData: () => Promise<void>;
  toggleQuoteExpand: (id: string) => void;
  setExportModalOpen: (open: boolean) => void;
  setShareModalOpen: (open: boolean) => void;
  setShareContext: (role: string, scope: string[]) => void;
  hasPermission: (permission: string) => boolean;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  user: null,
  dashboardData: null,
  workorderTrend: [],
  inventoryData: [],
  quotes: [],
  inspections: [],
  isLoading: true,
  isExportModalOpen: false,
  isShareModalOpen: false,
  expandedQuoteId: null,
  shareScope: null,
  shareRole: null,

  loadAllData: async (scope) => {
    set({ isLoading: true });

    try {
      const [userRes, dashboardRes, trendRes, inventoryRes, quotesRes, inspectionsRes] =
        await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/dashboard'),
          fetch('/api/workorders/trend?days=30'),
          fetch('/api/inventory'),
          fetch('/api/quotes'),
          fetch('/api/inspections'),
        ]);

      const user = userRes.ok ? await userRes.json() : null;
      const dashboardData = dashboardRes.ok ? await dashboardRes.json() : null;
      const workorderTrend = trendRes.ok ? await trendRes.json() : [];
      const inventoryData = inventoryRes.ok ? await inventoryRes.json() : [];
      const quotes = quotesRes.ok ? await quotesRes.json() : [];
      const inspections = inspectionsRes.ok ? await inspectionsRes.json() : [];

      if (scope && scope.length > 0) {
        const filteredQuotes = scope.includes('quotes:view') ? quotes : [];
        const filteredInspections = scope.includes('inspection:view') ? inspections : [];
        const filteredInventory = scope.includes('inventory:view') ? inventoryData : [];
        const filteredTrend = scope.includes('dashboard:view') ? workorderTrend : [];
        const filteredDashboard = scope.includes('dashboard:view') ? dashboardData : null;

        set({
          user,
          dashboardData: filteredDashboard,
          workorderTrend: filteredTrend,
          inventoryData: filteredInventory,
          quotes: filteredQuotes,
          inspections: filteredInspections,
          isLoading: false,
        });
      } else {
        set({
          user,
          dashboardData,
          workorderTrend,
          inventoryData,
          quotes,
          inspections,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('[dashboard store] 加载数据失败:', error);
      set({ isLoading: false });
    }
  },

  refreshData: async () => {
    const { shareScope } = get();
    await get().loadAllData(shareScope || undefined);
  },

  toggleQuoteExpand: (id: string) => {
    const current = get().expandedQuoteId;
    set({ expandedQuoteId: current === id ? null : id });
  },

  setExportModalOpen: (open: boolean) => set({ isExportModalOpen: open }),
  setShareModalOpen: (open: boolean) => set({ isShareModalOpen: open }),

  setShareContext: (role, scope) => {
    set({ shareRole: role, shareScope: scope });
  },

  hasPermission: (permission) => {
    const { shareScope, user } = get();
    if (shareScope) {
      return shareScope.includes(permission);
    }
    if (user?.role === 'admin') return true;
    return false;
  },
}));
