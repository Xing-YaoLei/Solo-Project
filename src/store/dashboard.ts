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
  shareToken: string | null;
  shareSignature: string | null;

  loadAllData: () => Promise<void>;
  refreshData: () => Promise<void>;
  toggleQuoteExpand: (id: string) => void;
  setExportModalOpen: (open: boolean) => void;
  setShareModalOpen: (open: boolean) => void;
  setShareContext: (role: string, scope: string[], token?: string, signature?: string) => void;
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
  shareToken: null,
  shareSignature: null,

  loadAllData: async () => {
    set({ isLoading: true });

    try {
      const { shareToken, shareSignature } = get();
      const hasToken = !!shareToken;
      const tokenParam = hasToken ? `shareToken=${encodeURIComponent(shareToken!)}` : '';
      const sigParam = shareSignature ? `sig=${encodeURIComponent(shareSignature)}` : '';
      const shareQs = hasToken ? (sigParam ? `${tokenParam}&${sigParam}` : tokenParam) : '';
      const dashQs = shareQs ? `?${shareQs}` : '';
      const qs2 = shareQs ? `&${shareQs}` : '';

      const [userRes, dashboardRes, trendRes, inventoryRes, quotesRes, inspectionsRes] =
        await Promise.all([
          fetch('/api/auth/me'),
          fetch(`/api/dashboard${dashQs}`),
          fetch(`/api/workorders/trend?days=30${qs2}`),
          fetch(`/api/inventory${dashQs}`),
          fetch(`/api/quotes${dashQs}`),
          fetch(`/api/inspections${dashQs}`),
        ]);

      const user = userRes.ok ? await userRes.json() : null;
      const dashboardData = dashboardRes.ok ? await dashboardRes.json() : null;
      const workorderTrend = trendRes.ok ? await trendRes.json() : [];
      const inventoryData = inventoryRes.ok ? await inventoryRes.json() : [];
      const quotes = quotesRes.ok ? await quotesRes.json() : [];
      const inspections = inspectionsRes.ok ? await inspectionsRes.json() : [];

      set({
        user,
        dashboardData,
        workorderTrend,
        inventoryData,
        quotes,
        inspections,
        isLoading: false,
      });
    } catch (error) {
      console.error('[dashboard store] 加载数据失败:', error);
      set({ isLoading: false });
    }
  },

  refreshData: async () => {
    await get().loadAllData();
  },

  toggleQuoteExpand: (id: string) => {
    const current = get().expandedQuoteId;
    set({ expandedQuoteId: current === id ? null : id });
  },

  setExportModalOpen: (open: boolean) => set({ isExportModalOpen: open }),
  setShareModalOpen: (open: boolean) => set({ isShareModalOpen: open }),

  setShareContext: (role, scope, token, signature) => {
    set({ shareRole: role, shareScope: scope, shareToken: token || null, shareSignature: signature || null });
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
