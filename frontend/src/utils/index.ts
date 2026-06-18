import dayjs from 'dayjs';

export const formatDate = (date: string | Date, format: string = 'YYYY-MM-DD') => {
  if (!date) return '';
  return dayjs(date).format(format);
};

export const formatDateTime = (date: string | Date) => {
  if (!date) return '';
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

export const formatMoney = (amount: number) => {
  if (amount === undefined || amount === null) return '¥0.00';
  return `¥${amount.toFixed(2)}`;
};

export const formatMileage = (mileage: number) => {
  if (mileage === undefined || mileage === null) return '0 km';
  return `${mileage.toLocaleString()} km`;
};

export const generateOrderNo = () => {
  const date = dayjs().format('YYYYMMDD');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `YY${date}${random}`;
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export default {
  formatDate,
  formatDateTime,
  formatMoney,
  formatMileage,
  generateOrderNo,
  debounce,
};
