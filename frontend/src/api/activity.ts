import api from './client'

export interface Activity {
  id: number
  name: string
  activity_type: string
  description?: string
  location?: string
  activity_date: string
  start_time: string
  end_time: string
  max_participants?: number
  instructor?: string
  equipment_needed?: string
  risk_level: string
  status: string
  created_by?: number
  created_at: string
  updated_at: string
}

export interface ActivitySignIn {
  id: number
  activity_id: number
  elder_id: number
  sign_in_time?: string
  sign_out_time?: string
  sign_in_by_id?: number
  participation_status: string
  health_before?: string
  health_after?: string
  performance_rating?: number
  remark?: string
  created_at: string
  updated_at: string
}

export const activityApi = {
  getList: (params?: {
    page?: number
    page_size?: number
    activity_type?: string
    status?: string
    keyword?: string
  }) => {
    return api.get<any>('/activities', { params })
  },

  getDetail: (id: number) => {
    return api.get<Activity>(`/activities/${id}`)
  },

  create: (data: Partial<Activity>) => {
    return api.post<Activity>('/activities', data)
  },

  update: (id: number, data: Partial<Activity>) => {
    return api.put<Activity>(`/activities/${id}`, data)
  },

  remove: (id: number) => {
    return api.delete(`/activities/${id}`)
  },

  signIn: (activityId: number, data: { elder_id: number; health_before?: string }) => {
    return api.post<ActivitySignIn>(`/activities/${activityId}/sign-in`, data)
  },

  getSignIns: (activityId: number) => {
    return api.get<ActivitySignIn[]>(`/activities/${activityId}/sign-ins`)
  },

  updateSignIn: (id: number, data: Partial<ActivitySignIn>) => {
    return api.patch<ActivitySignIn>(`/activity-sign-ins/${id}`, data)
  },
}
