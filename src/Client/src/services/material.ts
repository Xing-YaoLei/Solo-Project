import request from '@/utils/request'
import type {
  AttachmentMaterial,
  AttachmentMaterialQuery,
  AttachmentMaterialCreate,
  AttachmentMaterialUpdate,
  PagedResult
} from '@/types'

export function getMaterialList(params: AttachmentMaterialQuery): Promise<PagedResult<AttachmentMaterial>> {
  return request.get('/AttachmentMaterial', { params })
}

export function getMaterialDetail(id: number): Promise<AttachmentMaterial> {
  return request.get(`/AttachmentMaterial/${id}`)
}

export function createMaterial(data: AttachmentMaterialCreate): Promise<AttachmentMaterial> {
  return request.post('/AttachmentMaterial', data)
}

export function updateMaterial(data: AttachmentMaterialUpdate): Promise<AttachmentMaterial> {
  return request.put('/AttachmentMaterial', data)
}

export function deleteMaterial(id: number): Promise<void> {
  return request.delete(`/AttachmentMaterial/${id}`)
}

export function getActiveMaterials(): Promise<AttachmentMaterial[]> {
  return request.get('/AttachmentMaterial/active')
}
