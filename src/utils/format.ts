import { format, subDays, subMonths } from "date-fns";

export function formatNumber(num: number): string {
  return num.toLocaleString("zh-CN");
}

export function formatPercent(num: number): string {
  return `${num >= 0 ? "+" : ""}${num.toFixed(1)}%`;
}

export function formatCurrency(num: number): string {
  if (num >= 10000) {
    return `¥${(num / 10000).toFixed(1)}万`;
  }
  return `¥${num.toLocaleString("zh-CN")}`;
}

export function getCompareDateRange(
  startDate: Date,
  endDate: Date,
  compareType: "yoy" | "mom" | "none"
): [Date, Date] | null {
  if (compareType === "none") return null;

  const daysDiff = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (compareType === "yoy") {
    return [subMonths(startDate, 12), subMonths(endDate, 12)];
  }

  return [subDays(startDate, daysDiff + 1), subDays(endDate, daysDiff + 1)];
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "success":
    case "sold":
    case "selling":
      return "text-emerald-400";
    case "failed":
    case "cancelled":
    case "refunded":
      return "text-red-400";
    case "running":
    case "reserved":
      return "text-primary-400";
    case "almost_full":
      return "text-amber-400";
    default:
      return "text-slate-400";
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}
