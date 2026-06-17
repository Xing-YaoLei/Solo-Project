export function formatDate(date: string | Date, format = "YYYY-MM-DD"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const map: Record<string, string> = {
    YYYY: String(d.getFullYear()),
    MM: String(d.getMonth() + 1).padStart(2, "0"),
    DD: String(d.getDate()).padStart(2, "0"),
    HH: String(d.getHours()).padStart(2, "0"),
    mm: String(d.getMinutes()).padStart(2, "0"),
    ss: String(d.getSeconds()).padStart(2, "0"),
  };
  return format.replace(/YYYY|MM|DD|HH|mm|ss/g, (match) => map[match]);
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, "YYYY-MM-DD HH:mm");
}

export function formatTime(date: string | Date): string {
  return formatDate(date, "HH:mm");
}

export function formatNumber(num: number, decimals = 0): string {
  return num.toLocaleString("zh-CN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatCurrency(amount: number): string {
  return `¥${formatNumber(amount, 2)}`;
}

export function formatPercent(value: number, decimals = 1): string {
  return `${formatNumber(value, decimals)}%`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function truncate(str: string, max = 50): string {
  return str.length > max ? str.slice(0, max) + "..." : str;
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: "待执行",
    in_progress: "进行中",
    completed: "已完成",
    delayed: "已延误",
    checked_in: "已签到",
    not_checked_in: "未签到",
    abnormal: "签到异常",
    normal: "正常",
    missing: "缺失",
  };
  return map[status] ?? status;
}

export function getStatusColorClass(status: string): string {
  const map: Record<string, string> = {
    pending: "badge-info",
    in_progress: "badge-warning",
    completed: "badge-success",
    delayed: "badge-danger",
    checked_in: "badge-success",
    not_checked_in: "badge-warning",
    abnormal: "badge-danger",
    normal: "badge-success",
    missing: "badge-danger",
  };
  return map[status] ?? "badge-info";
}
