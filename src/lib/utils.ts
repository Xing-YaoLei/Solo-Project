import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 2,
  }).format(num);
}

export function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatDateTime(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getRiskLabel(level: string) {
  switch (level) {
    case "high":
      return { text: "高风险", className: "bg-risk-high text-white" };
    case "medium":
      return { text: "中风险", className: "bg-risk-medium text-white" };
    case "low":
      return { text: "低风险", className: "bg-risk-low text-white" };
    default:
      return { text: "未知", className: "bg-slate-400 text-white" };
  }
}

export function getStatusLabel(status: string) {
  switch (status) {
    case "pending":
      return { text: "待回访", className: "bg-slate-100 text-slate-700 border border-slate-300" };
    case "completed":
      return { text: "已完成", className: "bg-primary-100 text-primary-700 border border-primary-300" };
    case "annotated":
      return { text: "已注释", className: "bg-warning-100 text-warning-700 border border-warning-300" };
    case "processing":
      return { text: "处理中", className: "bg-info-100 text-info-700 border border-info-300" };
    case "completed":
      return { text: "已完成", className: "bg-primary-100 text-primary-700 border border-primary-300" };
    case "failed":
      return { text: "失败", className: "bg-red-100 text-red-700 border border-red-300" };
    default:
      return { text: status, className: "bg-slate-100 text-slate-700" };
  }
}

export function getSourceLabel(source: string) {
  const map: Record<string, string> = {
    pos: "收银系统",
    member: "会员记录",
    inventory: "库存表",
    insurance: "医保流水",
  };
  return map[source] || source;
}
