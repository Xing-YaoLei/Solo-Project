import api from './client'

export interface Medication {
  id: number
  elder_id: number
  drug_name: string
  generic_name?: string
  dosage: string
  frequency: string
  route: string
  start_date?: string
  end_date?: string
  prescribing_doctor?: string
  pharmacy?: string
  purpose?: string
  side_effects?: string
  notes?: string
  status: string
  created_at: string
  updated_at: string
}

export const medicationApi = {
  getList: (elderId: number) => {
    return api.get<Medication[]>(`/elders/${elderId}/medications`)
  },

  create: (elderId: number, data: Partial<Medication>) => {
    return api.post<Medication>(`/elders/${elderId}/medications`, data)
  },

  update: (id: number, data: Partial<Medication>) => {
    return api.put<Medication>(`/medications/${id}`, data)
  },

  updateStatus: (id: number, status: string) => {
    return api.patch<Medication>(`/medications/${id}/status`, { status })
  },

  remove: (id: number) => {
    return api.delete(`/medications/${id}`)
  },
}
