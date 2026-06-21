import { create } from 'zustand';
import { verificationRecordsApi, ridersApi } from '@/api';
import type { VerificationRecord, Rider } from '@/types';

interface AppState {
  isMobile: boolean;
  setIsMobile: (value: boolean) => void;

  verificationRecords: VerificationRecord[];
  totalCount: number;
  loadingRecords: boolean;
  fetchRecords: (params?: {
    pageIndex?: number;
    pageSize?: number;
    status?: string;
    stage?: string;
    riderId?: string;
    keyword?: string;
  }) => Promise<void>;

  currentRecord: VerificationRecord | null;
  loadingRecord: boolean;
  fetchRecordDetail: (id: string) => Promise<void>;

  riders: Rider[];
  riderActivity: Record<string, unknown> | null;
  loadingRiders: boolean;
  fetchRiders: (params?: {
    pageIndex?: number;
    pageSize?: number;
    status?: string;
    keyword?: string;
  }) => Promise<void>;
  fetchRiderActivity: (riderId: string, startDate: string, endDate: string) => Promise<void>;

  selectedRecordId: string | null;
  setSelectedRecordId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isMobile: window.innerWidth < 768,
  setIsMobile: (value) => set({ isMobile: value }),

  verificationRecords: [],
  totalCount: 0,
  loadingRecords: false,
  fetchRecords: async (params) => {
    set({ loadingRecords: true });
    try {
      const response = await verificationRecordsApi.getList(params);
      const data = response.data;
      set({
        verificationRecords: data.items,
        totalCount: data.totalCount,
      });
    } catch {
      set({ verificationRecords: [], totalCount: 0 });
    } finally {
      set({ loadingRecords: false });
    }
  },

  currentRecord: null,
  loadingRecord: false,
  fetchRecordDetail: async (id) => {
    set({ loadingRecord: true });
    try {
      const response = await verificationRecordsApi.getById(id);
      set({ currentRecord: response.data });
    } catch {
      set({ currentRecord: null });
    } finally {
      set({ loadingRecord: false });
    }
  },

  riders: [],
  riderActivity: null,
  loadingRiders: false,
  fetchRiders: async (params) => {
    set({ loadingRiders: true });
    try {
      const response = await ridersApi.getList(params);
      const data = response.data;
      set({ riders: data.items });
    } catch {
      set({ riders: [] });
    } finally {
      set({ loadingRiders: false });
    }
  },
  fetchRiderActivity: async (riderId, startDate, endDate) => {
    try {
      const response = await ridersApi.getActivityAnalysis({ riderId, startDate, endDate });
      set({ riderActivity: response.data as Record<string, unknown> });
    } catch {
      set({ riderActivity: null });
    }
  },

  selectedRecordId: null,
  setSelectedRecordId: (id) => set({ selectedRecordId: id }),
}));
