import { useState, useMemo } from 'react'
import { BarChart3 } from 'lucide-react'
import { BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Bar } from 'recharts'
import { useSubsidySummaryReport } from '@/api/hooks'
import FilterBar, { type FilterField } from '@/components/FilterBar'
import DataTable, { type ColumnDef } from '@/components/DataTable'
import Empty from '@/components/Empty'

interface SubsidySummaryRow {
  group_key: string
  subsidy_total: number
  order_count: number
  avg_subsidy: number
}

const filterFields: FilterField[] = [
  { key: 'start_date', label: '开始日期', type: 'date_range' },
  { key: 'city_code', label: '城市', type: 'text', placeholder: '城市编码' },
  { key: 'group_by', label: '分组', type: 'select', options: [
    { value: 'date', label: '日期' }, { value: 'city', label: '城市' },
    { value: 'handler', label: '处理人' }, { value: 'route_type', label: '路线类型' },
  ]},
]

const formatCurrency = (n: number) => `¥${Number(n).toFixed(2)}`

export default function ReportSubsidy() {
  const [filters, setFilters] = useState<Record<string, string>>({ group_by: 'date' })
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>({ group_by: 'date' })
  const [page, setPage] = useState(1)

  const { data, isLoading } = useSubsidySummaryReport(appliedFilters)
  const rows = useMemo(() => {
    if (!data) return []
    return Array.isArray(data) ? data as SubsidySummaryRow[] : (data as Record<string, unknown>).items as SubsidySummaryRow[] ?? []
  }, [data])

  const columns: ColumnDef<SubsidySummaryRow>[] = [
    { key: 'group_key', header: '分组' },
    { key: 'subsidy_total', header: '补贴总额', render: (r) => <span className="font-medium">{formatCurrency(r.subsidy_total)}</span> },
    { key: 'order_count', header: '订单数' },
    { key: 'avg_subsidy', header: '平均补贴', render: (r) => formatCurrency(r.avg_subsidy) },
  ]

  const handleApply = () => {
    setAppliedFilters(filters)
    setPage(1)
  }

  const handleReset = () => {
    const reset = { group_by: 'date' }
    setFilters(reset)
    setAppliedFilters(reset)
    setPage(1)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">补贴汇总报表</h1>
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
        <div className="flex gap-6">
          <div className="flex-[2] min-w-0">
            <div className="rounded-lg border border-surface-border bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
              <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">补贴趋势</h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={rows}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="group_key" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="subsidy_total" name="补贴总额" fill="#0F766E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <DataTable
              columns={columns}
              data={rows}
              page={page}
              pageSize={20}
              total={rows.length}
              onPageChange={setPage}
              getRowKey={(r: SubsidySummaryRow) => r.group_key}
            />
          </div>
        </div>
      )}
    </div>
  )
}
