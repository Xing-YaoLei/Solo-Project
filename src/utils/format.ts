export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const dateStr = formatDate(d);
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${dateStr} ${hours}:${minutes}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("zh-CN").format(num);
}

export function getLastUpdatedText(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "刚刚更新";
  if (diffMins < 60) return `${diffMins} 分钟前更新`;
  if (diffHours < 24) return `${diffHours} 小时前更新`;
  if (diffDays < 7) return `${diffDays} 天前更新`;
  return formatDateTime(timestamp) + " 更新";
}

export function generateRandomId(prefix: string = ""): string {
  return prefix + Math.random().toString(36).substring(2, 11);
}

export function maskSensitiveData(text: string, type: "phone" | "name" | "plate" | "amount"): string {
  switch (type) {
    case "phone":
      if (text.length <= 7) return text.replace(/.(?=.*$)/g, "*");
      return text.slice(0, 3) + "****" + text.slice(-4);
    case "name":
      if (text.length <= 1) return "*";
      if (text.length === 2) return text[0] + "*";
      return text[0] + "*".repeat(text.length - 2) + text.slice(-1);
    case "plate":
      if (text.length <= 4) return text;
      return text.slice(0, 2) + "****" + text.slice(-2);
    case "amount":
      return "***";
    default:
      return text;
  }
}

export function getSeverityColor(severity: "low" | "medium" | "high"): string {
  const colors = {
    low: "text-warning",
    medium: "text-industrial-500",
    high: "text-danger",
  };
  return colors[severity] || colors.low;
}

export function getSeverityBgColor(severity: "low" | "medium" | "high"): string {
  const colors = {
    low: "bg-warning/10",
    medium: "bg-industrial-500/10",
    high: "bg-danger/10",
  };
  return colors[severity] || colors.low;
}
