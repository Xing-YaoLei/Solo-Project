import api from './client'

export interface IncidentOrder {
  id: number
  order_no: string
  elder_id: number
  risk_event_id?: number
  incident_type: string
  severity: string
  incident_date: string
  incident_time: string
  location?: string
  impact_scope: string
  responsibility: string
  responsible_person?: string
  handling_result: string
  preventive_measures?: string
  description: string
  immediate_actions?: string
  medical_treatment?: string
  family_notified: string
  family_notification_time?: string
  family_response?: string
  reported_by_id?: number
  handled_by?: string
  reviewed_by?: string
  status: string
  closure_date?: string
  remark?: string
  created_at: string
  updated_at: string
}

export const incidentApi = {
  getList: (params?: {
    page?: number
    page_size?: number
    incident_type?: string
    severity?: string
    status?: string
  }) => {
    return api.get<any>('/incident-orders', { params })
  },

  getDetail: (id: number) => {
    return api.get<IncidentOrder>(`/incident-orders/${id}`)
  },

  create: (data: Partial<IncidentOrder> & { elder_id: number }) => {
    return api.post<IncidentOrder>('/incident-orders', data)
  },

  update: (id: number, data: Partial<IncidentOrder>) => {
    return api.put<IncidentOrder>(`/incident-orders/${id}`, data)
  },

  updateStatus: (id: number, status: string) => {
    return api.patch<IncidentOrder>(`/incident-orders/${id}/status`, { status })
  },

  remove: (id: number) => {
    return api.delete(`/incident-orders/${id}`)
  },
}
