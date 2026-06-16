import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

dayjs.locale('zh-cn');

export const formatDate = (
  date?: string | Date | null,
  format: string = 'YYYY-MM-DD'
): string => {
  if (!date) return '';
  return dayjs(date).format(format);
};

export const formatDateTime = (
  date?: string | Date | null,
  format: string = 'YYYY-MM-DD HH:mm:ss'
): string => {
  if (!date) return '';
  return dayjs(date).format(format);
};

export const formatTime = (
  date?: string | Date | null,
  format: string = 'HH:mm:ss'
): string => {
  if (!date) return '';
  return dayjs(date).format(format);
};

export const formatRelativeTime = (date?: string | Date | null): string => {
  if (!date) return '';
  const diff = dayjs().diff(dayjs(date), 'day');
  if (diff === 0) return '今天';
  if (diff === 1) return '昨天';
  if (diff < 7) return `${diff}天前`;
  return formatDate(date);
};

export const formatDateRange = (
  startDate?: string | Date | null,
  endDate?: string | Date | null,
  format: string = 'YYYY-MM-DD'
): string => {
  if (!startDate && !endDate) return '';
  if (startDate && !endDate) return formatDate(startDate, format);
  if (!startDate && endDate) return formatDate(endDate, format);
  return `${formatDate(startDate, format)} ~ ${formatDate(endDate, format)}`;
};

export const getAge = (dateOfBirth?: string | Date | null): number | null => {
  if (!dateOfBirth) return null;
  return dayjs().diff(dayjs(dateOfBirth), 'year');
};

export const formatDuration = (hours: number): string => {
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes}分钟`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (days > 0) {
    return remainingHours > 0 ? `${days}天${remainingHours.toFixed(1)}小时` : `${days}天`;
  }
  return `${hours.toFixed(1)}小时`;
};

export { dayjs };
