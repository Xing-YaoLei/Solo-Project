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
  currentUserId: string;
  assignedProjectIds: string[];
  useMockData: boolean;
  isLoading: boolean;
  materialEntries: MaterialEntry[];
  batches: Batch[];
  importBatches: ImportBatch[];
  suppliers: Supplier[];
  requisitions: Requisition[];
  kpiData: KpiData;
  alerts: AlertItem[];
  sidebarCollapsed: boolean;
  lastImportBatchId: string | null;

  setCurrentUserRole: (role: "ADMIN" | "STAFF") => void;
  setUseMockData: (useMock: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setLastImportBatchId: (id: string | null) => void;

  fetchAllData: () => Promise<void>;
  fetchMaterialEntries: () => Promise<void>;
  fetchBatches: () => Promise<void>;
  fetchImportBatches: () => Promise<void>;
  fetchSuppliers: () => Promise<void>;
  fetchRequisitions: () => Promise<void>;
  fetchKpiData: () => Promise<void>;
  fetchAlerts: () => Promise<void>;

  addShortageNote: (entryId: string, note: string) => Promise<void>;
  addMaterialEntry: (entry: Partial<MaterialEntry>) => Promise<void>;
  addRequisition: (req: Partial<Requisition>) => Promise<void>;
}

const STAFF_PROJECT_IDS = ["p-1", "p-2"];
const ADMIN_PROJECT_IDS = ["p-1", "p-2", "p-3", "p-4"];

function filterMaterialEntriesByProject(
  entries: MaterialEntry[],
  batches: Batch[],
  projectIds: string[],
  role: "ADMIN" | "STAFF"
): MaterialEntry[] {
  if (role === "ADMIN") return entries;
  return entries.filter((entry) => {
    const batch = batches.find((b) => b.id === entry.batchId);
    const projectId = batch?.projectId;
    return projectId && projectIds.includes(projectId);
  });
}

function filterBatchesByProject(
  batches: Batch[],
  projectIds: string[],
  role: "ADMIN" | "STAFF"
): Batch[] {
  if (role === "ADMIN") return batches;
  return batches.filter((batch) => projectIds.includes(batch.projectId));
}

