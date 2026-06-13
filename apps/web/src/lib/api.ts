import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'x-operator-id': 'default-operator-id',
  },
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  },
);

export const setOperatorId = (id: string) => {
  api.defaults.headers['x-operator-id'] = id;
};

export default api;

export const apiEndpoints = {
  refundOrders: {
    list: (params?: any) => api.get('/refund-orders', { params }),
    get: (id: string) => api.get(`/refund-orders/${id}`),
    create: (data: any) => api.post('/refund-orders', data),
    update: (id: string, data: any) => api.put(`/refund-orders/${id}`, data),
    assign: (id: string, data: any) => api.post(`/refund-orders/${id}/assign`, data),
    updateStatus: (id: string, data: any) => api.post(`/refund-orders/${id}/status`, data),
    addEvidence: (id: string, data: any) => api.post(`/refund-orders/${id}/evidences`, data),
    deleteEvidence: (id: string, evidenceId: string) => api.delete(`/refund-orders/${id}/evidences/${evidenceId}`),
    addNote: (id: string, data: any) => api.post(`/refund-orders/${id}/notes`, data),
    retry: (id: string, data: any) => api.post(`/refund-orders/${id}/retry`, data),
    supplement: (id: string, data: any) => api.post(`/refund-orders/${id}/supplement`, data),
    close: (id: string, data: any) => api.post(`/refund-orders/${id}/close`, data),
    reopen: (id: string, data: any) => api.post(`/refund-orders/${id}/reopen`, data),
    stats: () => api.get('/refund-orders/stats'),
    kanban: () => api.get('/refund-orders/kanban'),
  },
  users: {
    list: (params?: any) => api.get('/users', { params }),
    operators: () => api.get('/users/operators'),
    regions: () => api.get('/users/regions'),
    get: (id: string) => api.get(`/users/${id}`),
  },
  config: {
    getAll: () => api.get('/config'),
    visitResults: (params?: any) => api.get('/config/visit-results', { params }),
    createVisitResult: (data: any) => api.post('/config/visit-results', data),
    updateVisitResult: (id: string, data: any) => api.put(`/config/visit-results/${id}`, data),
    deleteVisitResult: (id: string) => api.delete(`/config/visit-results/${id}`),
    problemTags: (params?: any) => api.get('/config/problem-tags', { params }),
    createProblemTag: (data: any) => api.post('/config/problem-tags', data),
    updateProblemTag: (id: string, data: any) => api.put(`/config/problem-tags/${id}`, data),
    deleteProblemTag: (id: string) => api.delete(`/config/problem-tags/${id}`),
  },
  responsibilityRules: {
    list: (params?: any) => api.get('/responsibility-rules', { params }),
    get: (id: string) => api.get(`/responsibility-rules/${id}`),
    create: (data: any) => api.post('/responsibility-rules', data),
    update: (id: string, data: any) => api.put(`/responsibility-rules/${id}`, data),
    delete: (id: string) => api.delete(`/responsibility-rules/${id}`),
    match: (data: any) => api.post('/responsibility-rules/match', data),
  },
  reminders: {
    list: (params: any) => api.get('/reminders', { params }),
    unreadCount: (recipientId: string) => api.get(`/reminders/unread-count/${recipientId}`),
    markAsRead: (id: string, data: any) => api.put(`/reminders/${id}/read`, data),
    markAllAsRead: (recipientId: string) => api.put(`/reminders/read-all/${recipientId}`),
    send: (data: any) => api.post('/reminders/send', data),
  },
  timeout: {
    stats: () => api.get('/timeout/stats'),
    sync: () => api.post('/timeout/sync'),
    check: () => api.post('/timeout/check'),
  },
  analysis: {
    closeDuration: (params?: any) => api.get('/analysis/close-duration', { params }),
    trend: (params?: any) => api.get('/analysis/trend', { params }),
    problemTags: (params?: any) => api.get('/analysis/problem-tags', { params }),
    performance: (params?: any) => api.get('/analysis/performance', { params }),
    dashboard: () => api.get('/analysis/dashboard'),
    clearCache: () => api.post('/analysis/clear-cache'),
  },
  timeline: {
    findAll: (params?: any) => api.get('/timeline', { params }),
  },
};
