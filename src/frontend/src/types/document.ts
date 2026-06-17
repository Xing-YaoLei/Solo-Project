import { DocumentType, DocumentStatus, AmountConsistencyStatus } from './enums'

export interface Attachment {
  id: string
  documentId: string
  fileName: string
  originalFileName: string
  filePath: string
  contentType: string
  fileSize: number
  description?: string
  uploadedById: string
  uploadedByName?: string
  createdAt: string
}

export interface DocumentItem {
  id: string
  itemOrder: number
  itemCode: string
  name: string
  specification?: string
  unit: string
  quantity: number
  unitPrice: number
  subtotal: number
  notes?: string
  materialId?: string
  materialName?: string
}

export interface Document {
  id: string
  documentNumber: string
  type: DocumentType
  title: string
  description?: string
  expectedAmount: number
  actualAmount?: number
  amountDifference: number
  amountConsistency: AmountConsistencyStatus
  status: DocumentStatus
  measurementDate: string
  approvalDate?: string
  createdAt: string
  projectName: string
  projectId: string
  createdByName: string
  createdById: string
  itemCount: number
  attachmentCount: number
  pendingApprovalCount: number
  items?: DocumentItem[]
  history?: DocumentHistory[]
}

export interface CreateDocumentItemDto {
  itemOrder: number
  itemCode: string
  name: string
  specification?: string
  unit: string
  quantity: number
  unitPrice: number
  notes?: string
  materialId?: string
}

export interface UpdateDocumentItemDto {
  id?: string
  itemOrder: number
  itemCode: string
  name: string
  specification?: string
  unit: string
  quantity: number
  unitPrice: number
  notes?: string
  materialId?: string
}

export interface CreateDocumentDto {
  type: DocumentType
  title: string
  description?: string
  expectedAmount: number
  measurementDate: string
  projectId: string
  items: CreateDocumentItemDto[]
}

export interface UpdateDocumentDto {
  title: string
  description?: string
  expectedAmount: number
  actualAmount?: number
  measurementDate: string
  status: DocumentStatus
  items: UpdateDocumentItemDto[]
}

export interface BatchUpdateDocumentsDto {
  documentIds: string[]
  status?: DocumentStatus
  assignedToId?: string
}

export interface DocumentHistory {
  id: string
  action: string
  oldValues?: string
  newValues?: string
  materialsBefore?: string
  materialsAfter?: string
  conclusion?: string
  source?: string
  oldStatus?: DocumentStatus
  newStatus?: DocumentStatus
  createdAt: string
  createdByName: string
}

export interface DocumentFilterParams {
  type?: DocumentType
  status?: DocumentStatus
  amountConsistency?: AmountConsistencyStatus
  projectId?: string
  startDate?: string
  endDate?: string
  search?: string
}
