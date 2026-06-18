import { create } from "zustand";
import { MaterialEntry, Batch, ImportBatch, Supplier, Requisition, KpiData, AlertItem } from "@/types";
import {
  mockMaterialEntries,
  mockBatches,
  mockImportBatches,
  mockSuppliers,
  mockRequisitions,
  getKpiData,
  getAlerts,
} from "@/lib/mock-data";

interface DashboardStore {
  currentUserRole: "ADMIN" | "STAFF";
  currentProjectFilter: string | null;
  materialEntries: MaterialEntry[];
  batches: Batch[];
  importBatches: ImportBatch[];
  suppliers: Supplier[];
  requisitions: Requisition[];
  kpiData: KpiData;
  alerts: AlertItem[];
  sidebarCollapsed: boolean;

  setCurrentUserRole: (role: "ADMIN" | "STAFF") => void;
  setCurrentProjectFilter: (project: string | null) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  addShortageNote: (entryId: string, note: string) => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  currentUserRole: "ADMIN",
  currentProjectFilter: null,
  materialEntries: mockMaterialEntries,
  batches: mockBatches,
  importBatches: mockImportBatches,
  suppliers: mockSuppliers,
  requisitions: mockRequisitions,
  kpiData: getKpiData(),
  alerts: getAlerts(),
  sidebarCollapsed: false,

  setCurrentUserRole: (role) => set({ currentUserRole: role }),
  setCurrentProjectFilter: (project) => set({ currentProjectFilter: project }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  addShortageNote: (entryId, note) =>
    set((state) => ({
      materialEntries: state.materialEntries.map((e) =>
        e.id === entryId
          ? { ...e, shortageNote: note, shortageNoteBy: "u-1", shortageNoteAt: new Date().toISOString() }
          : e
      ),
    })),
}));
