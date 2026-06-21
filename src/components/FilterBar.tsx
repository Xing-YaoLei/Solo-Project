import { useState } from 'react'
import { Search, SlidersHorizontal, RotateCcw, Bookmark, BookmarkPlus, Trash2, X, Check } from 'lucide-react'
import { useUIStore } from '@/stores/ui'

export interface FilterField {
  key: string
  label: string
  type: 'text' | 'select' | 'date_range'
  options?: { value: string; label: string }[]
  placeholder?: string
}

interface FilterBarProps {
  fields: FilterField[]
  advancedFields?: FilterField[]
  values: Record<string, string>
  onChange: (values: Record<string, string>) => void
  onApply: () => void
  onReset: () => void
  pageKey?: string
}

export default function FilterBar({ fields, advancedFields, values, onChange, onApply, onReset, pageKey }: FilterBarProps) {
  const [expanded, setExpanded] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [filterName, setFilterName] = useState('')
  const [showSavedFilters, setShowSavedFilters] = useState(false)
  const { savedFilters, saveFilter, deleteFilter, loadFilters } = useUIStore()

  const pageSavedFilters = pageKey ? loadFilters(pageKey) : []
  const hasFilters = Object.values(values).some((v) => v && v.trim() !== '')

  const handleChange = (key: string, value: string) => {
    onChange({ ...values, [key]: value })
  }

  const renderField = (field: FilterField) => {
    if (field.type === 'select') {
      return (
        <select
          value={values[field.key] ?? ''}
          onChange={(e) => handleChange(field.key, e.target.value)}
          className="h-9 rounded-md border border-surface-border bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
        >
          <option value="">{field.placeholder ?? `全部${field.label}`}</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )
    }

    if (field.type === 'date_range') {
      return (
        <div className="flex items-center gap-1">
          <input
            type="date"
            value={values[`${field.key}_start`] ?? ''}
            onChange={(e) => handleChange(`${field.key}_start`, e.target.value)}
            className="h-9 rounded-md border border-surface-border bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
          />
          <span className="text-slate-400">~</span>
          <input
            type="date"
            value={values[`${field.key}_end`] ?? ''}
            onChange={(e) => handleChange(`${field.key}_end`, e.target.value)}
            className="h-9 rounded-md border border-surface-border bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
          />
        </div>
      )
    }

    return (
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={values[field.key] ?? ''}
          onChange={(e) => handleChange(field.key, e.target.value)}
          placeholder={field.placeholder ?? `搜索${field.label}`}
          className="h-9 w-full rounded-md border border-surface-border bg-white pl-8 pr-3 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
        />
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-surface-border bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        {fields.map((field) => (
          <div key={field.key}>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">{field.label}</label>
            {renderField(field)}
          </div>
        ))}
      </div>

      {advancedFields && advancedFields.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
          >
            <SlidersHorizontal size={14} />
            {expanded ? '收起筛选' : '更多筛选'}
          </button>
          {expanded && (
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
              {advancedFields.map((field) => (
                <div key={field.key}>
                  <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">{field.label}</label>
                  {renderField(field)}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <button
          onClick={onApply}
          className="rounded-md bg-primary-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
        >
          查询
        </button>
        <button
          onClick={onReset}
          className="flex items-center gap-1 rounded-md border border-surface-border px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <RotateCcw size={14} />
          重置
        </button>
        {pageKey && hasFilters && (
          <button
            onClick={() => { setFilterName(''); setSaveDialogOpen(true) }}
            className="flex items-center gap-1 rounded-md border border-surface-border px-4 py-1.5 text-sm text-primary-600 hover:bg-primary-50 dark:border-slate-600 dark:text-primary-400 dark:hover:bg-slate-700"
          >
            <BookmarkPlus size={14} />
            保存筛选
          </button>
        )}
        {pageKey && pageSavedFilters.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowSavedFilters(!showSavedFilters)}
              className="flex items-center gap-1 rounded-md border border-surface-border px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <Bookmark size={14} />
              常用筛选
              <span className="ml-1 rounded-full bg-primary-100 px-1.5 text-xs text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                {pageSavedFilters.length}
              </span>
            </button>
            {showSavedFilters && (
              <div className="absolute left-0 top-full mt-1 z-10 w-64 rounded-md border border-surface-border bg-white py-1 shadow-lg dark:border-slate-600 dark:bg-slate-800">
                {pageSavedFilters.map((filter) => (
                  <div key={filter.id} className="group flex items-center justify-between px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700">
                    <button
                      onClick={() => { onChange(filter.filters); onApply(); setShowSavedFilters(false) }}
                      className="flex-1 text-left text-sm text-slate-700 dark:text-slate-300"
                    >
                      {filter.name}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteFilter(filter.id) }}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {saveDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setSaveDialogOpen(false)}>
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-slate-800" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">保存筛选条件</h3>
              <button onClick={() => setSaveDialogOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <input
              type="text"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              placeholder="请输入筛选名称"
              className="w-full rounded-md border border-surface-border px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setSaveDialogOpen(false)}
                className="rounded-md border border-surface-border px-4 py-2 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (filterName.trim() && pageKey) {
                    saveFilter(pageKey, filterName.trim(), values)
                    setSaveDialogOpen(false)
                  }
                }}
                disabled={!filterName.trim()}
                className="flex items-center gap-1 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                <Check size={16} />
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
