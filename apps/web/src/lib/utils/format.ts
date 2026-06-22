import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.locale('zh-cn');
dayjs.extend(relativeTime);

export const formatDate = (
  date: string | Date | undefined | null,
  format: string = 'YYYY-MM-DD',
): string => {
  if (!date) return '-';
  return dayjs(date).format(format);
};

export const formatDateTime = (
  date: string | Date | undefined | null,
  format: string = 'YYYY-MM-DD HH:mm:ss',
): string => {
  if (!date) return '-';
  return dayjs(date).format(format);
};

export const formatRelativeTime = (date: string | Date | undefined | null): string => {
  if (!date) return '-';
  return dayjs(date).fromNow();
};

export const formatMoney = (
  amount: number | undefined | null,
  currency: string = 'CNY',
  decimals: number = 2,
): string => {
  if (amount === null || amount === undefined || isNaN(amount)) return '-';
  const symbols: Record<string, string> = {
    CNY: '¥',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };
  const symbol = symbols[currency] || '';
  return (
    symbol +
    amount.toLocaleString('zh-CN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  );
};

export const formatNumber = (
  num: number | undefined | null,
  decimals: number = 0,
): string => {
  if (num === null || num === undefined || isNaN(num)) return '-';
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const formatPercent = (
  value: number | undefined | null,
  decimals: number = 2,
): string => {
  if (value === null || value === undefined || isNaN(value)) return '-';
  return `${value.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}%`;
};

export const formatFileSize = (bytes: number | undefined | null): string => {
  if (bytes === null || bytes === undefined || isNaN(bytes) || bytes === 0) return '-';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);

  return `${value.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
};

export const formatDuration = (seconds: number | undefined | null): string => {
  if (seconds === null || seconds === undefined || isNaN(seconds) || seconds < 0) return '-';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}小时${minutes}分钟${secs}秒`;
  } else if (minutes > 0) {
    return `${minutes}分钟${secs}秒`;
  } else {
    return `${secs}秒`;
  }
};

export const formatPhone = (phone: string | undefined | null): string => {
  if (!phone) return '-';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1 **** $3');
  }
  return phone;
};

export const formatEmail = (email: string | undefined | null): string => {
  if (!email) return '-';
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return email;
  }
  return `${local.slice(0, 2)}***@${domain}`;
};
