import { useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import {
  ArrowLeft, X, CheckCircle2, XCircle, ArrowRightLeft,
  MessageSquarePlus, AlertTriangle, Eye,
} from 'lucide-react'
import {
  useAppeal, useReviewAppeal, useApproveAppeal,
  useRejectAppeal, useTransferAppeal, useRequestSupplement,
  useEscalateAppeal, useUsers,
} from '@/api/hooks'
import StatusBadge from '@/components/StatusBadge'
import FlowTimeline from '@/components/FlowTimeline'
import type { AppealStatus } from '@/types'

const formatCurrency = (n: number) => `¥${Number(n).toFixed(2)}`
const formatDate = (iso: string) => {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const truncateId = (id: string) => id.slice(0, 8)

type DialogType = 'reject' | 'transfer' | 'supplement' | 'escalate' | null

function ActionDialog({
  type,
  onClose,
  onConfirm,
  users,
}: {
  type: DialogType
  onClose: () => void
  onConfirm: (data: Record<string, string>) => void
  users: { id: string; display_name: string }[]
}) {
  const [reason, setReason] = useState('')
  const [targetUserId, setTargetUserId] = useState('')

  if (!type) return null

  const titles: Record<string, string> = {
    reject: '驳回申诉',
    transfer: '转交申诉',
    supplement: '请求补充材料',
    escalate: '升级申诉',
  }

  const handleConfirm = () => {
    if (type === 'transfer') {
      onConfirm({ target_user_id: targetUserId, reason })
    } else {
      onConfirm({ reason })
    }
  }

  const canConfirm = type === 'transfer' ? targetUserId && reason : reason

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-slate-800">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{titles[type]}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {type === 'transfer' && (
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">转交给</label>
            <select
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              className="w-full rounded-md border border-surface-border bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
            >
              <option value="">选择目标用户</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.display_name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
            {type === 'supplement' ? '补充说明' : '原因'}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-surface-border bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
            placeholder={type === 'supplement' ? '请输入需要补充的内容说明' : '请输入原因'}
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-surface-border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  )
}

function ActionPanel({
  status,
  appealId,
}: {
  status: AppealStatus
  appealId: string
}) {
  const [dialog, setDialog] = useState<DialogType>(null)
  const reviewMut = useReviewAppeal()
  const approveMut = useApproveAppeal()
  const rejectMut = useRejectAppeal()
  const transferMut = useTransferAppeal()
  const supplementMut = useRequestSupplement()
  const escalateMut = useEscalateAppeal()
  const { data: usersData } = useUsers({ page_size: 100 })
  const users = usersData?.items ?? []

  const handleReview = () => reviewMut.mutate(appealId)
  const handleApprove = () => approveMut.mutate(appealId)

  const handleDialogConfirm = (data: Record<string, string>) => {
    switch (dialog) {
      case 'reject':
        rejectMut.mutate({ appealId, reason: data.reason })
        break
      case 'transfer':
        transferMut.mutate({ appealId, target_user_id: data.target_user_id, reason: data.reason })
        break
      case 'supplement':
        supplementMut.mutate({ appealId, description: data.reason })
        break
      case 'escalate':
        escalateMut.mutate({ appealId, reason: data.reason })
        break
    }
    setDialog(null)
  }

  const btnClass = 'w-full rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50'

  return (
    <div className="rounded-lg border border-surface-border bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">操作</h3>
      <div className="mb-4">
        <span className="text-xs text-slate-500 dark:text-slate-400">当前状态</span>
        <div className="mt-1"><StatusBadge status={status} /></div>
      </div>
      <div className="flex flex-col gap-2">
        {(status === 'pending' || status === 'transferred') && (
          <button onClick={handleReview} className={`${btnClass} bg-blue-600 text-white hover:bg-blue-700`}>
            <Eye size={14} className="mr-1 inline" /> 开始审核
          </button>
        )}
        {status === 'reviewing' && (
          <>
            <button onClick={handleApprove} className={`${btnClass} bg-emerald-600 text-white hover:bg-emerald-700`}>
              <CheckCircle2 size={14} className="mr-1 inline" /> 通过
            </button>
            <button onClick={() => setDialog('reject')} className={`${btnClass} bg-red-600 text-white hover:bg-red-700`}>
              <XCircle size={14} className="mr-1 inline" /> 驳回
            </button>
            <button onClick={() => setDialog('transfer')} className={`${btnClass} bg-purple-600 text-white hover:bg-purple-700`}>
              <ArrowRightLeft size={14} className="mr-1 inline" /> 转交
            </button>
            <button onClick={() => setDialog('supplement')} className={`${btnClass} bg-amber-600 text-white hover:bg-amber-700`}>
              <MessageSquarePlus size={14} className="mr-1 inline" /> 请求补充
            </button>
          </>
        )}
        {status === 'supplement_needed' && (
          <>
            <button onClick={handleApprove} className={`${btnClass} bg-emerald-600 text-white hover:bg-emerald-700`}>
              <CheckCircle2 size={14} className="mr-1 inline" /> 通过
            </button>
            <button onClick={() => setDialog('reject')} className={`${btnClass} bg-red-600 text-white hover:bg-red-700`}>
              <XCircle size={14} className="mr-1 inline" /> 驳回
            </button>
          </>
        )}
        {(status === 'reviewing' || status === 'supplement_needed') && (
          <button onClick={() => setDialog('escalate')} className={`${btnClass} bg-orange-600 text-white hover:bg-orange-700`}>
            <AlertTriangle size={14} className="mr-1 inline" /> 升级
          </button>
        )}
      </div>
      <ActionDialog type={dialog} onClose={() => setDialog(null)} onConfirm={handleDialogConfirm} users={users} />
    </div>
  )
}

function PhotoGrid({ photos }: { photos: { id: string; url: string; uploaded_at: string }[] }) {
  const [selected, setSelected] = useState<string | null>(null)

  if (photos.length === 0) {
    return <p className="text-sm text-slate-400">暂无照片</p>
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        {photos.map((photo) => (
          <button
            key={photo.id}
            onClick={() => setSelected(photo.url)}
            className="overflow-hidden rounded-lg border border-surface-border dark:border-slate-700"
          >
            <img src={photo.url} alt="" className="h-24 w-full object-cover" />
          </button>
        ))}
      </div>
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setSelected(null)}>
          <img src={selected} alt="" className="max-h-[80vh] max-w-[80vw] rounded-lg" />
        </div>
      )}
    </>
  )
}

