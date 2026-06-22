import apiClient from './client'
import { ExportRequest, ExportTask, SamplingCoverage } from '../types'

export const exportApi = {
  exportSync: async (request: ExportRequest): Promise<Blob> => {
    const res = await apiClient.post('/export/sync', request, {
      responseType: 'blob',
    })
    return res.data
  },

  exportAsync: async (request: ExportRequest): Promise<ExportTask> => {
    const res = await apiClient.post('/export/async', request)
    return res.data
  },

  getTaskStatus: async (taskId: string): Promise<ExportTask> => {
    const res = await apiClient.get(`/export/tasks/${taskId}`)
    return res.data
  },

  downloadExport: async (taskId: string): Promise<Blob> => {
    const res = await apiClient.get(`/export/download/${taskId}`, {
      responseType: 'blob',
    })
    return res.data
  },

  getSamplingCoverage: async (): Promise<SamplingCoverage> => {
    const res = await apiClient.get('/export/sampling-coverage')
    return res.data
  },

  getExportDescription: async (): Promise<string> => {
    const res = await apiClient.get('/export/description')
    return res.data.description
  },
}
