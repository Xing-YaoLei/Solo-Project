import { useState } from 'react'
import { ChevronLeft, ChevronRight, ArrowUpDown, Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ColumnDef<T> {
  key: string
  header: string
  render?: (row: T) => React.ReactNode
  sortable?: boolean
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onSort?: (key: string, dir: 'asc' | 'desc') => void
  loading?: boolean
  emptyText?: string
 getRowKey: (row: T) => string
}

function Skeleton() {
  return (
    <tr>
      {Array.from({ length: 5 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        </td>
      ))}
    </tr>
  )
}

export default function DataTable<T>({
  columns, data, page, pageSize, total, onPageChange, onSort, loading, emptyText = '暂无数据', getRowKey,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const totalPages = Math.ceil(total / pageSize)

  const handleSort = (key: string) => {
    const newDir = sortKey === key && sortDir === 'asc' ? 'desc' : 'asc'
    setSortKey(key)
    setSortDir(newDir)
    onSort?.(key, newDir)
  }

  return (
    <div className="overflow-hidden rounded-lg border border-surface-border bg-white dark:border-slate-700 dark:bg-slate-800">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">
                  {col.sortable ? (
                    <button onClick={() => handleSort(col.key)} className="flex items-center gap-1 hover:text-primary-600">
                      {col.header}
                      <ArrowUpDown size={14} className={cn(sortKey === col.key && 'text-primary-600')} />
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} />)
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Inbox size={32} />
                    <span>{emptyText}</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={getRowKey(row)} className="border-b border-surface-border transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/50">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-surface-border px-4 py-3 dark:border-slate-700">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            共 {total} 条，第 {page}/{totalPages} 页
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="rounded p-1 text-slate-400 hover:text-primary-600 disabled:opacity-40"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="rounded p-1 text-slate-400 hover:text-primary-600 disabled:opacity-40"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
