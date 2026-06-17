import dayjs from 'dayjs';

export const formatMoney = (amount: number, currency = '¥'): string => {
  return `${currency}${amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatNumber = (num: number): string => {
  return num.toLocaleString('zh-CN');
};

export const formatDuration = (hours: number): string => {
  if (hours < 24) {
    return `${hours.toFixed(1)} 小时`;
  }
  const days = Math.floor(hours / 24);
  const remainHours = hours % 24;
  if (remainHours === 0) {
    return `${days} 天`;
  }
  return `${days} 天 ${remainHours.toFixed(0)} 小时`;
};

export const formatDate = (date: string | Date | dayjs.Dayjs, format = 'YYYY-MM-DD'): string => {
  return dayjs(date).format(format);
};

export const formatDateTime = (date: string | Date | dayjs.Dayjs): string => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

export const getRelativeTime = (date: string | Date | dayjs.Dayjs): string => {
  const now = dayjs();
  const target = dayjs(date);
  const diffDays = now.diff(target, 'day');
  
  if (diffDays === 0) {
    const diffHours = now.diff(target, 'hour');
    if (diffHours === 0) {
      const diffMinutes = now.diff(target, 'minute');
      return diffMinutes <= 1 ? '刚刚' : `${diffMinutes} 分钟前`;
    }
    return `${diffHours} 小时前`;
  }
  if (diffDays === 1) {
    return '昨天';
  }
  if (diffDays < 7) {
    return `${diffDays} 天前`;
  }
  return formatDate(date);
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

export const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    pending: 'orange',
    processing: 'blue',
    success: 'green',
    completed: 'green',
    failed: 'red',
    cancelled: 'default',
    paid: 'green',
    overdue: 'red',
  };
  return colorMap[status] || 'default';
};

export const getStatusText = (status: string): string => {
  const textMap: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    success: '成功',
    completed: '已完成',
    failed: '失败',
    cancelled: '已取消',
    paid: '已支付',
    overdue: '已逾期',
  };
  return textMap[status] || status;
};

export const calculateDuration = (start: string | Date, end: string | Date): number => {
  return dayjs(end).diff(dayjs(start), 'hour', true);
};
