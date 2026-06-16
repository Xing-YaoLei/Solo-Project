export type Role = "admin" | "manager" | "staff";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  storeId: string;
  storeName: string;
}

export interface Store {
  id: string;
  name: string;
  code: string;
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  storeId: string;
  riskLevel: "high" | "medium" | "low";
  age?: number;
  gender?: string;
  chronicTypes: string[];
  registeredAt: string;
}

export interface FollowUp {
  id: string;
  memberId: string;
  memberName: string;
  assigneeId: string;
  assigneeName: string;
  status: "pending" | "completed" | "annotated";
  scheduledDate: string;
  completedDate?: string;
  notes?: string;
  riskLevel: "high" | "medium" | "low";
}

export interface Prescription {
  id: string;
  memberId: string;
  drugName: string;
  dosage: string;
  frequency?: string;
  issueDate: string;
  doctorName?: string;
  isClear: boolean;
}

export interface Annotation {
  id: string;
  followUpId: string;
  prescriptionId?: string;
  content: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
}

export interface ImportBatch {
  id: string;
  source: "pos" | "member" | "inventory" | "insurance";
  status: "pending" | "processing" | "completed" | "failed";
  totalRecords: number;
  successCount: number;
  errorCount: number;
  fileName?: string;
  importedBy: string;
  importedByName: string;
  importedAt: string;
}

export interface ImportRecord {
  id: string;
  batchId: string;
  rawData: Record<string, any>;
  status: "success" | "skipped" | "error";
  errorMsg?: string;
  mappedId?: string;
  createdAt: string;
}

export interface InventoryBatch {
  id: string;
  drugId: string;
  drugName: string;
  batchNo: string;
  expiryDate: string;
  quantity: number;
  storeId?: string;
}

export interface ReplenishmentOrder {
  id: string;
  drugId: string;
  drugName: string;
  sku: string;
  quantity: number;
  orderDate: string;
  storeId?: string;
}

export interface InsuranceTransaction {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  count: number;
  transactionDate: string;
  storeId?: string;
}

export interface MedicationRecord {
  id: string;
  memberId: string;
  memberName: string;
  drugName: string;
  drugSku: string;
  quantity: number;
  unitPrice: number;
  purchaseDate: string;
  storeId?: string;
}

export interface DashboardOverview {
  totalChronicMembers: number;
  highRiskCount: number;
  followUpCompletionRate: number;
  monthlyInsuranceAmount: number;
  riskTrend: Array<{ date: string; high: number; medium: number; low: number }>;
  storeRanking: Array<{ storeId: string; storeName: string; completionRate: number; total: number; completed: number }>;
}

export interface BatchExpiryPoint {
  range: string;
  count: number;
}

export interface FunnelStage {
  stage: string;
  count: number;
  conversionRate: number;
}

export interface ReplenishmentRank {
  drugName: string;
  sku: string;
  count: number;
}

export interface InsuranceTrendPoint {
  month: string;
  amount: number;
  count: number;
}

const stores: Store[] = [
  { id: "s1", name: "总部旗舰店", code: "STORE001" },
  { id: "s2", name: "朝阳路分店", code: "STORE002" },
  { id: "s3", name: "新华路分店", code: "STORE003" },
];

const users: Array<User & { password: string }> = [
  { id: "u1", email: "admin@pharmacy.com", name: "系统管理员", role: "admin", storeId: "s1", storeName: "总部旗舰店", password: "123456" },
  { id: "u2", email: "manager@pharmacy.com", name: "张经理", role: "manager", storeId: "s1", storeName: "总部旗舰店", password: "123456" },
  { id: "u3", email: "pharmacist1@pharmacy.com", name: "李药师", role: "staff", storeId: "s1", storeName: "总部旗舰店", password: "123456" },
  { id: "u4", email: "pharmacist2@pharmacy.com", name: "王药师", role: "staff", storeId: "s2", storeName: "朝阳路分店", password: "123456" },
];

