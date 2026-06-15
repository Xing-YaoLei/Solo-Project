import { useMemo } from 'react'

export interface DataTableColumn<T = any> {
  key: string
  title: string
  render?: (row: T, index: number) => React.ReactNode
  width?: string | number
}

export interface DataTablePagination {
  currentPage: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

interface DataTableProps<T = any> {
  columns: DataTableColumn<T>[]
  data: T[]
  onRowClick?: (row: T, index: number) => void
  pagination?: DataTablePagination
  rowKey?: (row: T) => string | number
  emptyText?: string
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  onRowClick,
  pagination,
  rowKey,
  emptyText = '暂无数据',
}: DataTableProps<T>) {
  const totalPages = useMemo(() => {
    if (!pagination) return 0
    return Math.max(1, Math.ceil(pagination.total / pagination.pageSize))
  }, [pagination])

  const renderCell = (column: DataTableColumn<T>, row: T, index: number) => {
    if (column.render) {
      return column.render(row, index)
    }
    return row[column.key] ?? '-'
  }

  const getRowKey = (row: T, index: number): string | number => {
    if (rowKey) {
      return rowKey(row)
    }
    if ('id' in row) {
      return row.id as string | number
    }
    return index
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                  style={
                    column.width
                      ? { width: typeof column.width === 'number' ? `${column.width}px` : column.width }
                      : undefined
                  }
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-gray-400 text-sm"
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={getRowKey(row, index)}
                  className={
                    onRowClick
                      ? 'cursor-pointer hover:bg-blue-50 transition-colors'
                      : undefined
                  }
                  onClick={
                    onRowClick ? () => onRowClick(row, index) : undefined
                  }
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-4 py-3 text-sm text-gray-700"
                    >
                      {renderCell(column, row, index)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.total > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            共 <span className="font-medium">{pagination.total}</span> 条
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              上一页
            </button>
            <div className="px-3 py-1.5 text-sm text-gray-600">
              <span className="font-medium">{pagination.currentPage}</span>
              <span className="mx-1">/</span>
              <span>{totalPages}</span>
            </div>
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= totalPages}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
