import { create } from 'zustand';
import type { DashboardOverview, SeatTrendDataPoint, AreaHeatmapData, OrderComposition, TicketTypeDetail, LockRecordDetail, OccupancyRateSpec } from '@/types';

interface DashboardState {
  overview: DashboardOverview | null;
  seatTrend: SeatTrendDataPoint[];
  areaHeatmap: AreaHeatmapData[];
  orderComposition: OrderComposition | null;
  ticketTypes: TicketTypeDetail[];
  lockRecords: LockRecordDetail[];
  lockRecordsTotal: number;
  anomalyCount: number;
  lastRefreshedAt: Date | null;
  isLoading: boolean;
  error: string | null;
  selectedActivityId: string | null;
  refreshData: () => Promise<void>;
  fetchOverview: () => Promise<void>;
  fetchSeatTrend: () => Promise<void>;
  fetchOrderComposition: () => Promise<void>;
  fetchTicketTypes: () => Promise<void>;
  fetchLockRecords: (page?: number, pageSize?: number, anomalyOnly?: boolean) => Promise<void>;
  setSelectedActivityId: (id: string | null) => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  overview: null,
  seatTrend: [],
  areaHeatmap: [],
  orderComposition: null,
  ticketTypes: [],
  lockRecords: [],
  lockRecordsTotal: 0,
  anomalyCount: 0,
  lastRefreshedAt: null,
  isLoading: false,
  error: null,
  selectedActivityId: null,

  setSelectedActivityId: (id) => set({ selectedActivityId: id }),

  fetchOverview: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/dashboard/overview');
      const data = await res.json();
      if (data.success) {
        set({
          overview: data.data,
          lastRefreshedAt: new Date(data.data.lastRefreshedAt),
        });
      }
    } catch (error) {
      set({ error: 'Failed to fetch overview data' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSeatTrend: async () => {
    set({ isLoading: true, error: null });
    try {
      const { selectedActivityId } = get();
      const params = new URLSearchParams();
      if (selectedActivityId) params.set('activityId', selectedActivityId);
      
      const res = await fetch(`/api/dashboard/seat-trend?${params}`);
      const data = await res.json();
      if (data.success) {
        set({
          seatTrend: data.data.trend,
          areaHeatmap: data.data.heatmap,
          lastRefreshedAt: new Date(data.data.lastRefreshedAt),
        });
      }
    } catch (error) {
      set({ error: 'Failed to fetch seat trend data' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchOrderComposition: async () => {
    set({ isLoading: true, error: null });
    try {
      const { selectedActivityId } = get();
      const params = new URLSearchParams();
      if (selectedActivityId) params.set('activityId', selectedActivityId);
      
      const res = await fetch(`/api/dashboard/orders?${params}`);
      const data = await res.json();
      if (data.success) {
        set({
          orderComposition: data.data,
          lastRefreshedAt: new Date(data.data.lastRefreshedAt),
        });
      }
    } catch (error) {
      set({ error: 'Failed to fetch order composition data' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchTicketTypes: async () => {
    set({ isLoading: true, error: null });
    try {
      const { selectedActivityId } = get();
      const params = new URLSearchParams();
      if (selectedActivityId) params.set('activityId', selectedActivityId);
      
      const res = await fetch(`/api/dashboard/ticket-types?${params}`);
      const data = await res.json();
      if (data.success) {
        set({
          ticketTypes: data.data.ticketTypes,
          lastRefreshedAt: new Date(data.data.lastRefreshedAt),
        });
      }
    } catch (error) {
      set({ error: 'Failed to fetch ticket types data' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchLockRecords: async (page = 1, pageSize = 20, anomalyOnly = false) => {
    set({ isLoading: true, error: null });
    try {
      const { selectedActivityId } = get();
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      params.set('anomalyOnly', String(anomalyOnly));
      if (selectedActivityId) params.set('activityId', selectedActivityId);
      
      const res = await fetch(`/api/dashboard/lock-records?${params}`);
      const data = await res.json();
      if (data.success) {
        set({
          lockRecords: data.data.records,
          lockRecordsTotal: data.data.total,
          anomalyCount: data.data.anomalyCount,
          lastRefreshedAt: new Date(data.data.lastRefreshedAt),
        });
      }
    } catch (error) {
      set({ error: 'Failed to fetch lock records' });
    } finally {
      set({ isLoading: false });
    }
  },

  refreshData: async () => {
    const { fetchOverview, fetchSeatTrend, fetchOrderComposition, fetchTicketTypes, fetchLockRecords } = get();
    await Promise.all([
      fetchOverview(),
      fetchSeatTrend(),
      fetchOrderComposition(),
      fetchTicketTypes(),
      fetchLockRecords(),
    ]);
  },
}));
