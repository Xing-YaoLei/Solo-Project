import api from './client'

export interface RiskEvent {
  id: number
  elder_id: number
  event_type: string
  event_level: string
  event_date: string
  event_time: string
  location?: string
  description: string
  causes?: string
  injuries?: string
  immediate_measures?: string
  reported_by_id?: number
  witnesses?: string
  status: string
  handling_result?: string
  follow_up_plan?: string
  remark?: string
  created_at: string
  updated_at: string
}

export const riskApi = {
  getList: (params?: {
    page?: number
    page_size?: number
    event_type?: string
    event_level?: string
    status?: string
    elder_id?: number
  }) => {
    return api.get<any>('/risk-events', { params })
  },

  getDetail: (id: number) => {
    return api.get<RiskEvent>(`/risk-events/${id}`)
  },

  create: (data: Partial<RiskEvent> & { elder_id: number }) => {
    return api.post<RiskEvent>('/risk-events', data)
  },

  update: (id: number, data: Partial<RiskEvent>) => {
    return api.put<RiskEvent>(`/risk-events/${id}`, data)
  },

  updateStatus: (id: number, status: string) => {
    return api.patch<RiskEvent>(`/risk-events/${id}/status`, { status })
  },

  remove: (id: number) => {
    return api.delete(`/risk-events/${id}`)
  },

  createIncident: (riskEventId: number) => {
    return api.post<any>(`/risk-events/${riskEventId}/create-incident`)
  },
}
