import { get, post, put, del } from '@/utils/request'
import type { StaffDto } from '@/types'

export const staffApi = {
  getList: (): Promise<StaffDto[]> => {
    return get<StaffDto[]>('/staff')
  },

  getActive: (): Promise<StaffDto[]> => {
    return get<StaffDto[]>('/staff/active')
  },

  getDetail: (id: string): Promise<StaffDto> => {
    return get<StaffDto>(`/staff/${id}`)
  },

  create: (data: Partial<StaffDto>): Promise<StaffDto> => {
    return post<StaffDto>('/staff', data)
  },

  update: (id: string, data: Partial<StaffDto>): Promise<StaffDto> => {
    return put<StaffDto>(`/staff/${id}`, data)
  },

  delete: (id: string): Promise<void> => {
    return del<void>(`/staff/${id}`)
  },

  getByRole: (role: number): Promise<StaffDto[]> => {
    return get<StaffDto[]>(`/staff/role/${role}`)
  },
}

export default staffApi
