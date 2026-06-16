import api from './client'

export interface Elder {
  id: number
  name: string
  gender: string
  birth_date: string
  id_card: string
  phone?: string
  emergency_contact?: string
  emergency_phone?: string
  address?: string
  health_status: string
  care_level: string
  room_number?: string
  bed_number?: string
  admission_date?: string
  medical_history?: string
  allergies?: string
  dietary_restrictions?: string
  mobility_level?: string
  cognitive_level?: string
  status: string
  avatar_url?: string
  remark?: string
  created_by?: number
  created_at: string
  updated_at: string
}

export interface PaginatedResponse<T> {
  total: number
  page: number
  page_size: number
  items: T[]
}

export const elderApi = {
  getList: (params?: {
    page?: number
    page_size?: number
    keyword?: string
    status?: string
    health_status?: string
    care_level?: string
  }) => {
    return api.get<PaginatedResponse<Elder>>('/elders', { params })
  },

  getDetail: (id: number) => {
    return api.get<Elder>(`/elders/${id}`)
  },

  create: (data: Partial<Elder>) => {
    return api.post<Elder>('/elders', data)
  },

  update: (id: number, data: Partial<Elder>) => {
    return api.put<Elder>(`/elders/${id}`, data)
  },

  updateStatus: (id: number, status: string, remark?: string) => {
    return api.patch<Elder>(`/elders/${id}/status`, { status, remark })
  },

  remove: (id: number) => {
    return api.delete(`/elders/${id}`)
  },
}
