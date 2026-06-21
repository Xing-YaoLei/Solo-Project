import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Save, Send, CheckCircle2, XCircle, Pencil, Ban, X } from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import Empty from '@/components/Empty'
import { useSubsidyRule, useUpdateSubsidyRule, useSubmitApproval, useApproveRule, useRejectRule } from '@/api/hooks'
import type { SubsidyRuleCreate, RouteType } from '@/types'

const ROUTE_TYPE_LABELS: Record<RouteType, string> = { short: '短途', medium: '中途', long: '长途', cross_district: '跨区' }
const CITY_LABELS: Record<string, string> = { BJ: '北京', SH: '上海', GZ: '广州', SZ: '深圳' }
const INPUT_CLS = 'w-full rounded-md border border-surface-border bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200'

function Field({ label, editable, children, text }: { label: string; editable: boolean; children: React.ReactNode; text: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-500 dark:text-slate-400">{label}</label>
      {editable ? children : <p className="text-sm text-slate-800 dark:text-slate-200">{text}</p>}
    </div>
  )
}

function ActionBtn({ onClick, disabled, color, icon: Icon, children }: { onClick?: () => void; disabled?: boolean; color: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled} className={`flex w-full items-center justify-center gap-1.5 rounded-md ${color} px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50`}>
      <Icon size={14} />{children}
    </button>
  )
}

