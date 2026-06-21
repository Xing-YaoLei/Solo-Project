import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type { VerificationPhoto, PaginatedResponse } from '@/types'

export function useVerificationPhotos(params?: Record<string, string | number>) {
  const query = new URLSearchParams()
  if (params) Object.entries(params).forEach(([k, v]) => query.set(k, String(v)))
  const qs = query.toString()
  return useQuery<PaginatedResponse<VerificationPhoto>>({
    queryKey: ['verification-photos', params],
    queryFn: () => api.get(`/photos${qs ? `?${qs}` : ''}`),
  })
}

export function useUploadPhoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { order_id: string; photo_url: string; photo_type: string; uploaded_by?: string }) => {
      const fd = new FormData()
      fd.append('order_id', data.order_id)
      fd.append('photo_url', data.photo_url)
      fd.append('photo_type', data.photo_type)
      if (data.uploaded_by) fd.append('uploaded_by', data.uploaded_by)
      return api.upload<VerificationPhoto>('/photos/upload', fd)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['verification-photos'] }),
  })
}
