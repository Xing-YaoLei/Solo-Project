export function formatSeconds(
  seconds: number,
  options: { showHours?: boolean; pad?: boolean; withUnit?: boolean } = {}
): string {
  const { showHours = true, pad = true, withUnit = false } = options;
  const absSeconds = Math.max(0, Math.floor(Math.abs(seconds)));

  const h = Math.floor(absSeconds / 3600);
  const m = Math.floor((absSeconds % 3600) / 60);
  const s = absSeconds % 60;

  const pad2 = (n: number) => (pad ? n.toString().padStart(2, '0') : n.toString());

  if (withUnit) {
    if (showHours && h > 0) {
      return `${h}小时${pad2(m)}分${pad2(s)}秒`;
    }
    if (m > 0) {
      return `${m}分${pad2(s)}秒`;
    }
    return `${s}秒`;
  }

  if (showHours && h > 0) {
    return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
  }
  return `${pad2(m)}:${pad2(s)}`;
}

export function formatMinutes(
  minutes: number,
  options: { decimals?: number; withUnit?: boolean } = {}
): string {
  const { decimals = 0, withUnit = false } = options;
  const rounded = Number(minutes.toFixed(decimals));

  if (!withUnit) {
    return rounded.toFixed(decimals);
  }

  if (rounded < 60) {
    return `${rounded}分钟`;
  }

  const hours = Math.floor(rounded / 60);
  const mins = Math.round(rounded % 60);

  if (mins === 0) {
    return `${hours}小时`;
  }
  return `${hours}小时${mins}分`;
}

export function formatTimeOfDay(timestampSeconds: number): string {
  const date = new Date(timestampSeconds * 1000);
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function formatNumber(
  num: number,
  options: { decimals?: number; thousandSeparator?: boolean } = {}
): string {
  const { decimals = 0, thousandSeparator = true } = options;
  const fixed = num.toFixed(decimals);

  if (!thousandSeparator) {
    return fixed;
  }

  const [intPart, decPart] = fixed.split('.');
  const withSeparator = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decPart ? `${withSeparator}.${decPart}` : withSeparator;
}

export function formatPercent(
  value: number,
  options: { decimals?: number; multiply?: boolean; withSymbol?: boolean } = {}
): string {
  const { decimals = 1, multiply = true, withSymbol = true } = options;
  const displayValue = multiply ? value * 100 : value;
  const formatted = displayValue.toFixed(decimals);
  return withSymbol ? `${formatted}%` : formatted;
}

export function formatCurrency(
  amount: number,
  options: { symbol?: string; decimals?: number } = {}
): string {
  const { symbol = '¥', decimals = 2 } = options;
  return `${symbol}${formatNumber(amount, { decimals, thousandSeparator: true })}`;
}

export function formatMileage(
  meters: number,
  options: { withUnit?: boolean } = {}
): string {
  const { withUnit = true } = options;
  const km = meters / 1000;
  const formatted = formatNumber(Math.round(km), { thousandSeparator: true });
  return withUnit ? `${formatted} km` : formatted;
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDateTime(timestamp: number): string {
  const dateStr = formatDate(timestamp);
  const date = new Date(timestamp);
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${dateStr} ${h}:${m}`;
}

export function formatRelativeTime(timestamp: number, now: number = Date.now()): string {
  const diffSeconds = Math.floor((now - timestamp) / 1000);
  const absDiff = Math.abs(diffSeconds);
  const isPast = diffSeconds >= 0;

  if (absDiff < 60) {
    return isPast ? '刚刚' : '即将';
  }
  if (absDiff < 3600) {
    const mins = Math.floor(absDiff / 60);
    return isPast ? `${mins}分钟前` : `${mins}分钟后`;
  }
  if (absDiff < 86400) {
    const hours = Math.floor(absDiff / 3600);
    return isPast ? `${hours}小时前` : `${hours}小时后`;
  }
  if (absDiff < 2592000) {
    const days = Math.floor(absDiff / 86400);
    return isPast ? `${days}天前` : `${days}天后`;
  }

  return formatDate(timestamp);
}

export function formatProgress(current: number, total: number): string {
  if (total <= 0) return '0%';
  const percent = Math.min(100, Math.round((current / total) * 100));
  return `${percent}%`;
}

export function formatDurationFromTo(
  startTimestamp: number,
  endTimestamp: number
): string {
  const durationSeconds = Math.max(0, endTimestamp - startTimestamp);
  return formatSeconds(durationSeconds, { withUnit: true });
}

export function formatStars(count: number, max: number = 3): string {
  const filled = Math.min(count, max);
  const empty = max - filled;
  return '★'.repeat(filled) + '☆'.repeat(empty);
}
