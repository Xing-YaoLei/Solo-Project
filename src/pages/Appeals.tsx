import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { FileText } from 'lucide-react'
import { useAppeals } from '@/api/hooks'
import DataTable from '@/components/DataTable'
import type { ColumnDef } from '@/components/DataTable'
import FilterBar from '@/components/FilterBar'
import type { FilterField } from '@/components/FilterBar'
import StatusBadge from '@/components/StatusBadge'
import type { AppealTicket } from '@/types'

const formatCurrency = (n: number) => `¥${Number(n).toFixed(2)}`
const formatDate = (iso: string) => {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const truncateId = (id: string) => id.slice(0, 8)

const FILTER_FIELDS: FilterField[] = [
  {
    key: 'status',
    label: '状态',
    type: 'select',
    options: [
      { value: 'pending', label: '待处理' },
      { value: 'reviewing', label: '审核中' },
      { value: 'supplement_needed', label: '需补充' },
      { value: 'approved', label: '已通过' },
      { value: 'rejected', label: '已驳回' },
      { value: 'transferred', label: '已转交' },
      { value: 'escalated', label: '已升级' },
    ],
  },
  { key: 'date_range', label: '日期', type: 'date_range' },
  { key: 'rider_id', label: '骑手ID', type: 'text', placeholder: '搜索骑手ID' },
  { key: 'keyword', label: '原因', type: 'text', placeholder: '搜索原因关键词' },
]

const COLUMNS: ColumnDef<AppealTicket>[] = [
  {
    key: 'id',
    header: '工单号',
    render: (row) => (
      <Link to="/appeals/$appealId" params={{ appealId: row.id }} className="text-primary-600 hover:underline">
        {truncateId(row.id)}
      </Link>
    ),
  },
  {
    key: 'rider_id',
    header: '骑手',
    render: (row) => <span>{truncateId(row.rider_id)}</span>,
  },
  {
    key: 'original_amount',
    header: '原始金额',
    render: (row) => <span>{formatCurrency(row.original_amount)}</span>,
  },
  {
    key: 'claimed_amount',
    header: '申诉金额',
    render: (row) => <span>{formatCurrency(row.claimed_amount)}</span>,
  },
  {
    key: 'reason',
    header: '原因',
    render: (row) => <span>{row.reason.length > 30 ? row.reason.slice(0, 30) + '…' : row.reason}</span>,
  },
  {
    key: 'status',
    header: '状态',
    render: (row) => <StatusBadge status={row.status} />,
  },
  {
    key: 'handler_id',
    header: '处理人',
    render: (row) => <span>{row.handler_id ? truncateId(row.handler_id) : '未分配'}</span>,
  },
  {
    key: 'created_at',
    header: '创建时间',
    render: (row) => <span>{formatDate(row.created_at)}</span>,
    sortable: true,
  },
  {
    key: 'action',
    header: '操作',
    render: (row) => (
      <Link to="/appeals/$appealId" params={{ appealId: row.id }} className="text-primary-600 hover:underline">
        查看
      </Link>
    ),
  },
]

export default function Appeals() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>({})

  const queryParams: Record<string, string | number> = { page, page_size: 20 }
  if (appliedFilters.status) queryParams.status = appliedFilters.status
  if (appliedFilters.date_range_start) queryParams.date_start = appliedFilters.date_range_start
  if (appliedFilters.date_range_end) queryParams.date_end = appliedFilters.date_range_end
  if (appliedFilters.rider_id) queryParams.rider_id = appliedFilters.rider_id
  if (appliedFilters.keyword) queryParams.keyword = appliedFilters.keyword

  const { data, isLoading } = useAppeals(queryParams)

  const handleApply = () => {
    setPage(1)
    setAppliedFilters({ ...filters })
  }

  const handleReset = () => {
    setPage(1)
    setFilters({})
    setAppliedFilters({})
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <FileText size={24} className="text-primary-600" />
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">申诉证据中心</h1>
      </div>

      <FilterBar
        fields={FILTER_FIELDS}
        values={filters}
        onChange={setFilters}
        onApply={handleApply}
        onReset={handleReset}
        pageKey="appeals"
      />

      <div className="mt-4">
        <DataTable<AppealTicket>
          columns={COLUMNS}
          data={data?.items ?? []}
          page={page}
          pageSize={20}
          total={data?.total ?? 0}
          onPageChange={setPage}
          loading={isLoading}
          getRowKey={(row) => row.id}
        />
      </div>
    </div>
  )
}
