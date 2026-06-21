import dayjs from 'dayjs';

export const formatDate = (date: string) => dayjs(date).format('YYYY-MM-DD');
export const formatDateTime = (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm');
export const formatTime = (time: string) => time?.substring(0, 5);
export const getStatusColor = (status: number) => {
  const colors: Record<number, string> = { 0: 'default', 1: 'processing', 2: 'success', 3: 'green', 4: 'error', 5: 'warning' };
  return colors[status] || 'default';
};
export const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};
