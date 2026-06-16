import api from './client'

export interface VisitRecord {
  id: number
  elder_id: number
  visitor_id?: number
  visit_date: string
  visit_time: string
  visit_duration?: number
  visit_type: string
  visitor_name?: string
  visitor_relation?: string
  physical_condition?: string
  mental_condition?: string
  conversation_content?: string
  needs_follow_up?: string
  elder_mood?: string
  remark?: string
  status: string
  created_at: string
  updated_at: string
}

export const visitApi = {
  getList: (elderId: number) => {
    return api.get<VisitRecord[]>(`/elders/${elderId}/visits`)
  },

  getDetail: (id: number) => {
    return api.get<VisitRecord>(`/visits/${id}`)
  },

  create: (elderId: number, data: Partial<VisitRecord>) => {
    return api.post<VisitRecord>(`/elders/${elderId}/visits`, data)
  },

  update: (id: number, data: Partial<VisitRecord>) => {
    return api.put<VisitRecord>(`/visits/${id}`, data)
  },

  remove: (id: number) => {
    return api.delete(`/visits/${id}`)
  },
}