const memberNames = ["赵建国", "钱秀兰", "孙德明", "李桂英", "周荣华", "吴美玲", "郑天翔", "王淑芬", "冯志强", "陈春燕", "褚海涛", "卫丽华", "蒋明辉", "沈玉梅", "韩晓东"];
const chronicTypes = [["高血压", "高血脂"], ["糖尿病"], ["高血压"], ["冠心病"], ["糖尿病", "高血压"]];
const riskLevels: Array<"high" | "medium" | "low"> = ["high", "low", "medium", "low", "medium"];

const members: Member[] = memberNames.map((name, i) => ({
  id: `m${i + 1}`,
  name,
  phone: `138${String(10000000 + i * 137).slice(0, 8)}`,
  storeId: stores[i % stores.length].id,
  riskLevel: riskLevels[i % riskLevels.length],
  age: 55 + (i % 25),
  gender: i % 2 === 0 ? "男" : "女",
  chronicTypes: chronicTypes[i % chronicTypes.length],
  registeredAt: `2024-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 20) + 1).padStart(2, "0")}`,
}));

const drugNames = [
  { name: "苯磺酸氨氯地平片", sku: "DRUG001", category: "心血管" },
  { name: "盐酸二甲双胍缓释片", sku: "DRUG002", category: "降糖" },
  { name: "阿托伐他汀钙片", sku: "DRUG003", category: "降脂" },
  { name: "阿司匹林肠溶片", sku: "DRUG004", category: "心血管" },
  { name: "格列美脲片", sku: "DRUG005", category: "降糖" },
  { name: "硝苯地平控释片", sku: "DRUG006", category: "心血管" },
  { name: "辛伐他汀片", sku: "DRUG007", category: "降脂" },
  { name: "缬沙坦胶囊", sku: "DRUG008", category: "心血管" },
  { name: "盐酸贝那普利片", sku: "DRUG009", category: "心血管" },
  { name: "阿卡波糖片", sku: "DRUG010", category: "降糖" },
];

const followUpStatuses: Array<"pending" | "completed" | "annotated"> = ["pending", "completed", "annotated", "completed"];
const staffUsers = users.filter((u) => u.role === "staff");

const followUps: FollowUp[] = members.map((m, i) => {
  const assignee = staffUsers[i % staffUsers.length];
  const status = followUpStatuses[i % followUpStatuses.length];
  return {
    id: `f${i + 1}`,
    memberId: m.id,
    memberName: m.name,
    assigneeId: assignee.id,
    assigneeName: assignee.name,
    status,
    scheduledDate: `2025-06-${String((i % 25) + 1).padStart(2, "0")}`,
    completedDate: status === "completed" ? `2025-06-${String((i % 25) + 2).padStart(2, "0")}` : undefined,
    notes: status === "completed" ? "血压控制良好，继续按原方案服药" : undefined,
    riskLevel: m.riskLevel,
  };
});

const prescriptions: Prescription[] = members.map((m, i) => {
  const drug = drugNames[i % drugNames.length];
  return {
    id: `p${i + 1}`,
    memberId: m.id,
    drugName: drug.name,
    dosage: "5mg",
    frequency: "每日一次",
    issueDate: `2025-05-${String((i % 25) + 1).padStart(2, "0")}`,
    doctorName: i % 3 === 0 ? "刘医生" : "陈医生",
    isClear: i % 5 !== 0,
  };
});

const annotations: Annotation[] = [
  {
    id: "a1",
    followUpId: "f3",
    prescriptionId: "p3",
    content: "处方字迹不清，二甲双胍用量疑似为 0.5g bid，建议电话确认",
    createdById: "u3",
    createdByName: "李药师",
    createdAt: "2025-06-10 14:30",
  },
  {
    id: "a2",
    followUpId: "f7",
    prescriptionId: "p7",
    content: "处方日期模糊，无法确认是否过期，已重新开具",
    createdById: "u4",
    createdByName: "王药师",
    createdAt: "2025-06-12 09:15",
  },
  {
    id: "a3",
    followUpId: "f11",
    content: "会员电话未接通，次日再联系",
    createdById: "u3",
    createdByName: "李药师",
    createdAt: "2025-06-14 16:45",
  },
];