function filterRequisitionsByProject(
  reqs: Requisition[],
  projectIds: string[],
  role: "ADMIN" | "STAFF"
): Requisition[] {
  if (role === "ADMIN") return reqs;
  return reqs.filter((req) => projectIds.includes(req.projectId));
}

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  currentUserRole: "ADMIN",
  currentUserId: "u-1",
  assignedProjectIds: ADMIN_PROJECT_IDS,
  useMockData: true,
  isLoading: false,
  materialEntries: mockMaterialEntries,
  batches: mockBatches,
  importBatches: mockImportBatches,
  suppliers: mockSuppliers,
  requisitions: mockRequisitions,
  kpiData: getKpiData(),
  alerts: getAlerts(),
  sidebarCollapsed: false,
  lastImportBatchId: null,

  setCurrentUserRole: (role) => {
    const projectIds = role === "ADMIN" ? ADMIN_PROJECT_IDS : STAFF_PROJECT_IDS;

    set({
      currentUserRole: role,
      assignedProjectIds: projectIds,
      currentUserId: role === "ADMIN" ? "u-1" : "u-2",
    });

    const state = get();
    if (state.useMockData) {
      const filteredEntries = filterMaterialEntriesByProject(
        mockMaterialEntries,
        mockBatches,
        projectIds,
        role
      );
      const filteredBatches = filterBatchesByProject(
        mockBatches,
        projectIds,
        role
      );
      const filteredReqs = filterRequisitionsByProject(
        mockRequisitions,
        projectIds,
        role
      );

      const inStockCount = filteredEntries
        .filter((e) => e.status === "IN_STOCK")
        .reduce((s, e) => s + e.quantity, 0);
      const reclaimedEntries = filteredEntries.filter(
        (e) => e.status === "RECLAIMED"
      );
      const reclaimedCount = reclaimedEntries.length;

      let avgTurnover = 0;
      if (reclaimedCount > 0) {
        const total = reclaimedEntries.reduce((s, e) => {
          const entry = e as MaterialEntry & { turnoverDays?: number };
          return s + (entry.turnoverDays || 0);
        }, 0);
        avgTurnover = total / reclaimedCount;
      }

      const shortageCount = filteredBatches.filter(
        (b) => b.status === "SHORTAGE"
      ).length;

      set({
        materialEntries: filteredEntries,
        batches: filteredBatches,
        requisitions: filteredReqs,
        kpiData: {
          monthlyTotal: filteredEntries.reduce((s, e) => s + e.quantity, 0),
          inStockTotal: inStockCount,
          avgTurnoverDays: Math.round(avgTurnover),
          shortageBatchCount: shortageCount,
        },
        alerts: getAlerts().slice(0, 10),
      });
    } else {
      get().fetchAllData();
    }
  },

  setUseMockData: (useMock) => {
    set({ useMockData: useMock });
    if (!useMock) {
      get().fetchAllData();
    } else {
      const role = get().currentUserRole;
      const projectIds =
        role === "ADMIN" ? ADMIN_PROJECT_IDS : STAFF_PROJECT_IDS;
      set({
        materialEntries: filterMaterialEntriesByProject(
          mockMaterialEntries,
          mockBatches,
          projectIds,
          role
        ),
        batches: filterBatchesByProject(mockBatches, projectIds, role),
        importBatches: mockImportBatches,
        suppliers: mockSuppliers,
        requisitions: filterRequisitionsByProject(
          mockRequisitions,
          projectIds,
          role
        ),
        kpiData: getKpiData(),
        alerts: getAlerts(),
      });
    }
  },

  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  setLastImportBatchId: (id) => set({ lastImportBatchId: id }),

  fetchAllData: async () => {
    set({ isLoading: true });
    try {
      await Promise.all([
        get().fetchMaterialEntries(),
        get().fetchBatches(),
        get().fetchImportBatches(),
        get().fetchSuppliers(),
        get().fetchRequisitions(),
        get().fetchKpiData(),
        get().fetchAlerts(),
      ]);
    } catch (error) {
      console.error("加载数据失败:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMaterialEntries: async () => {
    try {
      const state = get();
      const res = await fetch(
        `/api/materials?page=1&pageSize=100&mock=${state.useMockData}`
      );
      const data = await res.json();
      const entries = state.useMockData ? data.data || data : data.data || [];

      const filtered = filterMaterialEntriesByProject(
        entries,
        state.batches,
        state.assignedProjectIds,
        state.currentUserRole
      );
      set({ materialEntries: filtered });
    } catch (error) {
      console.error("获取材料列表失败:", error);
    }
  },

  fetchBatches: async () => {
    try {
      const state = get();
      const res = await fetch(`/api/batches?mock=${state.useMockData}`);
      const data = await res.json();
      const batches = Array.isArray(data) ? data : data.data || [];

      const filtered = filterBatchesByProject(
        batches,
        state.assignedProjectIds,
        state.currentUserRole
      );
      set({ batches: filtered });
    } catch (error) {
      console.error("获取批次列表失败:", error);
    }
  },

  fetchImportBatches: async () => {
    try {
      const state = get();
      const res = await fetch(
        `/api/import?page=1&pageSize=20&mock=${state.useMockData}`
      );
      const data = await res.json();
      set({ importBatches: data.data || data || [] });
    } catch (error) {
      console.error("获取导入批次失败:", error);
    }
  },

  fetchSuppliers: async () => {
    try {
      const state = get();
      const res = await fetch(`/api/suppliers?mock=${state.useMockData}`);
      const data = await res.json();
      set({ suppliers: data || [] });
    } catch (error) {
      console.error("获取供应商列表失败:", error);
    }
  },

  fetchRequisitions: async () => {
    try {
      const state = get();
      const res = await fetch(`/api/requisitions?mock=${state.useMockData}`);
      const data = await res.json();
      const reqs = Array.isArray(data) ? data : data.data || [];

      const filtered = filterRequisitionsByProject(
        reqs,
        state.assignedProjectIds,
        state.currentUserRole
      );
      set({ requisitions: filtered });
    } catch (error) {
      console.error("获取领用记录失败:", error);
    }
  },

  fetchKpiData: async () => {
    try {
      const state = get();
      const res = await fetch(
        `/api/analytics?type=kpi&mock=${state.useMockData}`
      );
      const data = await res.json();
      set({ kpiData: data });
    } catch (error) {
      console.error("获取KPI数据失败:", error);
    }
  },

  fetchAlerts: async () => {
    try {
      const state = get();
      const res = await fetch(
        `/api/analytics?type=alerts&mock=${state.useMockData}`
      );
      const data = await res.json();
      const alerts: AlertItem[] = data || [];
      set({ alerts: alerts.slice(0, 10) });
    } catch (error) {
      console.error("获取预警数据失败:", error);
    }
  },

  addShortageNote: async (entryId, note) => {
    try {
      const state = get();

      if (state.useMockData) {
        set((prev) => {
          const newAlerts: AlertItem[] = [
            {
              id: `alert-s-${Date.now()}`,
              type: "SHORTAGE",
              message: note ? `材料短缺: ${note}` : "短缺已更新",
              batchNo: "",
              timestamp: new Date().toISOString().split("T")[0],
            },
            ...prev.alerts,
          ];
          return {
            materialEntries: prev.materialEntries.map((e) =>
              e.id === entryId
                ? {
                    ...e,
                    shortageNote: note,
                    shortageNoteBy: state.currentUserId,
                    shortageNoteAt: new Date().toISOString(),
                  }
                : e
            ),
            alerts: newAlerts.slice(0, 10),
          };
        });
        return;
      }

      const res = await fetch(`/api/shortage-note?id=${entryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shortageNote: note }),
      });

      if (res.ok) {
        await Promise.all([
          get().fetchMaterialEntries(),
          get().fetchAlerts(),
        ]);
      }
    } catch (error) {
      console.error("添加短缺注释失败:", error);
    }
  },

  addMaterialEntry: async (entry) => {
    try {
      const state = get();
      if (state.useMockData) return;

      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });

      if (res.ok) {
        await get().fetchMaterialEntries();
      }
    } catch (error) {
      console.error("添加材料记录失败:", error);
    }
  },

  addRequisition: async (req) => {
    try {
      const state = get();
      if (state.useMockData) return;

      const res = await fetch("/api/requisitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });

      if (res.ok) {
        await Promise.all([
          get().fetchRequisitions(),
          get().fetchMaterialEntries(),
        ]);
      }
    } catch (error) {
      console.error("添加领用记录失败:", error);
    }
  },
}));
