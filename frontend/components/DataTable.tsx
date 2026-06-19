import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface DataTableColumn<T> {
  key: keyof T | string;
  title: string;
  sortable?: boolean;
  width?: string;
  render?: (row: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyText?: string;
  className?: string;
  onRowClick?: (row: T, index: number) => void;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  rowKey?: keyof T | ((row: T) => string);
  onSelectAll?: (checked: boolean) => void;
  allSelected?: boolean;
  someSelected?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  emptyText = '暂无数据',
  className,
  onRowClick,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  rowKey = 'id',
  onSelectAll,
  allSelected = false,
  someSelected = false,
}: DataTableProps<T>) {
  const getRowId = (row: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(row);
    }
    return String(row[rowKey] ?? index);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSelectAll?.(e.target.checked);
  };

  const handleRowSelect = (row: T, index: number, checked: boolean) => {
    if (!onSelectionChange) return;
    const id = getRowId(row, index);
    if (checked) {
      onSelectionChange([...selectedIds, id]);
    } else {
      onSelectionChange(selectedIds.filter((sid) => sid !== id));
    }
  };

  const displayColumns = selectable
    ? [
        {
          key: '__select__',
          title: (
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = someSelected && !allSelected;
              }}
              onChange={handleSelectAll}
              className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
          ),
          width: '40px',
          render: (row: T, index: number) => (
            <input
              type="checkbox"
              checked={selectedIds.includes(getRowId(row, index))}
              onChange={(e) => handleRowSelect(row, index, e.target.checked)}
              onClick={(e) => e.stopPropagation()}
              className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
          ),
        },
        ...columns,
      ]
    : columns;

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {displayColumns.map((column, index) => (
              <th
                key={String(column.key)}
                className={cn(
                  'px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500',
                  column.width && `w-${column.width}`
                )}
                style={column.width ? { width: column.width } : undefined}
              >
                {typeof column.title === 'string' ? column.title : column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {loading ? (
            <tr>
              <td
                colSpan={displayColumns.length}
                className="px-6 py-8 text-center text-sm text-slate-500"
              >
                加载中...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={displayColumns.length}
                className="px-6 py-8 text-center text-sm text-slate-500"
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => {
              const isSelected = selectable && selectedIds.includes(getRowId(row, rowIndex));
              return (
                <tr
                  key={rowIndex}
                  onClick={() => onRowClick?.(row, rowIndex)}
                  className={cn(
                    'transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-slate-50',
                    isSelected && 'bg-primary-50'
                  )}
                >
                  {displayColumns.map((column, colIndex) => (
                    <td
                      key={colIndex}
                      className="whitespace-nowrap px-6 py-4 text-sm text-slate-900"
                    >
                      {column.render
                        ? column.render(row, rowIndex)
                        : typeof column.title === 'string'
                        ? String(row[column.key as keyof T] ?? '')
                        : null}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