const importBatches: ImportBatch[] = [
  { id: "b1", source: "pos", status: "completed", totalRecords: 328, successCount: 325, errorCount: 3, fileName: "pos_20250615.csv", importedBy: "u1", importedByName: "系统管理员", importedAt: "2025-06-15 08:00" },
  { id: "b2", source: "member", status: "completed", totalRecords: 156, successCount: 154, errorCount: 2, fileName: "members_20250614.xlsx", importedBy: "u1", importedByName: "系统管理员", importedAt: "2025-06-14 10:30" },
  { id: "b3", source: "inventory", status: "processing", totalRecords: 892, successCount: 450, errorCount: 0, fileName: "inventory_20250613.csv", importedBy: "u1", importedByName: "系统管理员", importedAt: "2025-06-13 15:20" },
  { id: "b4", source: "insurance", status: "completed", totalRecords: 245, successCount: 245, errorCount: 0, fileName: "insurance_20250612.csv", importedBy: "u1", importedByName: "系统管理员", importedAt: "2025-06-12 09:00" },
  { id: "b5", source: "pos", status: "failed", totalRecords: 180, successCount: 0, errorCount: 180, fileName: "pos_20250611_err.csv", importedBy: "u1", importedByName: "系统管理员", importedAt: "2025-06-11 11:45" },
];

const importRecords: ImportRecord[] = importBatches.flatMap((b) =>
  Array.from({ length: 5 }, (_, i) => ({
    id: `${b.id}-r${i + 1}`,
    batchId: b.id,
    rawData: { row: i + 1, name: `会员${i + 1}`, phone: `1380000000${i}` },
    status: i % 3 === 0 ? "error" : "success",
    errorMsg: i % 3 === 0 ? "字段映射失败：缺少手机号" : undefined,
    createdAt: b.importedAt,
  }))
);

export const mockDb = {
  users,
  stores,
  members,
  followUps,
  prescriptions,
  annotations,
  importBatches,
  importRecords,
  drugNames,
};

export function authenticateUser(email: string, password: string): User | null {
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) return null;
  const { password: _, ...safeUser } = user;
  return safeUser;
}

export function getDashboardOverview(): DashboardOverview {
  const highRiskCount = members.filter((m) => m.riskLevel === "high").length;
  const completed = followUps.filter((f) => f.status === "completed" || f.status === "annotated").length;
  const completionRate = followUps.length > 0 ? Math.round((completed / followUps.length) * 100) : 0;
  const monthlyInsurance = 45680 + 32150 + 28900 + 52340 + 41200 + 38760;

  const riskTrend = Array.from({ length: 30 }, (_, i) => {
    const day = String(i + 1).padStart(2, "0");
    return {
      date: `06-${day}`,
      high: 3 + (i % 5),
      medium: 8 + (i % 4),
      low: 15 + (i % 6),
    };
  });

  const storeRanking = stores.map((s) => {
    const storeMembers = members.filter((m) => m.storeId === s.id);
    const storeFollowUps = followUps.filter((f) =>
      storeMembers.some((m) => m.id === f.memberId)
    );
    const storeCompleted = storeFollowUps.filter(
      (f) => f.status === "completed" || f.status === "annotated"
    ).length;
    return {
      storeId: s.id,
      storeName: s.name,
      total: storeFollowUps.length,
      completed: storeCompleted,
      completionRate:
        storeFollowUps.length > 0
          ? Math.round((storeCompleted / storeFollowUps.length) * 100)
          : 0,
    };
  });

  return {
    totalChronicMembers: members.length,
    highRiskCount,
    followUpCompletionRate: completionRate,
    monthlyInsuranceAmount: monthlyInsurance,
    riskTrend,
    storeRanking: storeRanking.sort((a, b) => b.completionRate - a.completionRate),
  };
}

