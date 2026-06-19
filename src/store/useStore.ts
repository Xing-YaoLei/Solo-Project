import { create } from 'zustand';
import type { Complaint, KPIData, SyncNode, DuckDBAnalysis } from '@/types';

interface Filters {
  region?: string;
  startDate?: string;
  endDate?: string;
}

interface AppState {
  kpiData: KPIData | null;
  complaints: Complaint[];
  selectedComplaint: Complaint | null;
  syncNodes: SyncNode[];
  selectedNode: SyncNode | null;
  duckdbAnalysis: DuckDBAnalysis | null;
  period: 'day' | 'week' | 'month';
  compareMode: 'none' | 'yoy' | 'mom';
  sidebarCollapsed: boolean;
  filters: Filters;
  
  setKPIData: (data: KPIData | null) => void;
  setComplaints: (complaints: Complaint[]) => void;
  setSelectedComplaint: (complaint: Complaint | null) => void;
  setSyncNodes: (nodes: SyncNode[]) => void;
  setSelectedNode: (node: SyncNode | null) => void;
  setDuckDBAnalysis: (data: DuckDBAnalysis | null) => void;
  setPeriod: (period: 'day' | 'week' | 'month') => void;
  setCompareMode: (mode: 'none' | 'yoy' | 'mom') => void;
  toggleSidebar: () => void;
  setFilters: (filters: Partial<Filters>) => void;
}

export const useStore = create<AppState>((set) => ({
  kpiData: null,
  complaints: [],
  selectedComplaint: null,
  syncNodes: [],
  selectedNode: null,
  duckdbAnalysis: null,
  period: 'week',
  compareMode: 'none',
  sidebarCollapsed: false,
  filters: {},
  
  setKPIData: (data) => set({ kpiData: data }),
  setComplaints: (complaints) => set({ complaints }),
  setSelectedComplaint: (complaint) => set({ selectedComplaint: complaint }),
  setSyncNodes: (nodes) => set({ syncNodes: nodes }),
  setSelectedNode: (node) => set({ selectedNode: node }),
  setDuckDBAnalysis: (data) => set({ duckdbAnalysis: data }),
  setPeriod: (period) => set({ period }),
  setCompareMode: (mode) => set({ compareMode: mode }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setFilters: (newFilters) => set((state) => ({ filters: { ...state.filters, ...newFilters } })),
}));
