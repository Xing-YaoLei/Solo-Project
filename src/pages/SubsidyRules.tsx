import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Plus, X, Pencil, Send, Trash2 } from 'lucide-react'
import DataTable, { type ColumnDef } from '@/components/DataTable'
import FilterBar, { type FilterField } from '@/components/FilterBar'
import StatusBadge from '@/components/StatusBadge'
import { useSubsidyRules, useCreateSubsidyRule } from '@/api/hooks'
import type { SubsidyRule, SubsidyRuleCreate, RouteType } from '@/types'

const ROUTE_TYPE_LABELS: Record<RouteType, string> = { short: '短途', medium: '中途', long: '长途', cross_district: '跨区' }
const CITY_LABELS: Record<string, string> = { BJ: '北京', SH: '上海', GZ: '广州', SZ: '深圳' }
const INPUT_CLS = 'w-full rounded-md border border-surface-border bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200'
const LABEL_CLS = 'mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300'

const FILTER_FIELDS: FilterField[] = [
  { key: 'city_code', label: '城市', type: 'select', options: [{ value: 'BJ', label: '北京' }, { value: 'SH', label: '上海' }, { value: 'GZ', label: '广州' }, { value: 'SZ', label: '深圳' }] },
  { key: 'status', label: '状态', type: 'select', options: [{ value: 'draft', label: '草稿' }, { value: 'pending_approval', label: '待审批' }, { value: 'active', label: '生效中' }, { value: 'expired', label: '已过期' }, { value: 'rejected', label: '已驳回' }] },
  { key: 'route_type', label: '路线类型', type: 'select', options: [{ value: 'short', label: '短途' }, { value: 'medium', label: '中途' }, { value: 'long', label: '长途' }, { value: 'cross_district', label: '跨区' }] },
  { key: 'keyword', label: '关键词', type: 'text', placeholder: '搜索规则名称' },
]

const INITIAL_FORM: SubsidyRuleCreate = { name: '', city_code: 'BJ', route_type: 'short', distance_min_km: 0, distance_max_km: 10, amount_per_km: 0, max_amount: 0, effective_from: '', effective_to: '' }

const PAGE_SIZE = 10

const selectOpts = (map: Record<string, string>) => Object.entries(map).map(([v, l]) => <option key={v} value={v}>{l}</option>)

export default function SubsidyRules() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<SubsidyRuleCreate>(INITIAL_FORM)

  const queryParams: Record<string, string | number> = { page, page_size: PAGE_SIZE }
  Object.entries(filters).forEach(([k, v]) => { if (v) queryParams[k] = v })

  const { data, isLoading } = useSubsidyRules(queryParams)
  const createMutation = useCreateSubsidyRule()

  const rules = data?.items ?? []
  const total = data?.total ?? 0
  const set = (field: keyof SubsidyRuleCreate, value: string | number) => setForm((p) => ({ ...p, [field]: value }))

  const handleCreate = () => {
    createMutation.mutate(form, { onSuccess: () => { setShowCreate(false); setForm(INITIAL_FORM) } })
  }

  const columns: ColumnDef<SubsidyRule>[] = [
    { key: 'name', header: '规则名称', render: (row) => <Link to="/subsidy-rules/$ruleId" params={{ ruleId: row.id }} className="text-primary-600 hover:underline">{row.name}</Link> },
    { key: 'city_code', header: '城市', render: (row) => CITY_LABELS[row.city_code] ?? row.city_code },
    { key: 'route_type', header: '路线类型', render: (row) => ROUTE_TYPE_LABELS[row.route_type as RouteType] ?? row.route_type },
    { key: 'amount_per_km', header: '每公里补贴', render: (row) => `¥${row.amount_per_km.toFixed(2)}` },
    { key: 'max_amount', header: '上限金额', render: (row) => `¥${row.max_amount.toFixed(2)}` },
    { key: 'status', header: '状态', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'effective', header: '生效期', render: (row) => `${row.effective_from.slice(0, 10)} ~ ${row.effective_to.slice(0, 10)}` },
    {
      key: 'actions', header: '操作',
      render: (row) => (
        <div className="flex items-center gap-2">
          {(row.status === 'draft' || row.status === 'rejected') && <Link to="/subsidy-rules/$ruleId" params={{ ruleId: row.id }} className="text-primary-600 hover:underline"><Pencil size={14} /></Link>}
          {row.status === 'draft' && <button className="text-blue-600"><Send size={14} /></button>}
          {row.status === 'draft' && <button className="text-red-500"><Trash2 size={14} /></button>}
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">补贴规则</h1>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
          <Plus size={16} />新建规则
        </button>
      </div>

      <FilterBar fields={FILTER_FIELDS} values={filters} onChange={setFilters} onApply={() => setPage(1)} onReset={() => { setFilters({}); setPage(1) }} />

      <div className="mt-4">
        <DataTable<SubsidyRule> columns={columns} data={rules} page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} loading={isLoading} getRowKey={(row) => row.id} />
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-slate-800" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">新建规则</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className={LABEL_CLS}>规则名称</label>
                <input value={form.name} onChange={(e) => set('name', e.target.value)} className={INPUT_CLS} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={LABEL_CLS}>城市</label><select value={form.city_code} onChange={(e) => set('city_code', e.target.value)} className={INPUT_CLS}>{selectOpts(CITY_LABELS)}</select></div>
                <div><label className={LABEL_CLS}>路线类型</label><select value={form.route_type} onChange={(e) => set('route_type', e.target.value)} className={INPUT_CLS}>{selectOpts(ROUTE_TYPE_LABELS)}</select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={LABEL_CLS}>最小距离(km)</label><input type="number" value={form.distance_min_km} onChange={(e) => set('distance_min_km', Number(e.target.value))} className={INPUT_CLS} /></div>
                <div><label className={LABEL_CLS}>最大距离(km)</label><input type="number" value={form.distance_max_km} onChange={(e) => set('distance_max_km', Number(e.target.value))} className={INPUT_CLS} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={LABEL_CLS}>每公里补贴(¥)</label><input type="number" step="0.01" value={form.amount_per_km} onChange={(e) => set('amount_per_km', Number(e.target.value))} className={INPUT_CLS} /></div>
                <div><label className={LABEL_CLS}>上限金额(¥)</label><input type="number" step="0.01" value={form.max_amount} onChange={(e) => set('max_amount', Number(e.target.value))} className={INPUT_CLS} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={LABEL_CLS}>生效日期</label><input type="date" value={form.effective_from} onChange={(e) => set('effective_from', e.target.value)} className={INPUT_CLS} /></div>
                <div><label className={LABEL_CLS}>失效日期</label><input type="date" value={form.effective_to} onChange={(e) => set('effective_to', e.target.value)} className={INPUT_CLS} /></div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowCreate(false)} className="rounded-md border border-surface-border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">取消</button>
              <button onClick={handleCreate} disabled={createMutation.isPending} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
                {createMutation.isPending ? '创建中...' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
