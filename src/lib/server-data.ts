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
  type Store,
} from "./mock-data";

export type ImportSource = "pos" | "member" | "inventory" | "insurance";

interface ServerDataState {
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
  stores: Store[];
  drugNames: Array<{ name: string; sku: string; category: string }>;
}

let state: ServerDataState | null = null;

function ensureInitialized(): ServerDataState {
  if (!state) {
    state = {
      users: mockDb.users.map(({ password, ...rest }) => ({
        ...rest,
        password: (password as any) || "",
      })) as any,
      members: [...mockDb.members],
      followUps: [...mockDb.followUps],
      prescriptions: [...mockDb.prescriptions],
      annotations: [...mockDb.annotations],
      medicationRecords: generateMockMedications(),
      inventoryBatches: generateMockInventory(),
      replenishmentOrders: generateMockReplenishments(),
      insuranceTransactions: generateMockInsurance(),
      importBatches: [...mockDb.importBatches],
      importRecords: [...mockDb.importRecords],
      stores: [...mockDb.stores],
      drugNames: [...mockDb.drugNames],
    };
  }
  return state;
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

export function getUsers() {
  return ensureInitialized().users;
}

export function getUserById(id: string) {
  return ensureInitialized().users.find((u) => u.id === id) || null;
}

export function getDashboardOverview(): DashboardOverview {
  const s = ensureInitialized();
  const highRiskCount = s.members.filter((m) => m.riskLevel === "high").length;
  const completed = s.followUps.filter(
    (f) => f.status === "completed" || f.status === "annotated"
  ).length;
  const completionRate =
    s.followUps.length > 0 ? Math.round((completed / s.followUps.length) * 100) : 0;
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthlyInsurance = s.insuranceTransactions
    .filter((t) => t.transactionDate.startsWith(currentMonth.slice(0, 7)))
    .reduce((sum, t) => sum + t.amount, 0);

  const riskTrend = Array.from({ length: 30 }, (_, i) => ({
    date: `06-${String(i + 1).padStart(2, "0")}`,
    high: 3 + (i % 5),
    medium: 8 + (i % 4),
    low: 15 + (i % 6),
  }));

  const storeRanking = s.stores.map((store) => {
    const storeMembers = s.members.filter((m) => m.storeId === store.id);
    const storeFollowUps = s.followUps.filter((f) =>
      storeMembers.some((m) => m.id === f.memberId)
    );
    const storeCompleted = storeFollowUps.filter(
      (f) => f.status === "completed" || f.status === "annotated"
    ).length;
    return {
      storeId: store.id,
      storeName: store.name,
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
}

export function getBatchExpiryData(): BatchExpiryPoint[] {
  const s = ensureInitialized();
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
}

export function getMemberFunnel(): FunnelStage[] {
  const s = ensureInitialized();

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
      prevCount: null as number | null,
    },
    {
      stage: "完善档案",
      count: Math.max(
        profiled,
        Math.min(chronicTagged + 5, registered - 5)
      ),
      prevCount: 0,
    },
    {
      stage: "慢病标签",
      count: chronicTagged,
      prevCount: 0,
    },
    {
      stage: "回访触达",
      count: followedUp,
      prevCount: 0,
    },
    {
      stage: "复购转化",
      count: repurchased,
      prevCount: 0,
    },
  ];

  for (let i = 0; i < stages.length; i++) {
    if (i > 0) {
      const prev = stages[i - 1];
      const curr = stages[i];
      if (curr.count >= prev.count) {
        curr.count = Math.max(1, prev.count - Math.max(1, Math.round(prev.count * 0.15)));
      }
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
}

export function getReplenishmentRanking(limit = 10): ReplenishmentRank[] {
  const s = ensureInitialized();
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
}

export function getInsuranceTrend(months?: number): InsuranceTrendPoint[] {
  const s = ensureInitialized();
  const map = new Map<string, { amount: number; count: number }>();

  if (s.insuranceTransactions.length === 0) {
    const d = new Date();
    for (let i = 5; i >= 0; i--) {
      const md = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const key = `${md.getFullYear()}-${String(md.getMonth() + 1).padStart(2, "0")}`;
      map.set(key, { amount: 0, count: 0 });
    }
  } else {
    const dates = s.insuranceTransactions.map((t) => t.transactionDate).sort();
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
      const md = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
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
}

export function getFollowUpsByAssignee(assigneeId: string | null): FollowUp[] {
  const s = ensureInitialized();
  if (!assigneeId) return [...s.followUps];
  return s.followUps.filter((f) => f.assigneeId === assigneeId);
}

export function getFollowUpDetail(id: string) {
  const s = ensureInitialized();
  const followUp = s.followUps.find((f) => f.id === id);
  if (!followUp) return null;
  const member = s.members.find((m) => m.id === followUp.memberId);
  const prescriptions = s.prescriptions.filter((p) => p.memberId === followUp.memberId);
  const annotations = s.annotations.filter((a) => a.followUpId === id);
  const medications = s.medicationRecords
    .filter((m) => m.memberId === followUp.memberId)
    .slice(0, 8);
  return { followUp, member, prescriptions, medications, annotations };
}

export function addAnnotation(
  followUpId: string,
  prescriptionId: string | undefined,
  content: string,
  createdById: string,
  createdByName: string
): Annotation {
  const s = ensureInitialized();
  const ann: Annotation = {
    id: `a-${Date.now()}`,
    followUpId,
    prescriptionId,
    content,
    createdById,
    createdByName,
    createdAt: new Date().toLocaleString("zh-CN"),
  };
  s.annotations.unshift(ann);
  return ann;
}

export function getImportBatches(params?: { source?: string; status?: string }): ImportBatch[] {
  const s = ensureInitialized();
  let result = [...s.importBatches];
  if (params?.source) result = result.filter((b) => b.source === params.source);
  if (params?.status) result = result.filter((b) => b.status === params.status);
  return result;
}

export function getImportBatchDetail(batchId: string) {
  const s = ensureInitialized();
  const batch = s.importBatches.find((b) => b.id === batchId);
  if (!batch) return null;
  const records = s.importRecords.filter((r) => r.batchId === batchId);
  return { batch, records, errors: records.filter((r) => r.status === "error") };
}

export function createImportBatch(
  source: ImportSource,
  fileName: string,
  importedBy: string,
  rawRows: Record<string, any>[]
): ImportBatch {
  const s = ensureInitialized();
  const batchId = `b-${Date.now()}`;
  const importedByName =
    s.users.find((u) => u.id === importedBy)?.name || "未知";
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
  s.importBatches.unshift(batch);
  s.importRecords = [...records, ...s.importRecords];
  return batch;
}

export function processImportBatch(batchId: string): ImportBatch {
  const s = ensureInitialized();
  const batch = s.importBatches.find((b) => b.id === batchId);
  if (!batch) return batch as any;

  const records = s.importRecords.filter((r) => r.batchId === batchId);
  let successCount = 0;
  let errorCount = 0;

  const updatedRecords = records.map((rec) => {
    try {
      if (batch.source === "pos") {
        const memberName = rec.rawData.memberName || rec.rawData.name || "未知会员";
        let member = s.members.find(
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
          s.members.push(member);
        }

        if (rec.rawData.drugName) {
          const drugName = rec.rawData.drugName;
          const drug = s.drugNames.find(
            (d) => d.name === drugName || d.sku === rec.rawData.drugSku
          ) || s.drugNames[0];
          s.medicationRecords.push({
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
          s.inventoryBatches.push({
            id: invBatchId,
            drugId: `drug-${s.drugNames.indexOf(drug)}`,
            drugName: drug.name,
            batchNo: rec.rawData.batchNo || `BAUTO${Date.now().toString().slice(-6)}`,
            expiryDate: expDate.toISOString().slice(0, 10),
            quantity: Number(rec.rawData.quantity) || 50,
            storeId: member!.storeId,
          });

          s.replenishmentOrders.unshift({
            id: `rep-auto-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            drugId: `drug-${s.drugNames.indexOf(drug)}`,
            drugName: drug.name,
            sku: drug.sku,
            quantity: Math.max(50, Number(rec.rawData.quantity) || 1) * 2,
            orderDate: new Date().toISOString().slice(0, 10),
            storeId: member!.storeId,
          });

          if (rec.rawData.insuranceAmount) {
            s.insuranceTransactions.push({
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
        let member = s.members.find((m) => m.phone === phone);
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
          s.members.push(member);
        }
        successCount++;
        return { ...rec, status: "success" as const, mappedId: member.id };
      }

      if (batch.source === "inventory") {
        const drugName = rec.rawData.drugName;
        const drug = s.drugNames.find((d) => d.name === drugName) || s.drugNames[0];
        const expDate = rec.rawData.expiryDate
          ? new Date(rec.rawData.expiryDate)
          : (() => {
              const d = new Date();
              d.setDate(d.getDate() + Number(rec.rawData.expiryDays || 90));
              return d;
            })();
        s.inventoryBatches.push({
          id: `inv-auto-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          drugId: `drug-${s.drugNames.indexOf(drug)}`,
          drugName: drug.name,
          batchNo: rec.rawData.batchNo || `BAUTO${Date.now().toString().slice(-6)}`,
          expiryDate: expDate.toISOString().slice(0, 10),
          quantity: Number(rec.rawData.quantity) || 100,
          storeId: rec.rawData.storeId || "s1",
        });
        s.replenishmentOrders.unshift({
          id: `rep-auto-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          drugId: `drug-${s.drugNames.indexOf(drug)}`,
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
        let member = s.members.find((m) => m.phone === phone);
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
          s.members.push(member);
        }
        s.insuranceTransactions.push({
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

  const idx = s.importBatches.findIndex((b) => b.id === batchId);
  if (idx >= 0) s.importBatches[idx] = updatedBatch;

  updatedRecords.forEach((ur) => {
    const ri = s.importRecords.findIndex((r) => r.id === ur.id);
    if (ri >= 0) s.importRecords[ri] = ur;
  });

  return updatedBatch;
}

export function generateSampleRows(source: string, count: number) {
  const names = ["赵明", "钱华", "孙丽", "李军", "周敏", "吴强", "郑芳", "王磊"];
  const drugs = ["苯磺酸氨氯地平片", "盐酸二甲双胍缓释片", "阿托伐他汀钙片", "阿司匹林肠溶片"];
  const rows = [];
  for (let i = 0; i < count; i++) {
    const name = names[i % names.length] + (i >= names.length ? i : "");
    if (source === "pos") {
      rows.push({
        row: i + 1,
        memberName: name,
        phone: `139${String(10000000 + i * 137).slice(0, 8)}`,
        drugName: drugs[i % drugs.length],
        drugSku: `DRUG${String((i % 10) + 1).padStart(3, "0")}`,
        quantity: 1 + (i % 3),
        unitPrice: 25 + i * 3.5,
        purchaseDate: `2025-06-${String((i % 28) + 1).padStart(2, "0")}`,
        expiryDays: 10 + (i % 100),
        batchNo: `B2025${String(i + 1).padStart(4, "0")}`,
        insuranceAmount: i % 2 === 0 ? 100 + i * 10 : undefined,
        storeId: "s1",
      });
    } else if (source === "member") {
      rows.push({
        row: i + 1,
        name,
        phone: `139${String(10000000 + i * 137).slice(0, 8)}`,
        age: 50 + (i % 30),
        gender: i % 2 === 0 ? "男" : "女",
        riskLevel: i % 5 === 0 ? "high" : i % 3 === 0 ? "medium" : "low",
        chronicTypes: i % 2 === 0 ? ["高血压"] : ["糖尿病"],
        storeId: "s1",
      });
    } else if (source === "inventory") {
      rows.push({
        row: i + 1,
        drugName: drugs[i % drugs.length],
        batchNo: `B2025${String(i + 1).padStart(4, "0")}`,
        expiryDate: `2025-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
        quantity: 50 + i * 20,
        storeId: "s1",
      });
    } else {
      rows.push({
        row: i + 1,
        memberName: name,
        phone: `139${String(10000000 + i * 137).slice(0, 8)}`,
        amount: 80 + i * 25.5,
        count: 1 + (i % 3),
        transactionDate: `2025-${String((i % 6) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
        storeId: "s1",
      });
    }
  }
  return rows;
}
