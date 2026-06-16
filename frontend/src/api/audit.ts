import api from './client'

export interface AuditLog {
  id: number
  user_id?: number
  user_full_name?: string
  entity_type: string
  entity_id: number
  action: string
  old_value?: string
  new_value?: string
  field_name?: string
  created_at: string
  remark?: string
}

export const auditApi = {
  getList: (params?: {
    page?: number
    page_size?: number
    entity_type?: string
    entity_id?: number
    action?: string
    user_id?: number
  }) => {
    return api.get<any>('/audit-logs', { params })
  },

  getEntityHistory: (entityType: string, entityId: number) => {
    return api.get<AuditLog[]>(`/audit-logs/${entityType}/${entityId}`)
  },
}