export function getBatchExpiryData(): BatchExpiryPoint[] {
  return [
    { range: "7天内", count: 12 },
    { range: "8-30天", count: 38 },
    { range: "31-60天", count: 67 },
    { range: "61-90天", count: 95 },
    { range: "90天以上", count: 210 },
  ];
}

export function getMemberFunnel(): FunnelStage[] {
  const total = members.length;
  const registered = total * 2;
  const profiled = total * 1.5;
  const chronicTagged = total;
  const followedUp = total * 0.75;
  const repurchased = total * 0.5;

  return [
    { stage: "会员注册", count: Math.round(registered), conversionRate: 100 },
    { stage: "完善档案", count: Math.round(profiled), conversionRate: Math.round((profiled / registered) * 100) },
    { stage: "慢病标签", count: Math.round(chronicTagged), conversionRate: Math.round((chronicTagged / profiled) * 100) },
    { stage: "回访触达", count: Math.round(followedUp), conversionRate: Math.round((followedUp / chronicTagged) * 100) },
    { stage: "复购转化", count: Math.round(repurchased), conversionRate: Math.round((repurchased / followedUp) * 100) },
  ];
}

export function getReplenishmentRanking(limit = 10): ReplenishmentRank[] {
  return drugNames.slice(0, limit).map((d, i) => ({
    drugName: d.name,
    sku: d.sku,
    count: 25 - i * 2 + (i % 3),
  }));
}

export function getInsuranceTrend(months = 6): InsuranceTrendPoint[] {
  const data = [
    { month: "2025-01", amount: 45680, count: 182 },
    { month: "2025-02", amount: 32150, count: 128 },
    { month: "2025-03", amount: 48900, count: 195 },
    { month: "2025-04", amount: 52340, count: 210 },
    { month: "2025-05", amount: 41200, count: 165 },
    { month: "2025-06", amount: 58760, count: 234 },
  ];
  return data.slice(-months);
}

export function getFollowUpsByAssignee(assigneeId: string | null): FollowUp[] {
  if (!assigneeId) return followUps;
  return followUps.filter((f) => f.assigneeId === assigneeId);
}

export function getFollowUpDetail(id: string) {
  const followUp = followUps.find((f) => f.id === id);
  if (!followUp) return null;
  const member = members.find((m) => m.id === followUp.memberId);
  const memberPrescriptions = prescriptions.filter((p) => p.memberId === followUp.memberId);
  const followUpAnnotations = annotations.filter((a) => a.followUpId === id);
  return {
    followUp,
    member,
    prescriptions: memberPrescriptions,
    medications: [
      { drugName: "苯磺酸氨氯地平片", quantity: 2, purchaseDate: "2025-06-01", unitPrice: 28.5 },
      { drugName: "阿托伐他汀钙片", quantity: 1, purchaseDate: "2025-06-01", unitPrice: 45.0 },
      { drugName: "阿司匹林肠溶片", quantity: 3, purchaseDate: "2025-05-15", unitPrice: 15.8 },
    ],
    annotations: followUpAnnotations,
  };
}

export function addAnnotation(followUpId: string, prescriptionId: string | undefined, content: string, createdById: string) {
  const user = users.find((u) => u.id === createdById);
  const newAnnotation: Annotation = {
    id: `a${annotations.length + 1}`,
    followUpId,
    prescriptionId,
    content,
    createdById,
    createdByName: user?.name || "未知",
    createdAt: new Date().toLocaleString("zh-CN"),
  };
  annotations.push(newAnnotation);
  return newAnnotation;
}

export function getImportBatches(params?: { source?: string; status?: string }) {
  let result = [...importBatches];
  if (params?.source) result = result.filter((b) => b.source === params.source);
  if (params?.status) result = result.filter((b) => b.status === params.status);
  return result;
}

export function getImportBatchDetail(batchId: string) {
  const batch = importBatches.find((b) => b.id === batchId);
  if (!batch) return null;
  const records = importRecords.filter((r) => r.batchId === batchId);
  return { batch, records, errors: records.filter((r) => r.status === "error") };
}
