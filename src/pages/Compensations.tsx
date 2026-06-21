import { useState } from 'react'
import { Plus, Camera, ShieldCheck, Pencil, X } from 'lucide-react'
import {
  useCompensationTypes, useCompensationRecords,
  useCreateCompensationType, useUpdateCompensationType,
  useCreateCompensationRecord, useApproveCompensation, useRejectCompensation,
} from '@/api/hooks'
import DataTable, { type ColumnDef } from '@/components/DataTable'
import FilterBar, { type FilterField } from '@/components/FilterBar'
import StatusBadge from '@/components/StatusBadge'
import type { CompensationRecord, CompensationCategory, CompensationType } from '@/types'

const CATEGORY_LABELS: Record<CompensationCategory, string> = {
  damage: '物品损坏', loss: '物品丢失', delay: '配送延误', service_failure: '服务失误',
}

const CATEGORY_COLORS: Record<CompensationCategory, string> = {
  damage: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  loss: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  delay: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  service_failure: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
}

const formatCurrency = (n: number) => `¥${Number(n).toFixed(2)}`

const filterFields: FilterField[] = [
  { key: 'status', label: '状态', type: 'select', options: [
    { value: 'pending', label: '待审核' }, { value: 'approved', label: '已通过' },
    { value: 'rejected', label: '已驳回' }, { value: 'paid', label: '已支付' },
  ]},
  { key: 'category', label: '类型', type: 'select', options: [
    { value: 'damage', label: '物品损坏' }, { value: 'loss', label: '物品丢失' },
    { value: 'delay', label: '配送延误' }, { value: 'service_failure', label: '服务失误' },
  ]},
  { key: 'date', label: '日期', type: 'date_range' },
]

function TypeFormDialog({ open, onClose, initial }: { open: boolean; onClose: () => void; initial?: CompensationType | null }) {
  const createMutation = useCreateCompensationType()
  const updateMutation = useUpdateCompensationType()
  const [name, setName] = useState(initial?.name ?? '')
  const [code, setCode] = useState('')
  const [category, setCategory] = useState<CompensationCategory>(initial?.category ?? 'damage')
  const [standardAmount, setStandardAmount] = useState(String(initial?.standard_amount ?? ''))
  const [maxAmount, setMaxAmount] = useState(String(initial?.max_amount ?? ''))
  const [requiresPhoto, setRequiresPhoto] = useState(initial?.requires_photo ?? false)
  const [approvalRequired, setApprovalRequired] = useState(initial?.approval_required ?? true)

  const handleSubmit = () => {
    if (initial) {
      updateMutation.mutate({ 
        id: initial.id, 
        data: { 
          name, 
          category, 
          standard_amount: Number(standardAmount), 
          max_amount: Number(maxAmount),
          requires_photo: requiresPhoto,
          approval_required: approvalRequired,
        } 
      }, { onSuccess: onClose })
    } else {
      createMutation.mutate({ 
        name, 
        code, 
        category, 
        standard_amount: Number(standardAmount), 
        max_amount: Number(maxAmount),
        default_amount: Number(standardAmount),
        requires_photo: requiresPhoto,
        approval_required: approvalRequired,
      }, { onSuccess: onClose })
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-slate-800" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">{initial ? '编辑类型' : '新增类型'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <div className="space-y-3">
          <div><label className="mb-1 block text-xs font-medium text-slate-500">名称</label><input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border border-surface-border p-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200" /></div>
          {!initial && <div><label className="mb-1 block text-xs font-medium text-slate-500">编码</label><input value={code} onChange={(e) => setCode(e.target.value)} className="w-full rounded-md border border-surface-border p-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200" /></div>}
          <div><label className="mb-1 block text-xs font-medium text-slate-500">分类</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as CompensationCategory)} className="w-full rounded-md border border-surface-border p-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block text-xs font-medium text-slate-500">标准金额</label><input type="number" value={standardAmount} onChange={(e) => setStandardAmount(e.target.value)} className="w-full rounded-md border border-surface-border p-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200" /></div>
            <div><label className="mb-1 block text-xs font-medium text-slate-500">最大金额</label><input type="number" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} className="w-full rounded-md border border-surface-border p-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200" /></div>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={requiresPhoto} onChange={(e) => setRequiresPhoto(e.target.checked)} className="rounded border-surface-border text-primary-600" />
              <span className="text-xs text-slate-600 dark:text-slate-300">需核验照片</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={approvalRequired} onChange={(e) => setApprovalRequired(e.target.checked)} className="rounded border-surface-border text-primary-600" />
              <span className="text-xs text-slate-600 dark:text-slate-300">需审批</span>
            </label>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md border border-surface-border px-4 py-2 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300">取消</button>
          <button onClick={handleSubmit} disabled={!name.trim()} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">保存</button>
        </div>
      </div>
    </div>
  )
}

