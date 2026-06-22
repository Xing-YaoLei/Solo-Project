import apiClient from './client'
import { ExportRequest, ExportTask, SamplingCoverage } from '../types'
import { ExportType } from '../types/enums'

const getTypePath = (type: string): string => {
  switch (type) {
    case ExportType.SAMPLING:
      return 'sampling'
    case ExportType.RECTIFICATION:
      return 'rectification'
    case ExportType.EXCEPTION:
      return 'exception'
    default:
      return 'sampling'
  }
}

export const exportApi = {
  exportSync: async (request: ExportRequest): Promise<Blob> => {
    const typePath = getTypePath(request.entityType)
    const res = await apiClient.post(`/export/${typePath}/sync`, request, {
      responseType: 'blob',
    })
    return res.data
  },

  exportAsync: async (request: ExportRequest): Promise<ExportTask> => {
    const typePath = getTypePath(request.entityType)
    const res = await apiClient.post(`/export/${typePath}/async`, request)
    return res.data
  },

  getTaskStatus: async (taskId: string): Promise<ExportTask> => {
    const res = await apiClient.get(`/export/task/${taskId}`)
    return res.data
  },

  downloadExport: async (filename: string): Promise<Blob> => {
    const res = await apiClient.get(`/export/download/${filename}`, {
      responseType: 'blob',
    })
    return res.data
  },

  getSamplingCoverage: async (): Promise<SamplingCoverage> => {
    const res = await apiClient.get('/export/sampling-coverage')
    return res.data
  },

  getExportDescription: async (): Promise<string> => {
    const res = await apiClient.get('/export/sampling-coverage')
    return res.data.description
  },
}
