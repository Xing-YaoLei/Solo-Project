import dayjs from 'dayjs';

export function formatMoney(amount: number): string {
  return `${amount.toLocaleString('zh-CN')}元`;
}

export function formatDays(days: number): string {
  return `${days}天`;
}

export function formatPercent(val: number): string {
  const num = Number(val);
  if (Number.isNaN(num)) {
    return '0%';
  }
  return `${num.toFixed(1)}%`;
}

export function formatDateTime(iso: string): string {
  if (!iso) {
    return '-';
  }
  return dayjs(iso).format('YYYY-MM-DD HH:mm');
}

export function formatDate(iso: string): string {
  if (!iso) {
    return '-';
  }
  return dayjs(iso).format('YYYY-MM-DD');
}
