export const statusMap: Record<string, { label: string; className: string }> = {
  PENDING: { label: '待处理', className: 'status-pending' },
  IN_PROGRESS: { label: '进行中', className: 'status-in_progress' },
  COMPLETED: { label: '已完成', className: 'status-completed' },
  CANCELLED: { label: '已取消', className: 'status-cancelled' },
  MISSED: { label: '已漏单', className: 'status-missed' },
};

export const depositStatusMap: Record<string, { label: string; className: string }> = {
  COLLECTED: { label: '已收取', className: 'status-pending' },
  PARTIAL_REFUNDED: { label: '部分退还', className: 'status-in_progress' },
  FULLY_REFUNDED: { label: '全额退还', className: 'status-completed' },
  DEDUCTED: { label: '已扣款', className: 'status-missed' },
};

export function formatDate(date: string | Date, format = 'YYYY-MM-DD') {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes);
}

export function formatDateTime(date: string | Date) {
  return formatDate(date, 'YYYY-MM-DD HH:mm');
}

export function formatCurrency(amount: number | string) {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `¥${num.toFixed(2)}`;
}
