import { api } from './axios'
import { Project, CreateProjectDto, UpdateProjectDto } from '@/types/project'
import { Document } from '@/types/document'
import { Payment } from '@/types/payment'
import { PaginatedResponse } from '@/types/statistics'

export const projectApi = {
  getProjects: (params?: { pageIndex?: number; pageSize?: number; search?: string; status?: string }) => 
    api.get<PaginatedResponse<Project>>('/projects', { params }),
  
  getProject: (id: string) => 
    api.get<Project>(`/projects/${id}`),
  
  createProject: (data: CreateProjectDto) => 
    api.post<Project>('/projects', data),
  
  updateProject: (id: string, data: UpdateProjectDto) => 
    api.put<Project>(`/projects/${id}`, data),
  
  deleteProject: (id: string) => 
    api.delete<void>(`/projects/${id}`),
  
  getProjectDocuments: (projectId: string, params?: { pageIndex?: number; pageSize?: number; type?: string; status?: string; amountConsistency?: string }) => 
    api.get<PaginatedResponse<Document>>(`/projects/${projectId}/documents`, { params }),
  
  getProjectPayments: (projectId: string, params?: { pageIndex?: number; pageSize?: number; status?: string }) => 
    api.get<PaginatedResponse<Payment>>(`/projects/${projectId}/payments`, { params }),
}