function RecordFormDialog({ open, onClose, types }: { open: boolean; onClose: () => void; types: CompensationType[] }) {
  const createMutation = useCreateCompensationRecord()
  const [typeId, setTypeId] = useState('')
  const [orderId, setOrderId] = useState('')
  const [riderId, setRiderId] = useState('')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')

  const handleSubmit = () => {
    createMutation.mutate({ type_id: typeId, order_id: orderId, rider_id: riderId, amount: Number(amount), reason }, { onSuccess: onClose })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-slate-800" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">新增赔付记录</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <div className="space-y-3">
          <div><label className="mb-1 block text-xs font-medium text-slate-500">赔付类型</label>
            <select value={typeId} onChange={(e) => setTypeId(e.target.value)} className="w-full rounded-md border border-surface-border p-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
              <option value="">选择类型</option>
              {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div><label className="mb-1 block text-xs font-medium text-slate-500">订单ID</label><input value={orderId} onChange={(e) => setOrderId(e.target.value)} className="w-full rounded-md border border-surface-border p-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200" /></div>
          <div><label className="mb-1 block text-xs font-medium text-slate-500">骑手ID</label><input value={riderId} onChange={(e) => setRiderId(e.target.value)} className="w-full rounded-md border border-surface-border p-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200" /></div>
          <div><label className="mb-1 block text-xs font-medium text-slate-500">金额</label><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-md border border-surface-border p-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200" /></div>
          <div><label className="mb-1 block text-xs font-medium text-slate-500">原因</label><textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="w-full rounded-md border border-surface-border p-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200" /></div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md border border-surface-border px-4 py-2 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300">取消</button>
          <button onClick={handleSubmit} disabled={!typeId || !orderId || !amount} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">保存</button>
        </div>
      </div>
    </div>
  )
}

export default function Compensations() {
  const [tab, setTab] = useState<'types' | 'records'>('types')
  const [typeFormOpen, setTypeFormOpen] = useState(false)
  const [editingType, setEditingType] = useState<CompensationType | null>(null)
  const [recordFormOpen, setRecordFormOpen] = useState(false)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [page, setPage] = useState(1)

  const { data: typesData } = useCompensationTypes({ page_size: 100 })
  const { data: recordsData, isLoading: recordsLoading } = useCompensationRecords({ page: page, page_size: 10, ...filters })
  const approveMutation = useApproveCompensation()
  const rejectMutation = useRejectCompensation()

  const types = typesData?.items ?? []
  const records = recordsData?.items ?? []

  const columns: ColumnDef<CompensationRecord>[] = [
    { key: 'id', header: 'ID', render: (r) => <span className="font-mono text-xs">{r.id.slice(0, 8)}</span> },
    { key: 'type_id', header: '类型', render: (r) => { const t = types.find((t) => t.id === r.type_id); return t?.name ?? r.type_id } },
    { key: 'rider_id', header: '骑手', render: (r) => <span className="font-mono text-xs">{r.rider_id}</span> },
    { key: 'amount', header: '金额', render: (r) => <span className="font-medium">{formatCurrency(r.amount)}</span> },
    { key: 'reason', header: '原因', render: (r) => <span className="line-clamp-1">{r.reason}</span> },
    { key: 'status', header: '状态', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'actions', header: '操作', render: (r) => r.status === 'pending' ? (
      <div className="flex gap-1">
        <button onClick={() => approveMutation.mutate(r.id)} className="rounded px-2 py-0.5 text-xs text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400">通过</button>
        <button onClick={() => rejectMutation.mutate({ recordId: r.id, reason: '驳回' })} className="rounded px-2 py-0.5 text-xs text-red-600 hover:bg-red-50 dark:text-red-400">驳回</button>
      </div>
    ) : null },
  ]

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">赔付管理</h1>
      </div>

      <div className="mb-4 flex border-b border-surface-border dark:border-slate-700">
        <button onClick={() => setTab('types')} className={`px-4 py-2 text-sm font-medium ${tab === 'types' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-slate-500'}`}>赔付类型</button>
        <button onClick={() => setTab('records')} className={`px-4 py-2 text-sm font-medium ${tab === 'records' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-slate-500'}`}>赔付记录</button>
      </div>

      {tab === 'types' && (
        <>
          <div className="mb-4 flex justify-end">
            <button onClick={() => { setEditingType(null); setTypeFormOpen(true) }} className="flex items-center gap-1 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
              <Plus size={16} /> 新增类型
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {types.map((ct) => (
              <div key={ct.id} className="rounded-lg border border-surface-border bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-slate-800 dark:text-slate-200">{ct.name}</h3>
                    <span className={`mt-1 inline-block rounded px-2 py-0.5 text-xs ${CATEGORY_COLORS[ct.category]}`}>
                      {CATEGORY_LABELS[ct.category]}
                    </span>
                  </div>
                  <button onClick={() => { setEditingType(ct); setTypeFormOpen(true) }} className="text-slate-400 hover:text-primary-600"><Pencil size={16} /></button>
                </div>
                <div className="mt-3 flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                  <span>标准：{formatCurrency(ct.standard_amount)}</span>
                  <span>上限：{formatCurrency(ct.max_amount)}</span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  {ct.requires_photo && <span className="flex items-center gap-1 text-xs text-slate-400"><Camera size={12} /> 需照片</span>}
                  {ct.approval_required && <span className="flex items-center gap-1 text-xs text-slate-400"><ShieldCheck size={12} /> 需审批</span>}
                </div>
              </div>
            ))}
          </div>
          <TypeFormDialog open={typeFormOpen} onClose={() => { setTypeFormOpen(false); setEditingType(null) }} initial={editingType} />
        </>
      )}

      {tab === 'records' && (
        <>
          <div className="mb-4">
            <FilterBar fields={filterFields} values={filters} onChange={setFilters} onApply={() => setPage(1)} onReset={() => { setFilters({}); setPage(1) }} />
          </div>
          <div className="mb-4 flex justify-end">
            <button onClick={() => setRecordFormOpen(true)} className="flex items-center gap-1 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
              <Plus size={16} /> 新增记录
            </button>
          </div>
          <DataTable
            columns={columns}
            data={records}
            page={page}
            pageSize={10}
            total={recordsData?.total ?? 0}
            onPageChange={setPage}
            getRowKey={(r: CompensationRecord) => r.id}
            loading={recordsLoading}
          />
          <RecordFormDialog open={recordFormOpen} onClose={() => setRecordFormOpen(false)} types={types} />
        </>
      )}
    </div>
  )
}
