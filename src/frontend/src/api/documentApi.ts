import { api } from './axios'
import { Document, CreateDocumentDto, UpdateDocumentDto, BatchUpdateDocumentsDto, DocumentHistory, DocumentFilterParams } from '@/types/document'
import { PaginatedResponse } from '@/types/statistics'

export const documentApi = {
  getDocuments: (params?: DocumentFilterParams & { pageIndex?: number; pageSize?: number }) => 
    api.get<PaginatedResponse<Document>>('/documents', { params }),
  
  getDocument: (id: string) => 
    api.get<Document>(`/documents/${id}`),
  
  createDocument: (data: CreateDocumentDto) => 
    api.post<Document>('/documents', data),
  
  updateDocument: (id: string, data: UpdateDocumentDto) => 
    api.put<Document>(`/documents/${id}`, data),
  
  deleteDocument: (id: string) => 
    api.delete<void>(`/documents/${id}`),
  
  batchUpdate: (data: BatchUpdateDocumentsDto) => 
    api.post<void>('/documents/batch', data),
  
  submitForApproval: (id: string) => 
    api.post<Document>(`/documents/${id}/submit`),
  
  approve: (id: string, data?: { comments?: string }) => 
    api.post<Document>(`/documents/${id}/approve`, data),
  
  reject: (id: string, data?: { comments?: string }) => 
    api.post<Document>(`/documents/${id}/reject`, data),
  
  getDocumentHistory: (id: string) => 
    api.get<DocumentHistory[]>(`/documents/${id}/history`),
  
  verifyAmountConsistency: (id: string) => 
    api.post<Document>(`/documents/${id}/verify-amount`),
  
  uploadAttachment: (documentId: string, file: File, description?: string) => {
    const formData = new FormData()
    formData.append('file', file)
    if (description) formData.append('description', description)
    return api.post<any>(`/attachments/upload/${documentId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  
  getAttachments: (documentId: string) => 
    api.get<any[]>(`/attachments/document/${documentId}`),
  
  deleteAttachment: (id: string) => 
    api.delete<void>(`/attachments/${id}`),
}
