import apiClient from './client'
import { Vendor, SupplierMaterial, ListResponse } from '../types'
import { MaterialStatus } from '../types/enums'

export const vendorApi = {
  list: async (params?: {
    skip?: number
    limit?: number
    keyword?: string
  }): Promise<ListResponse<Vendor>> => {
    const res = await apiClient.get('/vendors', { params })
    return res.data
  },

  get: async (id: number): Promise<Vendor> => {
    const res = await apiClient.get(`/vendors/${id}`)
    return res.data
  },

  create: async (data: Partial<Vendor>): Promise<Vendor> => {
    const res = await apiClient.post('/vendors', data)
    return res.data
  },

  update: async (id: number, data: Partial<Vendor>): Promise<Vendor> => {
    const res = await apiClient.put(`/vendors/${id}`, data)
    return res.data
  },

  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/vendors/${id}`)
  },

  listMaterials: async (
    vendorId: number,
    params?: { skip?: number; limit?: number; status?: MaterialStatus }
  ): Promise<ListResponse<SupplierMaterial>> => {
    const res = await apiClient.get(`/vendors/${vendorId}/materials`, { params })
    return res.data
  },

  uploadMaterial: async (
    vendorId: number,
    data: {
      materialType: string
      materialName: string
      file: File
    }
  ): Promise<SupplierMaterial> => {
    const formData = new FormData()
    formData.append('material_type', data.materialType)
    formData.append('material_name', data.materialName)
    formData.append('file', data.file)
    const res = await apiClient.post(`/vendors/${vendorId}/materials`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },

  reviewMaterial: async (
    vendorId: number,
    materialId: number,
    status: MaterialStatus
  ): Promise<SupplierMaterial> => {
    const res = await apiClient.patch(`/vendors/${vendorId}/materials/${materialId}/review`, {
      status,
    })
    return res.data
  },

  downloadMaterial: async (vendorId: number, materialId: number): Promise<Blob> => {
    const res = await apiClient.get(`/vendors/${vendorId}/materials/${materialId}/download`, {
      responseType: 'blob',
    })
    return res.data
  },
}
