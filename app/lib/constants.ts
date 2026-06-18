import type { AcquisitionStage, RiskLevel } from "~/models/vehicle";

export const STAGE_LABELS: Record<AcquisitionStage, string> = {
  archive: "车辆档案",
  inspection: "检测报告",
  preparation: "整备清单",
  testdrive: "试驾记录",
  quoting: "报价阶段",
  completed: "已完成",
  cancelled: "已取消",
};

export const STAGE_ORDER: AcquisitionStage[] = [
  "archive",
  "inspection",
  "preparation",
  "testdrive",
  "quoting",
  "completed",
  "cancelled",
];

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  low: "低风险",
  medium: "中风险",
  high: "高风险",
  critical: "紧急风险",
};

export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#ef4444",
  critical: "#dc2626",
};

export const RISK_LEVEL_BG_COLORS: Record<RiskLevel, string> = {
  low: "#d1fae5",
  medium: "#fef3c7",
  high: "#fee2e2",
  critical: "#fecaca",
};

export const FUEL_TYPE_LABELS: Record<string, string> = {
  gasoline: "汽油",
  diesel: "柴油",
  hybrid: "混动",
  electric: "纯电",
};

export const TRANSMISSION_LABELS: Record<string, string> = {
  manual: "手动",
  automatic: "自动",
  cvt: "无级变速",
};

export const DOCUMENT_NAMES: Record<string, string> = {
  registration: "机动车登记证书",
  drivingLicense: "行驶证",
  insurance: "保险单",
  maintenanceRecord: "保养记录",
  accidentRecord: "事故记录",
  emissionTest: "排放标准检测",
};

export const COMMUNICATION_TYPE_LABELS: Record<string, string> = {
  phone: "电话",
  email: "邮件",
  chat: "聊天",
  meeting: "面谈",
  other: "其他",
};

export const COMMUNICATION_CATEGORY_LABELS: Record<string, string> = {
  info_request: "资料索取",
  price_negotiation: "价格协商",
  document_missing: "资料缺失",
  review: "复核确认",
  general: "一般沟通",
};

export const CONDITION_LABELS: Record<string, string> = {
  excellent: "优秀",
  good: "良好",
  fair: "一般",
  poor: "较差",
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};
