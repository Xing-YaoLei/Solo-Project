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
  addImportResult: (result: ImportResult) => void;
}

interface ImportResult {
  source: "PAYMENT" | "DESIGN_EXPORT" | "PHOTO";
  importBatchId: string;
  batchNo: string;
  mergedCount: number;
  newEntries: number;
  updatedEntries: number;
  warnings?: string[];
  records?: any[];
  importBatch?: ImportBatch;
  newMaterialEntries?: MaterialEntry[];
  newBatches?: Batch[];
  mergedIntoExistingBatch?: boolean;
  targetImportBatchId?: string;
  targetBatchNo?: string;
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

function filterSuppliersByProject(
  suppliers: Supplier[],
  entries: MaterialEntry[],
  batches: Batch[],
  projectIds: string[],
  role: "ADMIN" | "STAFF"
): Supplier[] {
  if (role === "ADMIN") return suppliers;
  const filteredEntries = filterMaterialEntriesByProject(entries, batches, projectIds, role);
  const supplierIds = Array.from(new Set(filteredEntries.map((e) => e.supplierId)));
  return suppliers.filter((s) => supplierIds.includes(s.id));
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

      const filteredSuppliers = filterSuppliersByProject(
        mockSuppliers,
        mockMaterialEntries,
        mockBatches,
        projectIds,
        role
      );

      set({
        materialEntries: filteredEntries,
        batches: filteredBatches,
        requisitions: filteredReqs,
        suppliers: filteredSuppliers,
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

      const filteredEntries = filterMaterialEntriesByProject(
        mockMaterialEntries,
        mockBatches,
        projectIds,
        role
      );
      const filteredBatches = filterBatchesByProject(mockBatches, projectIds, role);
      const filteredReqs = filterRequisitionsByProject(
        mockRequisitions,
        projectIds,
        role
      );
      const filteredSuppliers = filterSuppliersByProject(
        mockSuppliers,
        mockMaterialEntries,
        mockBatches,
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
        importBatches: mockImportBatches,
        suppliers: filteredSuppliers,
        requisitions: filteredReqs,
        kpiData: {
          monthlyTotal: filteredEntries.reduce((s, e) => s + e.quantity, 0),
          inStockTotal: inStockCount,
          avgTurnoverDays: Math.round(avgTurnover),
          shortageBatchCount: shortageCount,
        },
        alerts: getAlerts().slice(0, 10),
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
      const suppliers = data || [];

      const filtered = filterSuppliersByProject(
        suppliers,
        state.materialEntries,
        state.batches,
        state.assignedProjectIds,
        state.currentUserRole
      );
      set({ suppliers: filtered });
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

  addImportResult: (result) => {
    const state = get();
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    const isMerge = result.mergedIntoExistingBatch && result.targetImportBatchId;
    const effectiveBatchNo = isMerge && result.targetBatchNo ? result.targetBatchNo : result.batchNo;

    let newImportBatch: ImportBatch;
    if (isMerge && result.targetImportBatchId) {
      newImportBatch = {
        id: result.importBatchId,
        batchNo: effectiveBatchNo,
        source: result.source,
        importedAt: now.toISOString(),
        importedBy: state.currentUserId,
        recordCount: result.mergedCount,
        fileUrl: null,
      };
    } else {
      newImportBatch = result.importBatch || {
        id: result.importBatchId,
        batchNo: effectiveBatchNo,
        source: result.source,
        importedAt: now.toISOString(),
        importedBy: state.currentUserId,
        recordCount: result.mergedCount,
        fileUrl: null,
      };
    }

    let newMaterialEntries: MaterialEntry[] = [];
    let newBatches: Batch[] = [];

    if (result.newMaterialEntries && result.newMaterialEntries.length > 0) {
      newMaterialEntries = result.newMaterialEntries;
    } else if (result.records && result.records.length > 0) {
      const projectIds = state.assignedProjectIds;
      const projectNameToId: Record<string, string> = {
        "杭州湾样板房": "p-1",
        "上海青浦别墅": "p-2",
        "苏州园区住宅": "p-3",
        "南京鼓楼公寓": "p-4",
      };
      const categories = ["瓷砖", "玻璃", "木材", "电线", "五金", "涂料", "管材", "防水材料"];
      const statuses: Array<"ARRIVED" | "IN_STOCK" | "RECLAIMED" | "EXPIRED"> = ["ARRIVED", "IN_STOCK", "RECLAIMED"];

      result.records.forEach((record: any, idx: number) => {
        const batchId = `batch-${result.importBatchId}-${idx}`;
        const entryId = `entry-${result.importBatchId}-${idx}`;

        const recordProjectName = record.projectName?.trim();
        let projectId: string;
        let projectName: string;

        if (recordProjectName && projectNameToId[recordProjectName]) {
          projectId = projectNameToId[recordProjectName];
          projectName = recordProjectName;
        } else if (recordProjectName) {
          const mappedId = projectIds[idx % projectIds.length];
          projectNameToId[recordProjectName] = mappedId;
          projectId = mappedId;
          projectName = recordProjectName;
        } else {
          projectId = projectIds[idx % projectIds.length];
          projectName = projectId === "p-1" ? "杭州湾样板房" :
                       projectId === "p-2" ? "上海青浦别墅" :
                       projectId === "p-3" ? "苏州园区住宅" : "南京鼓楼公寓";
        }

        const materialName = record.materialName || `材料 ${idx + 1}`;
        const category = record.category || categories[idx % categories.length];
        const quantity = record.quantity || Math.floor(Math.random() * 100) + 10;

        const recordSupplierName = record.supplierName?.trim();
        const supplierName = recordSupplierName || `供应商 ${(idx % 5) + 1}`;
        let supplierId: string;
        if (recordSupplierName) {
          let hash = 0;
          for (let i = 0; i < recordSupplierName.length; i++) {
            hash = (hash + recordSupplierName.charCodeAt(i)) >>> 0;
          }
          supplierId = `s-${(hash % 20) + 1}`;
        } else {
          supplierId = `s-${(idx % 5) + 1}`;
        }

        const status = statuses[idx % statuses.length];

        const batch: Batch = {
          id: batchId,
          batchNo: effectiveBatchNo,
          importSource: result.source,
          importBatchId: isMerge && result.targetImportBatchId ? result.targetImportBatchId : result.importBatchId,
          projectId,
          projectName,
          status: "COMPLETE",
          notes: null,
          createdAt: todayStr,
        };

        const entry: MaterialEntry = {
          id: entryId,
          batchId,
          materialName,
          category,
          specification: record.specification || "标准规格",
          quantity,
          unit: record.unit || "件",
          supplierId,
          supplierName,
          entryDate: todayStr,
          status,
          shortageNote: null,
          shortageNoteBy: null,
          shortageNoteAt: null,
          expiryDate: null,
        };

        newBatches.push(batch);
        newMaterialEntries.push(entry);
      });
    }

    if (result.newBatches && result.newBatches.length > 0) {
      newBatches = [...newBatches, ...result.newBatches];
    }

    set((prev) => {
      let allImportBatches: ImportBatch[];
      if (isMerge && result.targetImportBatchId) {
        allImportBatches = [
          newImportBatch,
          ...prev.importBatches.map((b) =>
            b.id === result.targetImportBatchId
              ? { ...b, recordCount: b.recordCount + result.mergedCount }
              : b
          ),
        ];
      } else {
        allImportBatches = [newImportBatch, ...prev.importBatches];
      }

      const allBatches = [...newBatches, ...prev.batches];
      const allEntries = [...newMaterialEntries, ...prev.materialEntries];

      const filteredEntries = filterMaterialEntriesByProject(
        allEntries,
        allBatches,
        state.assignedProjectIds,
        state.currentUserRole
      );
      const filteredBatches = filterBatchesByProject(
        allBatches,
        state.assignedProjectIds,
        state.currentUserRole
      );
      const filteredSuppliers = filterSuppliersByProject(
        prev.suppliers,
        allEntries,
        allBatches,
        state.assignedProjectIds,
        state.currentUserRole
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

      return {
        importBatches: allImportBatches,
        batches: allBatches,
        materialEntries: allEntries,
        suppliers: filteredSuppliers,
        lastImportBatchId: result.importBatchId,
        kpiData: {
          monthlyTotal: filteredEntries.reduce((s, e) => s + e.quantity, 0),
          inStockTotal: inStockCount,
          avgTurnoverDays: Math.round(avgTurnover),
          shortageBatchCount: shortageCount,
        },
      };
    });
  },
}));
