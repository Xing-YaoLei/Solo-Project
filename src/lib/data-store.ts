"use client";

import { create } from "zustand";
import {
  mockDb,
  type User,
  type Member,
  type FollowUp,
  type Prescription,
  type Annotation,
  type ImportBatch,
  type ImportRecord,
  type DashboardOverview,
  type BatchExpiryPoint,
  type FunnelStage,
  type ReplenishmentRank,
  type InsuranceTrendPoint,
  type InventoryBatch,
  type ReplenishmentOrder,
  type InsuranceTransaction,
  type MedicationRecord,
} from "./mock-data";

export type ImportSource = "pos" | "member" | "inventory" | "insurance";

interface DataState {
  users: User[];
  members: Member[];
  followUps: FollowUp[];
  prescriptions: Prescription[];
  annotations: Annotation[];
  medicationRecords: MedicationRecord[];
  inventoryBatches: InventoryBatch[];
  replenishmentOrders: ReplenishmentOrder[];
  insuranceTransactions: InsuranceTransaction[];
  importBatches: ImportBatch[];
  importRecords: ImportRecord[];

  createImportBatch: (
    source: ImportSource,
    fileName: string,
    importedBy: string,
    rawRows: Record<string, any>[]
  ) => ImportBatch;

  processImportBatch: (batchId: string) => ImportBatch;

  addAnnotation: (
    followUpId: string,
    prescriptionId: string | undefined,
    content: string,
    createdById: string,
    createdByName: string
  ) => Annotation;

  getDashboardOverview: () => DashboardOverview;
  getBatchExpiryData: () => BatchExpiryPoint[];
  getMemberFunnel: () => FunnelStage[];
  getReplenishmentRanking: (limit?: number) => ReplenishmentRank[];
  getInsuranceTrend: (months?: number) => InsuranceTrendPoint[];
  getFollowUpsByAssignee: (assigneeId: string | null) => FollowUp[];
  getFollowUpDetail: (id: string) => any;
  getImportBatches: (params?: { source?: string; status?: string }) => ImportBatch[];
  getImportBatchDetail: (batchId: string) => any;
}

const STORAGE_KEY = "pharmacy_data_store_v1";