export default function SubsidyRuleDetail() {
  const { ruleId } = useParams({ strict: false }) as { ruleId: string }
  const navigate = useNavigate()
  const { data: rule, isLoading } = useSubsidyRule(ruleId)

  const [showReject, setShowReject] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [form, setForm] = useState<Partial<SubsidyRuleCreate>>({})
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (rule && !initialized) {
      setForm({ name: rule.name, city_code: rule.city_code, route_type: rule.route_type, distance_min_km: rule.distance_min_km, distance_max_km: rule.distance_max_km, amount_per_km: rule.amount_per_km, max_amount: rule.max_amount, effective_from: rule.effective_from.slice(0, 10), effective_to: rule.effective_to.slice(0, 10) })
      setInitialized(true)
    }
  }, [rule, initialized])

  const updateMutation = useUpdateSubsidyRule()
  const submitMutation = useSubmitApproval()
  const approveMutation = useApproveRule()
  const rejectMutation = useRejectRule()

  const isEditable = rule && (rule.status === 'draft' || rule.status === 'rejected')
  const set = (field: keyof SubsidyRuleCreate, value: string | number) => setForm((p) => ({ ...p, [field]: value }))

  const handleSave = () => { if (rule) updateMutation.mutate({ id: rule.id, data: form }) }
  const handleSubmitApproval = () => { if (rule) submitMutation.mutate(rule.id) }
  const handleApprove = () => { if (rule) approveMutation.mutate(rule.id) }
  const handleReject = () => {
    if (!rule || !rejectReason.trim()) return
    rejectMutation.mutate({ ruleId: rule.id, reason: rejectReason }, { onSuccess: () => { setShowReject(false); setRejectReason('') } })
  }

  if (isLoading) return <div className="py-12 text-center text-slate-400">加载中...</div>
  if (!rule) return <Empty message="规则不存在" />

  const selectOpts = (map: Record<string, string>) => Object.entries(map).map(([v, l]) => <option key={v} value={v}>{l}</option>)

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate({ to: '/subsidy-rules' })} className="flex items-center gap-1 text-sm text-slate-500 hover:text-primary-600">
          <ArrowLeft size={16} />补贴规则
        </button>
        <span className="text-slate-300">/</span>
        <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{rule.name}</h1>
        <StatusBadge status={rule.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-surface-border bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">规则信息</h2>
            <div className="space-y-4">
              <Field label="规则名称" editable={!!isEditable} text={rule.name}>
                <input value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} className={INPUT_CLS} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="城市" editable={!!isEditable} text={CITY_LABELS[rule.city_code] ?? rule.city_code}>
                  <select value={form.city_code ?? ''} onChange={(e) => set('city_code', e.target.value)} className={INPUT_CLS}>{selectOpts(CITY_LABELS)}</select>
                </Field>
                <Field label="路线类型" editable={!!isEditable} text={ROUTE_TYPE_LABELS[rule.route_type]}>
                  <select value={form.route_type ?? ''} onChange={(e) => set('route_type', e.target.value)} className={INPUT_CLS}>{selectOpts(ROUTE_TYPE_LABELS)}</select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="最小距离(km)" editable={!!isEditable} text={`${rule.distance_min_km} km`}>
                  <input type="number" value={form.distance_min_km ?? 0} onChange={(e) => set('distance_min_km', Number(e.target.value))} className={INPUT_CLS} />
                </Field>
                <Field label="最大距离(km)" editable={!!isEditable} text={`${rule.distance_max_km} km`}>
                  <input type="number" value={form.distance_max_km ?? 0} onChange={(e) => set('distance_max_km', Number(e.target.value))} className={INPUT_CLS} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="每公里补贴(¥)" editable={!!isEditable} text={`¥${rule.amount_per_km.toFixed(2)}`}>
                  <input type="number" step="0.01" value={form.amount_per_km ?? 0} onChange={(e) => set('amount_per_km', Number(e.target.value))} className={INPUT_CLS} />
                </Field>
                <Field label="上限金额(¥)" editable={!!isEditable} text={`¥${rule.max_amount.toFixed(2)}`}>
                  <input type="number" step="0.01" value={form.max_amount ?? 0} onChange={(e) => set('max_amount', Number(e.target.value))} className={INPUT_CLS} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="生效日期" editable={!!isEditable} text={rule.effective_from.slice(0, 10)}>
                  <input type="date" value={form.effective_from ?? ''} onChange={(e) => set('effective_from', e.target.value)} className={INPUT_CLS} />
                </Field>
                <Field label="失效日期" editable={!!isEditable} text={rule.effective_to.slice(0, 10)}>
                  <input type="date" value={form.effective_to ?? ''} onChange={(e) => set('effective_to', e.target.value)} className={INPUT_CLS} />
                </Field>
              </div>
            </div>
            {isEditable && (
              <div className="mt-6">
                <button onClick={handleSave} disabled={updateMutation.isPending} className="flex items-center gap-1.5 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
                  <Save size={16} />{updateMutation.isPending ? '保存中...' : '保存'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-surface-border bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">状态信息</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">当前状态</span><StatusBadge status={rule.status} /></div>
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">创建人</span><span className="text-slate-800 dark:text-slate-200">{rule.created_by}</span></div>
              {rule.approved_by && <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">审批人</span><span className="text-slate-800 dark:text-slate-200">{rule.approved_by}</span></div>}
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">创建时间</span><span className="text-slate-800 dark:text-slate-200">{rule.created_at.slice(0, 16).replace('T', ' ')}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">更新时间</span><span className="text-slate-800 dark:text-slate-200">{rule.updated_at.slice(0, 16).replace('T', ' ')}</span></div>
            </div>
          </div>
          <div className="rounded-lg border border-surface-border bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">操作</h3>
            <div className="space-y-2">
              {rule.status === 'draft' && <ActionBtn onClick={handleSubmitApproval} disabled={submitMutation.isPending} color="bg-blue-600" icon={Send}>提交审批</ActionBtn>}
              {rule.status === 'pending_approval' && (
                <>
                  <ActionBtn onClick={handleApprove} disabled={approveMutation.isPending} color="bg-emerald-600" icon={CheckCircle2}>审批通过</ActionBtn>
                  <ActionBtn onClick={() => setShowReject(true)} color="bg-red-600" icon={XCircle}>驳回</ActionBtn>
                </>
              )}
              {rule.status === 'active' && <ActionBtn color="bg-amber-600" icon={Ban}>停用</ActionBtn>}
              {(rule.status === 'expired' || rule.status === 'rejected') && (
                <Link to="/subsidy-rules/$ruleId" params={{ ruleId: rule.id }} className="flex w-full items-center justify-center gap-1.5 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
                  <Pencil size={14} />重新编辑
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {showReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowReject(false)}>
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-slate-800" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">驳回原因</h2>
              <button onClick={() => setShowReject(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={4} placeholder="请输入驳回原因..." className={INPUT_CLS} />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowReject(false)} className="rounded-md border border-surface-border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">取消</button>
              <button onClick={handleReject} disabled={rejectMutation.isPending || !rejectReason.trim()} className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
                {rejectMutation.isPending ? '驳回中...' : '确认驳回'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
