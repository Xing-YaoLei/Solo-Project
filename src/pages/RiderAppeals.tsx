import { useState, useMemo } from 'react'
import { Plus, MessageSquare, X } from 'lucide-react'
import { useAppeals, useCreateAppeal } from '@/api/hooks'
import StatusBadge from '@/components/StatusBadge'
import DataTable, { type ColumnDef } from '@/components/DataTable'
import Empty from '@/components/Empty'
import { useAuthStore } from '@/stores/auth'
import type { AppealTicket } from '@/types'

const formatCurrency = (n: number) => `¥${Number(n).toFixed(2)}`

function formatDate(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const truncateId = (id: string) => id.slice(0, 8)

export default function RiderAppeals() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const riderId = currentUser?.id ?? ''
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [appealType, setAppealType] = useState('')
  const [description, setDescription] = useState('')

  const { data, isLoading } = useAppeals({ rider_id: riderId, page, page_size: 20 })
  const createMutation = useCreateAppeal()
  const appeals = useMemo(() => data?.items ?? [], [data])

  const handleCreate = () => {
    createMutation.mutate(
      { order_id: orderId, rider_id: riderId, appeal_type: appealType, description },
      { onSuccess: () => { setFormOpen(false); setOrderId(''); setAppealType(''); setDescription('') } },
    )
  }

  const columns: ColumnDef<AppealTicket>[] = [
    { key: 'id', header: '工单号', render: (r) => <span className="font-mono text-sm">{truncateId(r.id)}</span> },
    { key: 'original_amount', header: '原始金额', render: (r) => <span className="text-base">{formatCurrency(r.original_amount)}</span> },
    { key: 'claimed_amount', header: '申诉金额', render: (r) => <span className="text-base font-semibold text-accent-600">{formatCurrency(r.claimed_amount)}</span> },
    { key: 'status', header: '状态', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'created_at', header: '日期', render: (r) => <span className="text-sm text-slate-500">{formatDate(r.created_at)}</span> },
  ]

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">我的申诉</h1>
        <button onClick={() => setFormOpen(true)} className="flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700">
          <Plus size={18} /> 新建申诉
        </button>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center text-slate-400">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        </div>
      ) : appeals.length === 0 ? (
        <Empty icon={MessageSquare} message="暂无申诉记录" />
      ) : (
        <DataTable
          columns={columns}
          data={appeals}
          page={page}
          pageSize={20}
          total={data?.total ?? 0}
          onPageChange={setPage}
          getRowKey={(r: AppealTicket) => r.id}
          loading={isLoading}
        />
      )}

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setFormOpen(false)}>
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-slate-800" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">新建申诉</h3>
              <button onClick={() => setFormOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">订单ID</label>
                <input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="请输入订单ID" className="h-11 w-full rounded-lg border border-surface-border px-4 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">申诉类型</label>
                <select value={appealType} onChange={(e) => setAppealType(e.target.value)} className="h-11 w-full rounded-lg border border-surface-border px-4 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
                  <option value="">选择类型</option>
                  <option value="subsidy">补贴异议</option>
                  <option value="penalty">罚单申诉</option>
                  <option value="other">其他</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">申诉说明</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="请详细描述您的申诉理由" rows={4} className="w-full rounded-lg border border-surface-border p-4 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200" />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setFormOpen(false)} className="flex-1 rounded-lg border border-surface-border py-2.5 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300">取消</button>
              <button onClick={handleCreate} disabled={!orderId || !appealType || !description.trim() || createMutation.isPending} className="flex-1 rounded-lg bg-primary-600 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">提交</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
