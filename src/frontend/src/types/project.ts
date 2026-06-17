import { DocumentStatus } from './enums'

export interface Project {
  id: string
  projectNumber: string
  name: string
  address: string
  description?: string
  totalBudget: number
  actualAmount?: number
  startDate: string
  expectedEndDate?: string
  actualEndDate?: string
  status: DocumentStatus
  createdAt: string
  ownerName: string
  ownerId: string
  designerName?: string
  designerId?: string
  foremanName?: string
  foremanId?: string
  supervisorName?: string
  supervisorId?: string
  documentCount: number
  pendingApprovals: number
  paidAmount: number
  remainingAmount: number
}

export interface CreateProjectDto {
  name: string
  address: string
  description?: string
  totalBudget: number
  startDate: string
  expectedEndDate?: string
  ownerId: string
  designerId?: string
  foremanId?: string
  supervisorId?: string
}

export interface UpdateProjectDto {
  name: string
  address: string
  description?: string
  totalBudget: number
  startDate: string
  expectedEndDate?: string
  designerId?: string
  foremanId?: string
  supervisorId?: string
  status: DocumentStatus
}
