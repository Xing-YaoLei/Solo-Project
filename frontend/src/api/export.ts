import api from './client'

export interface ExportCaliber {
  title: string
  caliber: string
  columns: string[]
}

export const exportApi = {
  getCaliber: (exportType: string) => {
    return api.get<ExportCaliber>(`/exports/${exportType}`)
  },

  exportExcel: (exportType: string, params?: any) => {
    return api.post(`/exports/${exportType}`, params, {
      responseType: 'blob',
    })
  },
}
