import axios from 'axios';
import { message } from 'antd';

// 创建axios实例，baseURL为空走proxy代理
const api = axios.create({
  baseURL: '',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // 统一错误处理
    const status = error.response?.status;
    let errorMsg = '请求失败，请稍后重试';

    if (status === 400) {
      errorMsg = error.response?.data?.detail || '请求参数错误';
    } else if (status === 401) {
      errorMsg = '未授权，请重新登录';
    } else if (status === 403) {
      errorMsg = '无权限访问该资源';
    } else if (status === 404) {
      errorMsg = '请求的资源不存在';
    } else if (status === 500) {
      errorMsg = error.response?.data?.detail || '服务器内部错误';
    } else if (status === 502) {
      errorMsg = '网关错误，请稍后重试';
    } else if (status === 503) {
      errorMsg = '服务不可用，请稍后重试';
    } else if (error.code === 'ECONNABORTED') {
      errorMsg = '请求超时，请稍后重试';
    }

    message.error(errorMsg);
    return Promise.reject(error);
  }
);

// ==================== 分析统计相关接口 ====================

// 获取仪表盘概览数据
export const getDashboard = () => {
  return api.get('/api/analytics/overview/dashboard');
};

// 获取清洁风险时间序列数据
// params: { start_date, end_date, store_id, risk_level }
export const getCleanRiskTimeseries = (params = {}) => {
  return api.get('/api/analytics/clean-risk/timeseries', { params });
};

// 获取离线缺口样本数据
// params: { start_date, end_date, store_id }
export const getOfflineGapSamples = (params = {}) => {
  return api.get('/api/analytics/offline-gap/samples', { params });
};

// 获取Top风险门店/设备
// params: { limit, risk_level }
export const getTopRisks = (params = {}) => {
  return api.get('/api/analytics/top-risks', { params });
};

// 获取数据状态检查
export const getDataStatus = () => {
  return api.get('/api/analytics/data-status');
};

// 初始化Mock数据
export const initMockData = () => {
  return api.post('/api/analytics/init-data');
};

// ==================== 设备管理相关接口 ====================

// 获取门店列表
export const getStores = () => {
  return api.get('/api/equipment/stores/');
};

// 获取设备列表
// params: { store_id, equipment_type, status, page, page_size }
export const getEquipments = (params = {}) => {
  return api.get('/api/equipment/', { params });
};

// ==================== 库存版本对比相关接口 ====================

// 获取库存版本列表
export const getInventoryVersions = () => {
  return api.get('/api/inventory/versions');
};

// 对比库存版本数据
// params: { version_a, version_b, store_id }
export const compareInventory = (params = {}) => {
  return api.get('/api/inventory/compare', { params });
};

// ==================== POS数据对比相关接口 ====================

// 获取POS版本列表
export const getPosVersions = () => {
  return api.get('/api/pos/versions');
};

// 对比POS版本数据
// params: { version_a, version_b, store_id }
export const comparePos = (params = {}) => {
  return api.get('/api/pos/compare', { params });
};

// 获取会员与POS口径冲突数据
// params: { store_id, start_date, end_date, page, page_size }
export const getMemberPosConflicts = (params = {}) => {
  return api.get('/api/pos/conflicts', { params });
};

// ==================== 故障与整改相关接口 ====================

// 获取故障总览统计
export const getFaultOverview = () => {
  return api.get('/api/faults/overview');
};

// 获取故障列表
// params: { store_id, equipment_id, fault_type, status, start_date, end_date, page, page_size }
export const getFaults = (params = {}) => {
  return api.get('/api/faults/', { params });
};

// 筛选任务列表（与故障联动）
// data: { status, priority, assignee, store_id, start_date, end_date }
export const filterTasks = (data = {}) => {
  return api.post('/api/tasks/filter', data);
};

// 获取任务工作流统计
export const getTaskStats = () => {
  return api.get('/api/tasks/stats/workflow');
};

// ==================== 巡检复盘相关接口 ====================

// 获取巡检合格率趋势
// params: { start_date, end_date, store_id, period }  period: day/week/month
export const getInspectionTrends = (params = {}) => {
  return api.get('/api/inspection/trends', { params });
};

// 获取巡检数据对比
export const getInspectionComparison = () => {
  return api.get('/api/inspection/comparison');
};

// 默认导出api实例，方便扩展使用
export default api;
