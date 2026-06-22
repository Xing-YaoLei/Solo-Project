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

const buildQueryParams = (request: ExportRequest): URLSearchParams => {
  const params = new URLSearchParams()

  params.append('export_format', request.format)

  if (request.filters) {
    const filters = request.filters

    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null || value === '') {
        continue
      }

      let paramKey = key

      if (key === 'checklistId') paramKey = 'checklist_id'
      else if (key === 'evidenceStatus') paramKey = 'evidence_status'
      else if (key === 'startDate') paramKey = 'start_date'
      else if (key === 'endDate') paramKey = 'end_date'
      else if (key === 'riskLevel') paramKey = 'risk_level'
      else if (key === 'vendorId') paramKey = 'vendor_id'
      else if (key === 'samplingId') paramKey = 'sampling_id'
      else if (key === 'exceptionType') paramKey = 'exception_type'

      params.append(paramKey, String(value))
    }
  }

  return params
}

export const exportApi = {
  exportSync: async (request: ExportRequest): Promise<Blob> => {
    const typePath = getTypePath(request.entityType)
    const queryParams = buildQueryParams(request)
    const url = `/export/${typePath}/sync?${queryParams.toString()}`
    const res = await apiClient.post(url, request, {
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
