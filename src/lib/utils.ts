import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, subDays, subMonths, startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";
import { zhCN } from "date-fns/locale";

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

export function formatDate(date: Date | string, pattern: string = "yyyy-MM-dd") {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, pattern, { locale: zhCN });
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}小时${mins > 0 ? `${mins}分钟` : ""}`;
}

export function getDateRange(range: "7d" | "30d" | "90d" | "month" | "lastMonth") {
  const end = endOfDay(new Date());
  let start: Date;

  switch (range) {
    case "7d":
      start = startOfDay(subDays(end, 6));
      break;
    case "30d":
      start = startOfDay(subDays(end, 29));
      break;
    case "90d":
      start = startOfDay(subDays(end, 89));
      break;
    case "month":
      start = startOfMonth(end);
      break;
    case "lastMonth":
      start = startOfMonth(subMonths(end, 1));
      return { start, end: endOfMonth(subMonths(end, 1)) };
    default:
      start = startOfDay(subDays(end, 29));
  }

  return { start, end };
}

export function calculateYoY(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function calculateMoM(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}
