import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

dayjs.locale('zh-cn');

export const formatDateTime = (date?: string) => {
  if (!date) return '-';
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

export const formatDate = (date?: string) => {
  if (!date) return '-';
  return dayjs(date).format('YYYY-MM-DD');
};

export const formatProgress = (progress: number) => {
  return `${progress.toFixed(2)}%`;
};

export const getProgressStatusClass = (actual: number, expected: number) => {
  const diff = actual - expected;
  if (diff < -5) return 'progress-behind';
  if (diff > 5) return 'progress-ahead';
  return 'progress-on-track';
};

export const getProgressStatusText = (actual: number, expected: number) => {
  const diff = actual - expected;
  if (diff < -5) return '进度落后';
  if (diff > 5) return '进度超前';
  return '进度正常';
};

export const getRoleText = (role: string) => {
  const map: Record<string, string> = {
    admin: '管理员',
    trainer: '教练',
    member: '学员',
    manager: '运营经理',
  };
  return map[role] || role;
};

export const getCourseStatusText = (status: string) => {
  const map: Record<string, string> = {
    not_started: '未开始',
    in_progress: '进行中',
    completed: '已完成',
    paused: '已暂停',
  };
  return map[status] || status;
};

export const getCourseStatusColor = (status: string) => {
  const map: Record<string, string> = {
    not_started: 'default',
    in_progress: 'processing',
    completed: 'success',
    paused: 'warning',
  };
  return map[status] || 'default';
};

export const getNotificationStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    resolved: '已解决',
    closed: '已关闭',
  };
  return map[status] || status;
};

export const getNotificationStatusColor = (status: string) => {
  const map: Record<string, string> = {
    pending: 'error',
    processing: 'processing',
    resolved: 'success',
    closed: 'default',
  };
  return map[status] || 'default';
};

export const getAssignmentTypeText = (type: string) => {
  const map: Record<string, string> = {
    exercise: '力量训练',
    cardio: '有氧运动',
    nutrition: '饮食指导',
    assessment: '评估测试',
  };
  return map[type] || type;
};
