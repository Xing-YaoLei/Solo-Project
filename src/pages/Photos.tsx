import { useState, useRef, useMemo } from 'react'
import { Upload, Image, X } from 'lucide-react'
import { useVerificationPhotos, useUploadPhoto } from '@/api/hooks'
import FilterBar, { type FilterField } from '@/components/FilterBar'
import Empty from '@/components/Empty'

const TICKET_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'appeal', label: '申诉' },
  { value: 'compensation', label: '赔付' },
  { value: 'todo', label: '待办' },
]

const filterFields: FilterField[] = [
  { key: 'ticket_type', label: '工单类型', type: 'select', options: TICKET_TYPE_OPTIONS },
  { key: 'date', label: '日期', type: 'date_range' },
]

function formatDate(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export default function Photos() {
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const { data, isLoading } = useVerificationPhotos({ ...filters, page_size: 50 })
  const uploadMutation = useUploadPhoto()

  const photos = useMemo(() => data?.items ?? [], [data])

  const handleUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      uploadMutation.mutate({
        order_id: filters.ticket_type ?? 'default',
        photo_url: reader.result as string,
        photo_type: filters.ticket_type ?? 'appeal',
      })
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">核验照片留痕</h1>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`mb-6 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
          dragOver ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-surface-border bg-white dark:border-slate-700 dark:bg-slate-800'
        }`}
        onClick={() => fileRef.current?.click()}
      >
        <Upload size={32} className={`mb-2 ${dragOver ? 'text-primary-500' : 'text-slate-400'}`} />
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {dragOver ? '释放以上传' : '拖拽照片到此处或点击上传'}
        </p>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      <div className="mb-4">
        <FilterBar fields={filterFields} values={filters} onChange={setFilters} onApply={() => {}} onReset={() => setFilters({})} />
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center text-slate-400">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        </div>
      ) : photos.length === 0 ? (
        <Empty icon={Image} message="暂无照片" />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative cursor-pointer overflow-hidden rounded-lg border border-surface-border bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
              onClick={() => setLightboxUrl(photo.url)}
            >
              <div className="aspect-square overflow-hidden">
                <img src={photo.url} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                <p className="text-xs text-white line-clamp-2">{photo.remark}</p>
                <p className="mt-1 text-xs text-white/60">{formatDate(photo.uploaded_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {lightboxUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setLightboxUrl(null)}>
          <button className="absolute right-4 top-4 text-white/70 hover:text-white" onClick={() => setLightboxUrl(null)}>
            <X size={28} />
          </button>
          <img src={lightboxUrl} alt="" className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-2xl" />
        </div>
      )}
    </div>
  )
}