export default function AppealDetail() {
  const { appealId } = useParams({ strict: false }) as { appealId: string }
  const { data: appeal, isLoading } = useAppeal(appealId)

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        加载中...
      </div>
    )
  }

  if (!appeal) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        未找到申诉工单
      </div>
    )
  }

  return (
    <div className="flex gap-6">
      <div className="flex-1 space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/appeals" className="flex items-center text-sm text-primary-600 hover:underline">
            <ArrowLeft size={16} className="mr-1" /> 返回列表
          </Link>
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            申诉 {truncateId(appeal.id)}
          </h1>
          <StatusBadge status={appeal.status} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-surface-border bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">订单信息</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">订单ID</dt>
                <dd className="text-slate-800 dark:text-slate-200">{truncateId(appeal.order_id)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">骑手ID</dt>
                <dd className="text-slate-800 dark:text-slate-200">{truncateId(appeal.rider_id)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">创建时间</dt>
                <dd className="text-slate-800 dark:text-slate-200">{formatDate(appeal.created_at)}</dd>
              </div>
            </dl>
          </div>
          <div className="rounded-lg border border-surface-border bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">补贴信息</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">原始金额</dt>
                <dd className="text-slate-800 dark:text-slate-200">{formatCurrency(appeal.original_amount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">申诉金额</dt>
                <dd className="font-medium text-accent-600 dark:text-accent-400">{formatCurrency(appeal.claimed_amount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">补贴规则</dt>
                <dd className="text-slate-800 dark:text-slate-200">{truncateId(appeal.subsidy_rule_id)}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="rounded-lg border border-surface-border bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">申诉原因</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">{appeal.reason}</p>
        </div>

        <div className="rounded-lg border border-surface-border bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">证据照片</h3>
          <PhotoGrid photos={appeal.photos} />
        </div>

        <div className="rounded-lg border border-surface-border bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">流程记录</h3>
          <FlowTimeline logs={appeal.logs} />
        </div>
      </div>

      <div className="w-1/3 min-w-[280px]">
        <div className="sticky top-6">
          <ActionPanel status={appeal.status} appealId={appeal.id} />
        </div>
      </div>
    </div>
  )
}
