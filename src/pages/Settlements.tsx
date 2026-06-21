import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Receipt, Plus, X, Send, CheckCircle2 } from 'lucide-react'
import { useSettlementBatches, useCreateBatch, useReviewBatch, useApproveBatch } from '@/api/hooks'
import FilterBar from '@/components/FilterBar'
import type { FilterField } from '@/components/FilterBar'
import StatusBadge from '@/components/StatusBadge'
import type { SettlementBatchStatus } from '@/types'

const formatCurrency = (n: number) => `¥${Number(n).toFixed(2)}`

const FILTER_FIELDS: FilterField[] = [
  {
    key: 'city_code',
    label: '城市',
    type: 'select',
    options: [
      { value: 'BJ', label: '北京' },
      { value: 'SH', label: '上海' },
      { value: 'GZ', label: '广州' },
      { value: 'SZ', label: '深圳' },
    ],
  },
  {
    key: 'status',
    label: '状态',
    type: 'select',
    options: [
      { value: 'draft', label: '草稿' },
      { value: 'reviewing', label: '审核中' },
      { value: 'approved', label: '已审批' },
      { value: 'paid', label: '已支付' },
    ],
  },
  { key: 'date_range', label: '日期', type: 'date_range' },
]

function CreateBatchDialog({
  onClose,
  onConfirm,
}: {
  onClose: () => void
  onConfirm: (data: { city_code: string; period_start: string; period_end: string }) => void
}) {
  const [cityCode, setCityCode] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')

  const canConfirm = cityCode && periodStart && periodEnd

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-slate-800">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">创建结算批次</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">城市</label>
            <select
              value={cityCode}
              onChange={(e) => setCityCode(e.target.value)}
              className="w-full rounded-md border border-surface-border bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
            >
              <option value="">选择城市</option>
              <option value="BJ">北京</option>
              <option value="SH">上海</option>
              <option value="GZ">广州</option>
              <option value="SZ">深圳</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">开始日期</label>
            <input
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="w-full rounded-md border border-surface-border bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">结束日期</label>
            <input
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="w-full rounded-md border border-surface-border bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-surface-border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300"
          >
            取消
          </button>
          <button
            onClick={() => onConfirm({ city_code: cityCode, period_start: periodStart, period_end: periodEnd })}
            disabled={!canConfirm}
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            创建
          </button>
        </div>
      </div>
    </div>
  )
}

function BatchCard({
  batch,
  onReview,
  onApprove,
}: {
  batch: {
    id: string
    city_code: string
    period_start: string
    period_end: string
    total_amount: number
    total_count: number
    status: SettlementBatchStatus
  }
  onReview: (id: string) => void
  onApprove: (id: string) => void
}) {
  const btnBase = 'rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50'

  return (
    <Link to="/settlements/$batchId" params={{ batchId: batch.id }}>
      <div className="rounded-lg border border-surface-border bg-white p-5 transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {batch.period_start} ~ {batch.period_end}
          </span>
          <StatusBadge status={batch.status} />
        </div>

        <div className="mb-1 text-xs text-slate-500 dark:text-slate-400">城市: {batch.city_code}</div>
        <div className="mb-1 text-lg font-bold text-slate-800 dark:text-slate-100">{formatCurrency(batch.total_amount)}</div>
        <div className="mb-4 text-sm text-slate-500 dark:text-slate-400">{batch.total_count} 条</div>

        <div className="flex gap-2" onClick={(e) => e.preventDefault()}>
          {batch.status === 'draft' && (
            <button onClick={() => onReview(batch.id)} className={`${btnBase} bg-blue-600 text-white hover:bg-blue-700`}>
              <Send size={12} className="mr-1 inline" /> 提交审核
            </button>
          )}
          {batch.status === 'reviewing' && (
            <button onClick={() => onApprove(batch.id)} className={`${btnBase} bg-emerald-600 text-white hover:bg-emerald-700`}>
              <CheckCircle2 size={12} className="mr-1 inline" /> 审批通过
            </button>
          )}
          {batch.status === 'approved' && (
            <button disabled className={`${btnBase} border border-surface-border text-slate-400 dark:border-slate-600`}>
              已审批
            </button>
          )}
          {batch.status === 'paid' && (
            <button disabled className={`${btnBase} border border-surface-border text-slate-400 dark:border-slate-600`}>
              已支付
            </button>
          )}
        </div>
      </div>
    </Link>
  )
}

export default function Settlements() {
  const [showCreate, setShowCreate] = useState(false)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>({})
  const navigate = useNavigate()

  const queryParams: Record<string, string | number> = { page: 1, page_size: 50 }
  if (appliedFilters.city_code) queryParams.city_code = appliedFilters.city_code
  if (appliedFilters.status) queryParams.status = appliedFilters.status
  if (appliedFilters.date_range_start) queryParams.date_start = appliedFilters.date_range_start
  if (appliedFilters.date_range_end) queryParams.date_end = appliedFilters.date_range_end

  const { data, isLoading } = useSettlementBatches(queryParams)
  const createMut = useCreateBatch()
  const reviewMut = useReviewBatch()
  const approveMut = useApproveBatch()

  const handleApply = () => {
    setAppliedFilters({ ...filters })
  }

  const handleReset = () => {
    setFilters({})
    setAppliedFilters({})
  }

  const handleCreate = (data: { city_code: string; period_start: string; period_end: string }) => {
    createMut.mutate(data, {
      onSuccess: () => setShowCreate(false),
    })
  }

  const handleReview = (batchId: string) => {
    reviewMut.mutate(batchId)
  }

  const handleApprove = (batchId: string) => {
    approveMut.mutate(batchId, {
      onSuccess: () => navigate({ to: '/settlements/$batchId', params: { batchId } }),
    })
  }

  const batches = data?.items ?? []

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt size={24} className="text-primary-600" />
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">结算明细</h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus size={16} /> 创建批次
        </button>
      </div>

      <FilterBar
        fields={FILTER_FIELDS}
        values={filters}
        onChange={setFilters}
        onApply={handleApply}
        onReset={handleReset}
      />

      <div className="mt-4">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
            ))}
          </div>
        ) : batches.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">暂无结算批次</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {batches.map((batch) => (
              <BatchCard
                key={batch.id}
                batch={batch}
                onReview={handleReview}
                onApprove={handleApprove}
              />
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateBatchDialog onClose={() => setShowCreate(false)} onConfirm={handleCreate} />
      )}
    </div>
  )
}
