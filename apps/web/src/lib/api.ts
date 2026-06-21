import request from './request';

export const authApi = {
  login: (data: { username: string; password: string }) =>
    request.post<any, { access_token: string; user: User }>('/auth/login', data),
  profile: () => request.get<any, User>('/auth/profile'),
};

export const taskApi = {
  list: (params?: any) => request.get<any, { items: Task[]; total: number }>('/tasks', { params }),
  detail: (id: string) => request.get<any, Task>(`/tasks/${id}`),
  create: (data: any) => request.post<any, Task>('/tasks', data),
  update: (id: string, data: any) => request.put<any, Task>(`/tasks/${id}`, data),
  dashboardStats: () => request.get<any, any>('/tasks/dashboard/stats'),
  addTrack: (id: string, data: any) => request.post<any, any>(`/tasks/${id}/tracks`, data),
  applySubsidy: (id: string, data: any) => request.post<any, any>(`/tasks/${id}/subsidy`, data),
};

export const riderApi = {
  list: (params?: any) => request.get<any, Rider[]>('/riders', { params }),
  detail: (id: string) => request.get<any, Rider>(`/riders/${id}`),
  tracks: (id: string, params?: any) => request.get<any, any[]>(`/riders/${id}/tracks`, { params }),
};

export const damageApi = {
  list: (params?: any) => request.get<any, { items: Damage[]; total: number }>('/damages', { params }),
  detail: (id: string) => request.get<any, Damage>(`/damages/${id}`),
  create: (data: any) => request.post<any, Damage>('/damages', data),
  update: (id: string, data: any) => request.put<any, Damage>(`/damages/${id}`, data),
  stats: () => request.get<any, any>('/damages/stats'),
  addCommunication: (id: string, data: any) => request.post<any, any>(`/damages/${id}/communications`, data),
  addReview: (id: string, data: any) => request.post<any, any>(`/damages/${id}/reviews`, data),
};

export const dashboardApi = {
  overview: () => request.get<any, any>('/dashboard/overview'),
  riderTrend: (params?: any) => request.get<any, any>('/dashboard/rider-trend', { params }),
  taskDistribution: () => request.get<any, any[]>('/dashboard/task-distribution'),
};

export interface User {
  id: string;
  username: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'DISPATCHER' | 'VERIFIER' | 'RIDER';
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Rider {
  id: string;
  userId: string;
  riderCode: string;
  status: 'OFFLINE' | 'IDLE' | 'ON_DELIVERY' | 'ON_BREAK';
  totalOrders: number;
  rating: number;
  vehicleType: string;
  vehiclePlate?: string;
  idCardNo: string;
  joinDate: string;
  lastActiveAt?: string;
  currentLat?: number;
  currentLng?: number;
  user: Pick<User, 'id' | 'name' | 'phone' | 'avatarUrl'>;
  tasks?: Task[];
  activities?: any[];
}

export interface Task {
  id: string;
  taskNo: string;
  orderNo: string;
  riderId: string;
  assignedToId?: string;
  createdById: string;
  dispatchedById?: string;
  status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'VERIFIED' | 'COMPLETED' | 'CANCELLED' | 'DAMAGED';
  currentStep?: 'PHOTO_UPLOADED' | 'TAG_REVIEWED' | 'ADDRESS_CHECKED' | 'TRACKING_CONFIRMED' | 'SUBSIDY_APPLIED';
  pickupAddress: string;
  pickupLat?: number;
  pickupLng?: number;
  deliveryAddress: string;
  deliveryLat?: number;
  deliveryLng?: number;
  itemName: string;
  itemQuantity: number;
  itemValue?: number;
  estimatedAmount?: number;
  photos: { url: string; type?: string }[];
  evaluationTags: string[];
  addressMatched?: boolean;
  addressNote?: string;
  note?: string;
  assignedAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  rider?: Rider;
  assignedTo?: Pick<User, 'id' | 'name'>;
  createdBy?: Pick<User, 'id' | 'name'>;
  dispatchedBy?: Pick<User, 'id' | 'name'>;
  tracks?: any[];
  subsidy?: any;
  damageReport?: any;
  stepLogs?: any[];
}

export interface Damage {
  id: string;
  reportNo: string;
  taskId: string;
  riderId: string;
  createdById: string;
  handledById?: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'REPORTED' | 'UNDER_REVIEW' | 'COMMUNICATING' | 'REVIEW_CONFIRMED' | 'RESOLVED' | 'REJECTED';
  damageType: string;
  description: string;
  photos: any[];
  estimatedLoss?: number;
  actualLoss?: number;
  compensation?: number;
  responsibility?: string;
  createdAt: string;
  updatedAt: string;
  task?: Task;
  createdBy?: Pick<User, 'id' | 'name' | 'role'>;
  handledBy?: Pick<User, 'id' | 'name' | 'role'>;
  communications?: any[];
  reviews?: any[];
}