function loadInitial() {
  if (typeof window === "undefined") {
    return {
      users: mockDb.users.map(({ password, ...rest }) => ({
        ...rest,
        password: password,
      })) as any,
      members: mockDb.members,
      followUps: mockDb.followUps,
      prescriptions: mockDb.prescriptions,
      annotations: [...mockDb.annotations],
      medicationRecords: generateMockMedications(),
      inventoryBatches: generateMockInventory(),
      replenishmentOrders: generateMockReplenishments(),
      insuranceTransactions: generateMockInsurance(),
      importBatches: [...mockDb.importBatches],
      importRecords: [...mockDb.importRecords],
    };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const initial = {
    users: mockDb.users.map(({ password, ...rest }) => ({
      ...rest,
      password: password,
    })) as any,
    members: mockDb.members,
    followUps: mockDb.followUps,
    prescriptions: mockDb.prescriptions,
    annotations: [...mockDb.annotations],
    medicationRecords: generateMockMedications(),
    inventoryBatches: generateMockInventory(),
    replenishmentOrders: generateMockReplenishments(),
    insuranceTransactions: generateMockInsurance(),
    importBatches: [...mockDb.importBatches],
    importRecords: [...mockDb.importRecords],
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  } catch {}
  return initial;
}

function generateMockMedications(): MedicationRecord[] {
  const meds: MedicationRecord[] = [];
  mockDb.members.forEach((m, mi) => {
    for (let i = 0; i < 3; i++) {
      const drug = mockDb.drugNames[(mi + i) % mockDb.drugNames.length];
      meds.push({
        id: `med-${mi}-${i}`,
        memberId: m.id,
        memberName: m.name,
        drugName: drug.name,
        drugSku: drug.sku,
        quantity: 2 + (i % 3),
        unitPrice: 20 + (mi % 10) * 5.5,
        purchaseDate: `2025-0${Math.max(1, 6 - i)}-${String((mi % 20) + 1).padStart(2, "0")}`,
        storeId: m.storeId,
      });
    }
  });
  return meds;
}

function generateMockInventory(): InventoryBatch[] {
  const list: InventoryBatch[] = [];
  mockDb.drugNames.forEach((d, di) => {
    [
      { days: 5, qty: 32 },
      { days: 22, qty: 78 },
      { days: 45, qty: 150 },
      { days: 80, qty: 260 },
      { days: 200, qty: 500 },
    ].forEach((s, si) => {
      const date = new Date();
      date.setDate(date.getDate() + s.days);
      list.push({
        id: `inv-${di}-${si}`,
        drugId: `drug-${di}`,
        drugName: d.name,
        batchNo: `B${date.getFullYear()}${String(d.sku).slice(-3)}${String(si + 1).padStart(2, "0")}`,
        expiryDate: date.toISOString().slice(0, 10),
        quantity: s.qty,
        storeId: "s1",
      });
    });
  });
  return list;
}

function generateMockReplenishments(): ReplenishmentOrder[] {
  const list: ReplenishmentOrder[] = [];
  for (let i = 0; i < 30; i++) {
    const d = mockDb.drugNames[i % mockDb.drugNames.length];
    list.push({
      id: `rep-${i}`,
      drugId: `drug-${i % mockDb.drugNames.length}`,
      drugName: d.name,
      sku: d.sku,
      quantity: 80 + (i % 6) * 40,
      orderDate: `2025-0${String((i % 6) + 1).padStart(2, "0")}-${String((i % 25) + 1).padStart(2, "0")}`,
      storeId: "s1",
    });
  }
  return list;
}

function generateMockInsurance(): InsuranceTransaction[] {
  const list: InsuranceTransaction[] = [];
  mockDb.members.slice(0, 18).forEach((m, i) => {
    const date = new Date(2025, i % 6, (i % 20) + 1);
    list.push({
      id: `ins-${i}`,
      memberId: m.id,
      memberName: m.name,
      amount: 120 + (i % 20) * 25.5,
      count: 1 + (i % 3),
      transactionDate: date.toISOString().slice(0, 10),
      storeId: m.storeId,
    });
  });
  return list;
}

function persist(state: any) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        users: state.users,
        members: state.members,
        followUps: state.followUps,
        prescriptions: state.prescriptions,
        annotations: state.annotations,
        medicationRecords: state.medicationRecords,
        inventoryBatches: state.inventoryBatches,
        replenishmentOrders: state.replenishmentOrders,
        insuranceTransactions: state.insuranceTransactions,
        importBatches: state.importBatches,
        importRecords: state.importRecords,
      })
    );
  } catch {}
}

