import { Eye, Share2, Trash2 } from 'lucide-react'
import type { SavedView } from '@/types'
import { cn } from '@/lib/utils'

interface ViewCardProps {
  view: SavedView
  isActive: boolean
  onLoad: (id: string) => void
  onDelete: (id: string) => void
  onToggleShare: (id: string) => void
}

export default function ViewCard({ view, isActive, onLoad, onDelete, onToggleShare }: ViewCardProps) {
  return (
    <div
      className={cn(
        'group rounded-lg border bg-white p-4 transition-all hover:shadow-md',
        isActive ? 'border-teal-500 shadow-sm ring-1 ring-teal-500/30' : 'border-gray-200',
      )}
    >
      <div className="mb-2 flex items-start justify-between">
        <h4 className="text-sm font-semibold text-gray-900">{view.name}</h4>
        {view.isShared && (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
            <Share2 className="h-3 w-3" />
            共享
          </span>
        )}
      </div>

      <div className="mb-3 space-y-1 text-xs text-gray-500">
        <p>创建者: {view.owner}</p>
        <p>创建时间: {view.createdAt}</p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onLoad(view.id)}
          className="flex flex-1 items-center justify-center gap-1 rounded-md bg-teal-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-teal-700"
        >
          <Eye className="h-3.5 w-3.5" />
          加载
        </button>
        <button
          onClick={() => onToggleShare(view.id)}
          className={cn(
            'rounded-md p-1.5 transition-colors',
            view.isShared ? 'text-indigo-600 hover:bg-indigo-50' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600',
          )}
          title={view.isShared ? '取消共享' : '设为共享'}
        >
          <Share2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onDelete(view.id)}
          className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
          title="删除视图"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
