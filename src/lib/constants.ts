export type FunnelStage =
  | "DEMAND_PLAN"
  | "PURCHASE_ORDER"
  | "WAREHOUSE_OUT"
  | "SITE_DELIVERY"
  | "SITE_ACCEPTANCE"
  | "ACTUAL_USE";

export type ArrivalStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SHORTAGE" | "CANCELLED";
export type SyncStatus = "NOT_SYNCED" | "SYNCING" | "SYNCED" | "FAILED";
export type SyncTaskType = "SUPERVISOR_PHOTO" | "PAYMENT_RECORD" | "PURCHASE_ORDER" | "ALL";
export type AnomalyType =
  | "BATCH_SHORTAGE"
  | "QUALITY_ISSUE"
  | "PHOTO_MISSING"
  | "PAYMENT_MISMATCH"
  | "ORDER_MISSING"
  | "INVENTORY_DIFF"
  | "OTHER";
export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type AnomalyStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "IGNORED";

export const FunnelStage: Record<FunnelStage, FunnelStage> = {
  DEMAND_PLAN: "DEMAND_PLAN",
  PURCHASE_ORDER: "PURCHASE_ORDER",
  WAREHOUSE_OUT: "WAREHOUSE_OUT",
  SITE_DELIVERY: "SITE_DELIVERY",
  SITE_ACCEPTANCE: "SITE_ACCEPTANCE",
  ACTUAL_USE: "ACTUAL_USE",
};

export const ArrivalStatus: Record<ArrivalStatus, ArrivalStatus> = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  SHORTAGE: "SHORTAGE",
  CANCELLED: "CANCELLED",
};

export const SyncStatus: Record<SyncStatus, SyncStatus> = {
  NOT_SYNCED: "NOT_SYNCED",
  SYNCING: "SYNCING",
  SYNCED: "SYNCED",
  FAILED: "FAILED",
};

export const SyncTaskType: Record<SyncTaskType, SyncTaskType> = {
  SUPERVISOR_PHOTO: "SUPERVISOR_PHOTO",
  PAYMENT_RECORD: "PAYMENT_RECORD",
  PURCHASE_ORDER: "PURCHASE_ORDER",
  ALL: "ALL",
};

export const AnomalyType: Record<AnomalyType, AnomalyType> = {
  BATCH_SHORTAGE: "BATCH_SHORTAGE",
  QUALITY_ISSUE: "QUALITY_ISSUE",
  PHOTO_MISSING: "PHOTO_MISSING",
  PAYMENT_MISMATCH: "PAYMENT_MISMATCH",
  ORDER_MISSING: "ORDER_MISSING",
  INVENTORY_DIFF: "INVENTORY_DIFF",
  OTHER: "OTHER",
};

export const Severity: Record<Severity, Severity> = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
};

export const AnomalyStatus: Record<AnomalyStatus, AnomalyStatus> = {
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  RESOLVED: "RESOLVED",
  IGNORED: "IGNORED",
};

export const STAGE_LABELS: Record<FunnelStage, string> = {
  DEMAND_PLAN: "需求计划",
  PURCHASE_ORDER: "采购下单",
  WAREHOUSE_OUT: "仓库出库",
  SITE_DELIVERY: "工地送达",
  SITE_ACCEPTANCE: "现场验收",
  ACTUAL_USE: "实际使用",
};

export const STAGE_ORDER: FunnelStage[] = [
  FunnelStage.DEMAND_PLAN,
  FunnelStage.PURCHASE_ORDER,
  FunnelStage.WAREHOUSE_OUT,
  FunnelStage.SITE_DELIVERY,
  FunnelStage.SITE_ACCEPTANCE,
  FunnelStage.ACTUAL_USE,
];

export const STATUS_LABELS: Record<ArrivalStatus, string> = {
  PENDING: "待处理",
  IN_PROGRESS: "进行中",
  COMPLETED: "已完成",
  SHORTAGE: "短缺",
  CANCELLED: "已取消",
};

export const SYNC_STATUS_LABELS: Record<SyncStatus, string> = {
  NOT_SYNCED: "未同步",
  SYNCING: "同步中",
  SYNCED: "已同步",
  FAILED: "同步失败",
};

export const SYNC_TASK_LABELS: Record<SyncTaskType, string> = {
  SUPERVISOR_PHOTO: "监理照片",
  PAYMENT_RECORD: "收款记录",
  PURCHASE_ORDER: "采购单",
  ALL: "全部同步",
};

export const ANOMALY_TYPE_LABELS: Record<AnomalyType, string> = {
  BATCH_SHORTAGE: "批次短缺",
  QUALITY_ISSUE: "质量问题",
  PHOTO_MISSING: "照片缺失",
  PAYMENT_MISMATCH: "收款不符",
  ORDER_MISSING: "采购单缺失",
  INVENTORY_DIFF: "库存差异",
  OTHER: "其他",
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  LOW: "低",
  MEDIUM: "中",
  HIGH: "高",
  CRITICAL: "严重",
};

export const ANOMALY_STATUS_LABELS: Record<AnomalyStatus, string> = {
  OPEN: "待处理",
  IN_PROGRESS: "处理中",
  RESOLVED: "已解决",
  IGNORED: "已忽略",
};

export const CALIBER_VERSION = "v1.0";

export const CALIBER_DEFINITION = {
  version: CALIBER_VERSION,
  description: "家装工地材料进场漏斗分析口径",
  definitions: {
    周转天数: "自需求计划创建日至实际使用日之间的自然日天数，若未完成则取当前日期计算",
    批次短缺: "实际进场数量 < 计划进场数量，且短缺率 > 5%",
    漏斗转化率: "当前阶段实际数量 / 上一阶段实际数量 × 100%",
    安全库存: "基于历史消耗数据计算的最低保有库存量（3日消耗量）",
  },
  updatedAt: "2026-06-15",
};
