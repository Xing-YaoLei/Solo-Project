import { api } from './axios'
import { Material, CreateMaterialDto, UpdateMaterialDto } from '@/types/material'
import { PaginatedResponse } from '@/types/statistics'

export const materialApi = {
  getMaterials: (params?: { pageIndex?: number; pageSize?: number; search?: string; category?: string; isActive?: boolean }) => 
    api.get<PaginatedResponse<Material>>('/materials', { params }),
  
  getMaterial: (id: string) => 
    api.get<Material>(`/materials/${id}`),
  
  createMaterial: (data: CreateMaterialDto) => 
    api.post<Material>('/materials', data),
  
  updateMaterial: (id: string, data: UpdateMaterialDto) => 
    api.put<Material>(`/materials/${id}`, data),
  
  deleteMaterial: (id: string) => 
    api.delete<void>(`/materials/${id}`),
}