export const useDataStore = create<DataState>((set, get) => ({
  ...loadInitial(),

  createImportBatch: (source, fileName, importedBy, rawRows) => {
    const batchId = `b-${Date.now()}`;
    const importedByName =
      get().users.find((u) => u.id === importedBy)?.name || "未知";
    const batch: ImportBatch = {
      id: batchId,
      source,
      status: "processing",
      totalRecords: rawRows.length,
      successCount: 0,
      errorCount: 0,
      fileName,
      importedBy,
      importedByName,
      importedAt: new Date().toLocaleString("zh-CN"),
    };
    const records: ImportRecord[] = rawRows.map((row, i) => ({
      id: `${batchId}-r${i + 1}`,
      batchId,
      rawData: row,
      status: "success",
      createdAt: batch.importedAt,
    }));
    set((s) => {
      const newState = {
        importBatches: [batch, ...s.importBatches],
        importRecords: [...records, ...s.importRecords],
      };
      persist({ ...s, ...newState });
      return newState;
    });
    return batch;
  },

  processImportBatch: (batchId) => {
    const state = get();
    const batch = state.importBatches.find((b) => b.id === batchId);
    if (!batch) return batch as any;

    const records = state.importRecords.filter((r) => r.batchId === batchId);
    let successCount = 0;
    let errorCount = 0;

    const updatedRecords = records.map((rec) => {
      try {
        if (batch.source === "pos") {
          const memberName = rec.rawData.memberName || rec.rawData.name || "未知会员";
          let member = state.members.find(
            (m) =>
              m.name === memberName ||
              m.phone === (rec.rawData.phone || "")
          );
          if (!member) {
            const newId = `m-auto-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
            member = {
              id: newId,
              name: memberName,
              phone: rec.rawData.phone || `138${String(Math.floor(Math.random() * 1e8)).padStart(8, "0")}`,
              storeId: rec.rawData.storeId || "s1",
              riskLevel: rec.rawData.riskLevel || "medium",
              age: rec.rawData.age,
              gender: rec.rawData.gender,
              chronicTypes: rec.rawData.chronicTypes || [],
              registeredAt: new Date().toISOString().slice(0, 10),
            };
            state.members.push(member);
          }

          if (rec.rawData.drugName) {
            const drugName = rec.rawData.drugName;
            const drug = mockDb.drugNames.find(
              (d) => d.name === drugName || d.sku === rec.rawData.drugSku
            ) || mockDb.drugNames[0];
            state.medicationRecords.push({
              id: `med-auto-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              memberId: member!.id,
              memberName: member!.name,
              drugName: drug.name,
              drugSku: drug.sku,
              quantity: Number(rec.rawData.quantity) || 1,
              unitPrice: Number(rec.rawData.unitPrice) || 30,
              purchaseDate: rec.rawData.purchaseDate || new Date().toISOString().slice(0, 10),
              storeId: member!.storeId,
            });

            const invBatchId = `inv-auto-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
            const expDate = new Date();
            expDate.setDate(expDate.getDate() + (Number(rec.rawData.expiryDays) || 60));
            state.inventoryBatches.push({
              id: invBatchId,
              drugId: `drug-${mockDb.drugNames.indexOf(drug)}`,
              drugName: drug.name,
              batchNo: rec.rawData.batchNo || `BAUTO${Date.now().toString().slice(-6)}`,
              expiryDate: expDate.toISOString().slice(0, 10),
              quantity: Number(rec.rawData.quantity) || 50,
              storeId: member!.storeId,
            });

            state.replenishmentOrders.push({
              id: `rep-auto-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              drugId: `drug-${mockDb.drugNames.indexOf(drug)}`,
              drugName: drug.name,
              sku: drug.sku,
              quantity: Math.max(50, Number(rec.rawData.quantity) || 1) * 2,
              orderDate: new Date().toISOString().slice(0, 10),
              storeId: member!.storeId,
            });

            if (rec.rawData.insuranceAmount) {
              state.insuranceTransactions.push({
                id: `ins-auto-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                memberId: member!.id,
                memberName: member!.name,
                amount: Number(rec.rawData.insuranceAmount) || 100,
                count: 1,
                transactionDate: rec.rawData.purchaseDate || new Date().toISOString().slice(0, 10),
                storeId: member!.storeId,
              });
            }
          }
          successCount++;
          return { ...rec, status: "success" as const, mappedId: member.id };
        }

        if (batch.source === "member") {
          const memberName = rec.rawData.name || rec.rawData.memberName;
          const phone = rec.rawData.phone;
          let member = state.members.find((m) => m.phone === phone);
          if (!member) {
            member = {
              id: `m-auto-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              name: memberName || "新会员",
              phone: phone || `138${String(Math.floor(Math.random() * 1e8)).padStart(8, "0")}`,
              storeId: rec.rawData.storeId || "s1",
              riskLevel: rec.rawData.riskLevel || "low",
              age: Number(rec.rawData.age) || undefined,
              gender: rec.rawData.gender,
              chronicTypes: rec.rawData.chronicTypes || [],
              registeredAt: new Date().toISOString().slice(0, 10),
            };
            state.members.push(member);
          }
          successCount++;
          return { ...rec, status: "success" as const, mappedId: member.id };
        }

        if (batch.source === "inventory") {
          const drugName = rec.rawData.drugName;
          const drug = mockDb.drugNames.find((d) => d.name === drugName) || mockDb.drugNames[0];
          const expDate = rec.rawData.expiryDate
            ? new Date(rec.rawData.expiryDate)
            : (() => {
                const d = new Date();
                d.setDate(d.getDate() + Number(rec.rawData.expiryDays || 90));
                return d;
              })();
          state.inventoryBatches.push({
            id: `inv-auto-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            drugId: `drug-${mockDb.drugNames.indexOf(drug)}`,
            drugName: drug.name,
            batchNo: rec.rawData.batchNo || `BAUTO${Date.now().toString().slice(-6)}`,
            expiryDate: expDate.toISOString().slice(0, 10),
            quantity: Number(rec.rawData.quantity) || 100,
            storeId: rec.rawData.storeId || "s1",
          });
          state.replenishmentOrders.push({
            id: `rep-auto-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            drugId: `drug-${mockDb.drugNames.indexOf(drug)}`,
            drugName: drug.name,
            sku: drug.sku,
            quantity: Math.max(50, Number(rec.rawData.quantity) || 1) * 2,
            orderDate: new Date().toISOString().slice(0, 10),
            storeId: rec.rawData.storeId || "s1",
          });
          successCount++;
          return { ...rec, status: "success" as const };
        }

        if (batch.source === "insurance") {
          const amount = Number(rec.rawData.amount) || 100;
          const phone = rec.rawData.phone;
          let member = state.members.find((m) => m.phone === phone);
          if (!member) {
            member = {
              id: `m-auto-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              name: rec.rawData.memberName || "医保会员",
              phone: phone || `138${String(Math.floor(Math.random() * 1e8)).padStart(8, "0")}`,
              storeId: rec.rawData.storeId || "s1",
              riskLevel: "medium",
              chronicTypes: [],
              registeredAt: new Date().toISOString().slice(0, 10),
            };
            state.members.push(member);
          }
          state.insuranceTransactions.push({
            id: `ins-auto-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            memberId: member.id,
            memberName: member.name,
            amount,
            count: Number(rec.rawData.count) || 1,
            transactionDate:
              rec.rawData.transactionDate || new Date().toISOString().slice(0, 10),
            storeId: member.storeId,
          });
          successCount++;
          return { ...rec, status: "success" as const, mappedId: member.id };
        }

        successCount++;
        return rec;
      } catch (err: any) {
        errorCount++;
        return { ...rec, status: "error" as const, errorMsg: err.message || "处理失败" };
      }
    });

    const updatedBatch: ImportBatch = {
      ...batch,
      status: errorCount === records.length ? "failed" : "completed",
      successCount,
      errorCount,
    };

    set((s) => {
      const newState = {
        importBatches: s.importBatches.map((b) =>
          b.id === batchId ? updatedBatch : b
        ),
        importRecords: s.importRecords.map((r) => {
          const u = updatedRecords.find((x) => x.id === r.id);
          return u || r;
        }),
        members: [...state.members],
        medicationRecords: [...state.medicationRecords],
        inventoryBatches: [...state.inventoryBatches],
        replenishmentOrders: [...state.replenishmentOrders],
        insuranceTransactions: [...state.insuranceTransactions],
      };
      persist(newState);
      return newState;
    });

    return updatedBatch;
  },

  addAnnotation: (followUpId, prescriptionId, content, createdById, createdByName) => {
    const ann: Annotation = {
      id: `a-${Date.now()}`,
      followUpId,
      prescriptionId,
      content,
      createdById,
      createdByName,
      createdAt: new Date().toLocaleString("zh-CN"),
    };
    set((s) => {
      const newState = { annotations: [ann, ...s.annotations] };
      persist({ ...s, ...newState });
      return newState;
    });
    return ann;
  },

  getDashboardOverview: () => {
    const s = get();
    const highRiskCount = s.members.filter((m) => m.riskLevel === "high").length;
    const completed = s.followUps.filter(
      (f) => f.status === "completed" || f.status === "annotated"
    ).length;
    const completionRate =
      s.followUps.length > 0 ? Math.round((completed / s.followUps.length) * 100) : 0;
    const monthlyInsurance = s.insuranceTransactions
      .filter((t) => t.transactionDate.startsWith("2025-06"))
      .reduce((sum, t) => sum + t.amount, 0);

    const riskTrend = Array.from({ length: 30 }, (_, i) => ({
      date: `06-${String(i + 1).padStart(2, "0")}`,
      high: 3 + (i % 5),
      medium: 8 + (i % 4),
      low: 15 + (i % 6),
    }));

    const storeMap: Record<string, string> = {
      s1: "总部旗舰店",
      s2: "朝阳路分店",
      s3: "新华路分店",
    };
    const storeRanking = Object.entries(storeMap).map(([storeId, storeName]) => {
      const storeMembers = s.members.filter((m) => m.storeId === storeId);
      const storeFollowUps = s.followUps.filter((f) =>
        storeMembers.some((m) => m.id === f.memberId)
      );
      const storeCompleted = storeFollowUps.filter(
        (f) => f.status === "completed" || f.status === "annotated"
      ).length;
      return {
        storeId,
        storeName,
        total: storeFollowUps.length,
        completed: storeCompleted,
        completionRate:
          storeFollowUps.length > 0
            ? Math.round((storeCompleted / storeFollowUps.length) * 100)
            : 0,
      };
    });

    return {
      totalChronicMembers: s.members.length,
      highRiskCount,
      followUpCompletionRate: completionRate,
      monthlyInsuranceAmount: monthlyInsurance,
      riskTrend,
      storeRanking: storeRanking.sort((a, b) => b.completionRate - a.completionRate),
    };
  },

  getBatchExpiryData: () => {
    const s = get();
    const now = new Date();
    const ranges = [
      { label: "7天内", min: 0, max: 7, count: 0 },
      { label: "8-30天", min: 8, max: 30, count: 0 },
      { label: "31-60天", min: 31, max: 60, count: 0 },
      { label: "61-90天", min: 61, max: 90, count: 0 },
      { label: "90天以上", min: 91, max: Infinity, count: 0 },
    ];
    s.inventoryBatches.forEach((b) => {
      const days = Math.ceil(
        (new Date(b.expiryDate).getTime() - now.getTime()) / 86400000
      );
      const range = ranges.find((r) => days >= r.min && days <= r.max);
      if (range) range.count++;
      else if (days < 0) ranges[0].count++;
    });
    return ranges.map(({ label, count }) => ({ range: label, count }));
  },

  getMemberFunnel: () => {
    const s = get();

    const registered = s.members.length + Math.round(s.members.length * 0.6);
    const profiled = s.members.length + Math.round(s.members.length * 0.25);
    const chronicTagged = s.members.length;

    const memberIdsWithFollowUp = new Set(
      s.followUps.map((f) => f.memberId)
    );
    const followedUp = Math.min(
      memberIdsWithFollowUp.size,
      Math.max(1, chronicTagged - 2)
    );

    const memberPurchaseCounts = new Map<string, number>();
    s.medicationRecords.forEach((m) => {
      memberPurchaseCounts.set(
        m.memberId,
        (memberPurchaseCounts.get(m.memberId) || 0) + 1
      );
    });
    const repurchased = Math.min(
      Array.from(memberPurchaseCounts.values()).filter((c) => c >= 2).length,
      Math.max(1, followedUp - 3)
    );

    const stages = [
      {
        stage: "会员注册",
        count: Math.max(registered, chronicTagged + 10),
      },
      {
        stage: "完善档案",
        count: Math.max(
          profiled,
          Math.min(chronicTagged + 5, registered - 5)
        ),
      },
      {
        stage: "慢病标签",
        count: chronicTagged,
      },
      {
        stage: "回访触达",
        count: followedUp,
      },
      {
        stage: "复购转化",
        count: repurchased,
      },
    ];

    for (let i = 1; i < stages.length; i++) {
      if (stages[i].count >= stages[i - 1].count) {
        stages[i].count = Math.max(
          1,
          stages[i - 1].count -
            Math.max(1, Math.round(stages[i - 1].count * 0.15))
        );
      }
    }

    return stages.map((st, i) => ({
      stage: st.stage,
      count: st.count,
      conversionRate:
        i === 0
          ? 100
          : Math.min(
              100,
              Math.max(
                1,
                Math.round((st.count / stages[i - 1].count) * 100)
              )
            ),
    }));
  },

  getReplenishmentRanking: (limit = 10) => {
    const s = get();
    const map = new Map<string, { drugName: string; sku: string; count: number }>();
    s.replenishmentOrders.forEach((o) => {
      const key = o.sku;
      const prev = map.get(key);
      if (prev) prev.count++;
      else map.set(key, { drugName: o.drugName, sku: o.sku, count: 1 });
    });
    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  },

  getInsuranceTrend: (months?: number) => {
    const s = get();
    const map = new Map<string, { amount: number; count: number }>();

    if (s.insuranceTransactions.length === 0) {
      const d = new Date();
      for (let i = 5; i >= 0; i--) {
        const md = new Date(d.getFullYear(), d.getMonth() - i, 1);
        const key = `${md.getFullYear()}-${String(md.getMonth() + 1).padStart(2, "0")}`;
        map.set(key, { amount: 0, count: 0 });
      }
    } else {
      const dates = s.insuranceTransactions
        .map((t) => t.transactionDate)
        .sort();
      const earliest = dates[0];
      const latest = dates[dates.length - 1];
      const now = new Date().toISOString().slice(0, 10);
      const effectiveLatest = latest > now ? latest : now;

      const startYear = Number(earliest.slice(0, 4));
      const startMonth = Number(earliest.slice(5, 7)) - 1;
      const endYear = Number(effectiveLatest.slice(0, 4));
      const endMonth = Number(effectiveLatest.slice(5, 7)) - 1;

      const startDate = new Date(startYear, startMonth, 1);
      const endDate = new Date(endYear, endMonth, 1);

      let totalMonths =
        (endDate.getFullYear() - startDate.getFullYear()) * 12 +
        (endDate.getMonth() - startDate.getMonth()) +
        1;

      const limit = months || totalMonths;
      totalMonths = Math.min(totalMonths, limit);

      for (let i = totalMonths - 1; i >= 0; i--) {
        const md = new Date(
          endDate.getFullYear(),
          endDate.getMonth() - i,
          1
        );
        const key = `${md.getFullYear()}-${String(md.getMonth() + 1).padStart(2, "0")}`;
        map.set(key, { amount: 0, count: 0 });
      }
    }

    s.insuranceTransactions.forEach((t) => {
      const key = t.transactionDate.slice(0, 7);
      const prev = map.get(key);
      if (prev) {
        prev.amount += t.amount;
        prev.count += t.count;
      }
    });
    return Array.from(map.entries()).map(([month, v]) => ({
      month,
      amount: Math.round(v.amount),
      count: v.count,
    }));
  },

  getFollowUpsByAssignee: (assigneeId) => {
    const s = get();
    if (!assigneeId) return s.followUps;
    return s.followUps.filter((f) => f.assigneeId === assigneeId);
  },

  getFollowUpDetail: (id) => {
    const s = get();
    const followUp = s.followUps.find((f) => f.id === id);
    if (!followUp) return null;
    const member = s.members.find((m) => m.id === followUp.memberId);
    const prescriptions = s.prescriptions.filter((p) => p.memberId === followUp.memberId);
    const annotations = s.annotations.filter((a) => a.followUpId === id);
    const medications = s.medicationRecords
      .filter((m) => m.memberId === followUp.memberId)
      .slice(0, 8);
    return { followUp, member, prescriptions, medications, annotations };
  },

  getImportBatches: (params) => {
    let result = [...get().importBatches];
    if (params?.source) result = result.filter((b) => b.source === params.source);
    if (params?.status) result = result.filter((b) => b.status === params.status);
    return result;
  },

  getImportBatchDetail: (batchId) => {
    const s = get();
    const batch = s.importBatches.find((b) => b.id === batchId);
    if (!batch) return null;
    const records = s.importRecords.filter((r) => r.batchId === batchId);
    return { batch, records, errors: records.filter((r) => r.status === "error") };
  },
}));
