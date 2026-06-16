import request from './request'
import type {
  Prescription,
  PrescriptionDetail,
  PrescriptionCreate,
  PrescriptionUpdate,
  PrescriptionQuery,
  PrescriptionReview,
  PrescriptionBatchReview,
  PrescriptionStatusChange,
  SupplementNoteCreate,
  PagedResult,
  Attachment,
  AttachmentType,
} from '@/types'

export const getPrescriptions = (params: PrescriptionQuery): Promise<PagedResult<Prescription>> => {
  return request.get('/prescriptions', { params })
}

export const getPrescriptionById = (id: number): Promise<PrescriptionDetail> => {
  return request.get(`/prescriptions/${id}`)
}

export const createPrescription = (data: PrescriptionCreate): Promise<Prescription> => {
  return request.post('/prescriptions', data)
}

export const updatePrescription = (id: number, data: PrescriptionUpdate): Promise<void> => {
  return request.put(`/prescriptions/${id}`, data)
}

export const submitPrescription = (id: number): Promise<void> => {
  return request.post(`/prescriptions/${id}/submit`)
}

export const reviewPrescription = (id: number, data: PrescriptionReview): Promise<void> => {
  return request.post(`/prescriptions/${id}/review`, data)
}

export const batchReviewPrescriptions = (data: PrescriptionBatchReview): Promise<void> => {
  return request.post('/prescriptions/batch-review', data)
}

export const changePrescriptionStatus = (id: number, data: PrescriptionStatusChange): Promise<void> => {
  return request.post(`/prescriptions/${id}/status`, data)
}

export const addSupplementNote = (id: number, data: SupplementNoteCreate): Promise<void> => {
  return request.post(`/prescriptions/${id}/supplement-notes`, data)
}

export const getAttachments = (prescriptionId: number): Promise<Attachment[]> => {
  return request.get(`/attachments/prescription/${prescriptionId}`)
}

export const uploadAttachment = (
  prescriptionId: number,
  type: AttachmentType,
  file: File
): Promise<Attachment> => {
  const formData = new FormData()
  formData.append('file', file)
  return request.post(`/attachments/prescription/${prescriptionId}?type=${type}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export const deleteAttachment = (id: number): Promise<void> => {
  return request.delete(`/attachments/${id}`)
}
