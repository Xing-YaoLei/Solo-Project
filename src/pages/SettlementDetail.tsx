import { useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useSettlementBatch, useSettlementDetails } from '@/api/hooks'
import DataTable from '@/components/DataTable'
import type { ColumnDef } from '@/components/DataTable'
import StatusBadge from '@/components/StatusBadge'
import type { SettlementDetail } from '@/types'

const formatCurrency = (n: number) => `¥${Number(n).toFixed(2)}`
const formatDate = (iso: string) => {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const truncateId = (id: string) => id.slice(0, 8)

const COLUMNS: ColumnDef<SettlementDetail>[] = [
  {
    key: 'rider_id',
    header: '骑手ID',
    render: (row) => <span>{truncateId(row.rider_id)}</span>,
  },
  {
    key: 'order_id',
    header: '订单ID',
    render: (row) => <span>{truncateId(row.order_id)}</span>,
  },
  {
    key: 'calculated_amount',
    header: '计算金额',
    render: (row) => <span>{formatCurrency(row.calculated_amount)}</span>,
  },
  {
    key: 'adjusted_amount',
    header: '调整金额',
    render: (row) => <span>{row.adjusted_amount != null ? formatCurrency(row.adjusted_amount) : '-'}</span>,
  },
  {
    key: 'final_amount',
    header: '最终金额',
    render: (row) => <span className="font-medium">{formatCurrency(row.final_amount)}</span>,
  },
  {
    key: 'status',
    header: '状态',
    render: (row) => <StatusBadge status={row.status} />,
  },
  {
    key: 'created_at',
    header: '创建时间',
    render: (row) => <span>{formatDate(row.created_at)}</span>,
    sortable: true,
  },
]

export default function SettlementDetail() {
  const { batchId } = useParams({ strict: false }) as { batchId: string }
  const [page, setPage] = useState(1)

  const { data: batch, isLoading: batchLoading } = useSettlementBatch(batchId)
  const { data: detailsData, isLoading: detailsLoading } = useSettlementDetails({
    batch_id: batchId,
    page,
    page_size: 20,
  })

  if (batchLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        加载中...
      </div>
    )
  }

  if (!batch) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        未找到结算批次
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/settlements" className="flex items-center text-sm text-primary-600 hover:underline">
          <ArrowLeft size={16} className="mr-1" /> 返回列表
        </Link>
        <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          结算批次 {truncateId(batch.id)}
        </h1>
        <StatusBadge status={batch.status} />
      </div>

      <div className="rounded-lg border border-surface-border bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">批次信息</h3>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-3 lg:grid-cols-4">
          <div>
            <dt className="text-slate-500 dark:text-slate-400">城市</dt>
            <dd className="mt-0.5 font-medium text-slate-800 dark:text-slate-200">{batch.city_code}</dd>
          </div>
          <div>
            <dt className="text-slate-500 dark:text-slate-400">周期</dt>
            <dd className="mt-0.5 font-medium text-slate-800 dark:text-slate-200">
              {batch.period_start} ~ {batch.period_end}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500 dark:text-slate-400">总金额</dt>
            <dd className="mt-0.5 font-medium text-accent-600 dark:text-accent-400">
              {formatCurrency(batch.total_amount)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500 dark:text-slate-400">总条数</dt>
            <dd className="mt-0.5 font-medium text-slate-800 dark:text-slate-200">{batch.total_count}</dd>
          </div>
          <div>
            <dt className="text-slate-500 dark:text-slate-400">状态</dt>
            <dd className="mt-0.5"><StatusBadge status={batch.status} /></dd>
          </div>
          <div>
            <dt className="text-slate-500 dark:text-slate-400">创建人</dt>
            <dd className="mt-0.5 font-medium text-slate-800 dark:text-slate-200">{truncateId(batch.created_by)}</dd>
          </div>
          <div>
            <dt className="text-slate-500 dark:text-slate-400">创建时间</dt>
            <dd className="mt-0.5 font-medium text-slate-800 dark:text-slate-200">{formatDate(batch.created_at)}</dd>
          </div>
        </dl>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">结算明细</h2>
        <DataTable<SettlementDetail>
          columns={COLUMNS}
          data={detailsData?.items ?? []}
          page={page}
          pageSize={20}
          total={detailsData?.total ?? 0}
          onPageChange={setPage}
          loading={detailsLoading}
          getRowKey={(row) => row.id}
        />
      </div>
    </div>
  )
}
