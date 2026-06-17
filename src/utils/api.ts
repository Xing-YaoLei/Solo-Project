import type {
  ApiResponse,
  DashboardMetrics,
  MeterReading,
  InspectionItem,
  PaymentFlow,
  ComplaintTag,
  PropertyRanking,
  PaginatedResponse,
  User,
  ShareLink,
  UserRole,
} from '../../shared/types';

const API_BASE = '/api';

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export const api = {
  async getMetrics(role?: UserRole, area?: string): Promise<DashboardMetrics> {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (area) params.append('area', area);
    const response = await request<ApiResponse<DashboardMetrics>>(
      `/metrics?${params.toString()}`
    );
    return response.data;
  },

  async getMeterReadings(
    propertyId?: string,
    months?: number,
    role?: UserRole,
    area?: string
  ): Promise<MeterReading[]> {
    const params = new URLSearchParams();
    if (propertyId) params.append('propertyId', propertyId);
    if (months) params.append('months', months.toString());
    if (role) params.append('role', role);
    if (area) params.append('area', area);
    const response = await request<ApiResponse<MeterReading[]>>(
      `/charts/meter-readings?${params.toString()}`
    );
    return response.data;
  },

  async getInspectionItems(
    role?: UserRole,
    area?: string
  ): Promise<InspectionItem[]> {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (area) params.append('area', area);
    const response = await request<ApiResponse<InspectionItem[]>>(
      `/charts/inspection-items?${params.toString()}`
    );
    return response.data;
  },

  async getPaymentFlows(
    page: number = 1,
    pageSize: number = 10,
    startTime?: string,
    endTime?: string,
    propertyId?: string,
    role?: UserRole,
    area?: string
  ): Promise<PaginatedResponse<PaymentFlow>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (startTime) params.append('startTime', startTime);
    if (endTime) params.append('endTime', endTime);
    if (propertyId) params.append('propertyId', propertyId);
    if (role) params.append('role', role);
    if (area) params.append('area', area);
    const response = await request<ApiResponse<PaginatedResponse<PaymentFlow>>>(
      `/charts/payment-flows?${params.toString()}`
    );
    return response.data;
  },

  async getComplaintTags(
    role?: UserRole,
    area?: string
  ): Promise<ComplaintTag[]> {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (area) params.append('area', area);
    const response = await request<ApiResponse<ComplaintTag[]>>(
      `/charts/complaint-tags?${params.toString()}`
    );
    return response.data;
  },

  async getPropertyRanking(
    metric: 'repair' | 'complaint' = 'repair',
    mode: 'absolute' | 'ratio' = 'absolute',
    role?: UserRole,
    area?: string
  ): Promise<PropertyRanking[]> {
    const params = new URLSearchParams();
    params.append('metric', metric);
    params.append('mode', mode);
    if (role) params.append('role', role);
    if (area) params.append('area', area);
    const response = await request<ApiResponse<PropertyRanking[]>>(
      `/charts/property-ranking?${params.toString()}`
    );
    return response.data;
  },

  async exportReport(
    format: 'excel' | 'pdf' = 'excel',
    role?: UserRole,
    area?: string
  ): Promise<void> {
    const params = new URLSearchParams();
    params.append('format', format);
    if (role) params.append('role', role);
    if (area) params.append('area', area);

    const response = await fetch(
      `${API_BASE}/export/report?${params.toString()}`,
      {
        method: 'GET',
      }
    );

    if (!response.ok) {
      throw new Error('导出失败');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const disposition = response.headers.get('Content-Disposition');
    const filename = disposition?.split('filename=')[1]?.replace(/"/g, '') || 'report.xlsx';
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  async login(userId: string): Promise<User> {
    const response = await request<ApiResponse<User>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
    return response.data;
  },

  async getUsers(): Promise<User[]> {
    const response = await request<ApiResponse<User[]>>('/auth/users');
    return response.data;
  },

  async createShareLink(
    userId: string,
    expireDays: number = 7
  ): Promise<ShareLink> {
    const response = await request<ApiResponse<ShareLink>>('/auth/share', {
      method: 'POST',
      body: JSON.stringify({ userId, expireDays }),
    });
    return response.data;
  },

  async getShareData(
    token: string
  ): Promise<{ user: User; dataScope: object }> {
    const response = await request<ApiResponse<{ user: User; dataScope: object }>>(
      `/auth/share/${token}`
    );
    return response.data;
  },

  async logout(): Promise<void> {
    await request('/auth/logout', {
      method: 'POST',
    });
  },
};

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatAmount(amount: number): string {
  return amount.toLocaleString('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
  });
}

export const roleLabels: Record<UserRole, string> = {
  operation_manager: '运营主管',
  area_manager: '区域经理',
  repair_manager: '维修主管',
  service_manager: '客服主管',
};
