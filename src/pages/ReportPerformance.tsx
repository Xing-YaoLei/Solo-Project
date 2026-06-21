import { useState, useMemo } from 'react'
import { BarChart3 } from 'lucide-react'
import { BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Bar, Line, ComposedChart } from 'recharts'
import { usePerformanceReport } from '@/api/hooks'
import FilterBar, { type FilterField } from '@/components/FilterBar'
import DataTable, { type ColumnDef } from '@/components/DataTable'
import Empty from '@/components/Empty'
import type { PerformanceReport as PerformanceReportType } from '@/types'

const filterFields: FilterField[] = [
  { key: 'start_date', label: '开始日期', type: 'date_range' },
  { key: 'city_code', label: '城市', type: 'text', placeholder: '城市编码' },
]

export default function ReportPerformance() {
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>({})
  const [page, setPage] = useState(1)

  const { data, isLoading } = usePerformanceReport(appliedFilters)
  const rows = useMemo(() => {
    if (!data) return []
    return Array.isArray(data) ? data as PerformanceReportType[] : (data as Record<string, unknown>).items as PerformanceReportType[] ?? []
  }, [data])

  const columns: ColumnDef<PerformanceReportType>[] = [
    { key: 'handler_name', header: '处理人' },
    { key: 'total_handled', header: '处理数', sortable: true },
    { key: 'avg_handling_minutes', header: '平均时长(分)', render: (r) => r.avg_handling_minutes.toFixed(1) },
    { key: 'rejection_rate', header: '驳回率', render: (r) => `${(r.rejection_rate * 100).toFixed(1)}%` },
    { key: 'transfer_rate', header: '转交率', render: (r) => `${(r.transfer_rate * 100).toFixed(1)}%` },
  ]

  const handleApply = () => {
    setAppliedFilters(filters)
    setPage(1)
  }

  const handleReset = () => {
    setFilters({})
    setAppliedFilters({})
    setPage(1)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">绩效报表</h1>
      </div>

      <div className="mb-6">
        <FilterBar fields={filterFields} values={filters} onChange={setFilters} onApply={handleApply} onReset={handleReset} />
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center text-slate-400">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        </div>
      ) : rows.length === 0 ? (
        <Empty icon={BarChart3} message="暂无数据" />
      ) : (
        <>
          <div className="mb-6 rounded-lg border border-surface-border bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">处理量与驳回率</h3>
            <ResponsiveContainer width="100%" height={360}>
              <ComposedChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="handler_name" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`} />
                <Tooltip formatter={(value: number, name: string) => name === '驳回率' ? `${(value * 100).toFixed(1)}%` : value} />
                <Legend />
                <Bar yAxisId="left" dataKey="total_handled" name="处理数" fill="#0F766E" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="rejection_rate" name="驳回率" stroke="#D97706" strokeWidth={2} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <DataTable
            columns={columns}
            data={rows}
            page={page}
            pageSize={20}
            total={rows.length}
            onPageChange={setPage}
            getRowKey={(r: PerformanceReportType) => r.handler_id}
          />
        </>
      )}
    </div>
  )
}
