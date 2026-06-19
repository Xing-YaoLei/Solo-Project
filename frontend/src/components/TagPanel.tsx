import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { api } from '@/api/client'
import type { TagName } from '@/types'

const TAG_COLORS: Record<string, string> = {
  '卫生': 'bg-emerald-100 text-emerald-700',
  '服务': 'bg-blue-100 text-blue-700',
  '设施': 'bg-purple-100 text-purple-700',
  '安全': 'bg-red-100 text-red-700',
  '噪音': 'bg-yellow-100 text-yellow-700',
  '价格': 'bg-orange-100 text-orange-700',
  '其他': 'bg-slate-100 text-slate-700',
}

const TAG_OPTIONS: TagName[] = ['卫生', '服务', '设施', '安全', '噪音', '价格', '其他']

interface TagPanelProps {
  complaintId: string
  tags: string[]
  onRefresh: () => void
}

export default function TagPanel({ complaintId, tags, onRefresh }: TagPanelProps) {
  const [showAdd, setShowAdd] = useState(false)
  const [adding, setAdding] = useState(false)

  const availableTags = TAG_OPTIONS.filter(t => !tags.includes(t))

  const handleAdd = async (tag: TagName) => {
    setAdding(true)
    try {
      await api.complaints.addTag(complaintId, tag)
      onRefresh()
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (tagName: string) => {
    try {
      await api.complaints.removeTag(complaintId, tagName)
      onRefresh()
    } catch {}
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-800">问题标签</h3>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-md"
        >
          <Plus className="w-3.5 h-3.5" />
          添加
        </button>
      </div>

      {showAdd && availableTags.length > 0 && (
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
          <div className="flex flex-wrap gap-2">
            {availableTags.map(tag => (
              <button
                key={tag}
                onClick={() => handleAdd(tag)}
                disabled={adding}
                className={`px-3 py-1 rounded-full text-xs font-medium border border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50 ${TAG_COLORS[tag] || 'bg-slate-100 text-slate-700'}`}
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 py-3">
        {tags.length === 0 ? (
          <p className="text-sm text-slate-400 text-center">暂无标签</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, i) => (
              <span
                key={`${tag}-${i}`}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${TAG_COLORS[tag] || 'bg-slate-100 text-slate-700'}`}
              >
                {tag}
                <button
                  onClick={() => handleRemove(tag)}
                  className="ml-0.5 hover:text-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
