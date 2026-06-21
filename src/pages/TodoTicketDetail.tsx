import { useState } from 'react'
import { useParams, Link } from '@tanstack/react-router'
import { ArrowLeft, User, Camera, X, MessageSquarePlus, ArrowRightLeft, CheckCircle2, AlertCircle, Upload, Clock } from 'lucide-react'
import {
  useTodoTicket, useClaimTicket, useRejectTicket,
  useTransferTicket, useRequestTodoSupplement, useResolveTicket,
  useVerificationPhotos, useUsers, useUploadTodoSupplement, useCloseTicket,
} from '@/api/hooks'
import StatusBadge from '@/components/StatusBadge'
import FlowTimeline from '@/components/FlowTimeline'
import Empty from '@/components/Empty'
import type { TodoPriority, TodoSourceType, FlowLog, TodoTicket } from '@/types'

const PRIORITY_COLORS: Record<TodoPriority, string> = {
  urgent: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-amber-400 text-white',
  low: 'bg-green-400 text-white',
}

const PRIORITY_LABELS: Record<TodoPriority, string> = {
  urgent: '紧急', high: '高', medium: '中', low: '低',
}

const SOURCE_LABELS: Record<TodoSourceType, string> = {
  damage: '物品损坏', appeal: '申诉', settlement_dispute: '结算争议', other: '其他',
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-slate-800" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function TodoTicketDetail() {
  const { ticketId } = useParams({ strict: false }) as { ticketId: string }
  const { data: ticketData, isLoading } = useTodoTicket(ticketId)
  const { data: photosData } = useVerificationPhotos({ ticket_id: ticketId })
  const { data: usersData } = useUsers({ page_size: 100 })
  const claimMutation = useClaimTicket()
  const rejectMutation = useRejectTicket()
  const transferMutation = useTransferTicket()
  const supplementMutation = useRequestTodoSupplement()
  const uploadSupplementMutation = useUploadTodoSupplement()
  const resolveMutation = useResolveTicket()
  const closeMutation = useCloseTicket()

  const [rejectOpen, setRejectOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [supplementOpen, setSupplementOpen] = useState(false)
  const [uploadSupplementOpen, setUploadSupplementOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [transferTarget, setTransferTarget] = useState('')
  const [supplementDesc, setSupplementDesc] = useState('')
  const [supplementUploadDesc, setSupplementUploadDesc] = useState('')

  const ticket = ticketData as (TodoTicket & { logs?: FlowLog[] }) | undefined
  const photos = photosData?.items ?? []
  const users = usersData?.items ?? []
  const logs = ticket?.logs ?? []

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    )
  }

  if (!ticket) return <Empty message="工单不存在" />

  const handleClaim = () => { claimMutation.mutate(ticketId) }
  const handleReject = () => {
    rejectMutation.mutate({ ticketId, reason }, { onSuccess: () => { setRejectOpen(false); setReason('') } })
  }
  const handleTransfer = () => {
    transferMutation.mutate({ ticketId, target_user_id: transferTarget, reason }, { onSuccess: () => { setTransferOpen(false); setReason(''); setTransferTarget('') } })
  }
  const handleRequestSupplement = () => {
    supplementMutation.mutate({ ticketId, description: supplementDesc }, { onSuccess: () => { setSupplementOpen(false); setSupplementDesc('') } })
  }
  const handleUploadSupplement = () => {
    uploadSupplementMutation.mutate({ ticketId, description: supplementUploadDesc }, { onSuccess: () => { setUploadSupplementOpen(false); setSupplementUploadDesc('') } })
  }
  const handleResolve = () => { resolveMutation.mutate(ticketId) }
  const handleClose = () => { closeMutation.mutate(ticketId) }

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0">
        <div className="mb-6 flex items-center gap-3">
          <Link to="/todo-pool" className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700">
            <ArrowLeft size={16} /> 返回
          </Link>
          <span className="text-sm text-slate-400 font-mono">{ticketId.slice(0, 8)}</span>
          <span className={`rounded px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[ticket.priority]}`}>
            {PRIORITY_LABELS[ticket.priority]}
          </span>
          <StatusBadge status={ticket.status} />
        </div>

        <div className="rounded-lg border border-surface-border bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100">{ticket.title}</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-slate-400">来源类型：</span><span className="text-slate-700 dark:text-slate-300">{SOURCE_LABELS[ticket.source_type]}</span></div>
            <div><span className="text-slate-400">来源ID：</span><span className="font-mono text-slate-700 dark:text-slate-300">{ticket.source_id}</span></div>
            <div><span className="text-slate-400">创建时间：</span><span className="text-slate-700 dark:text-slate-300">{formatDate(ticket.created_at)}</span></div>
            <div><span className="text-slate-400">更新时间：</span><span className="text-slate-700 dark:text-slate-300">{formatDate(ticket.updated_at)}</span></div>
          </div>

          <div className="mt-4 border-t border-surface-border pt-4 dark:border-slate-700">
            <span className="text-sm text-slate-400">当前处理人：</span>
            <span className="flex items-center gap-1 text-sm text-slate-700 dark:text-slate-300">
              <User size={14} />{ticket.assignee_id ?? '未分配'}
            </span>
          </div>

          {ticket.transfer_from && (
            <div className="mt-3 rounded bg-amber-50 p-3 dark:bg-amber-900/20">
              <span className="text-xs text-amber-600 dark:text-amber-400">转交自：{ticket.transfer_from}</span>
              {ticket.transfer_reason && <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">原因：{ticket.transfer_reason}</p>}
            </div>
          )}
        </div>

        <div className="mt-6 rounded-lg border border-surface-border bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">流程记录</h3>
          <FlowTimeline logs={logs} />
        </div>

        <div className="mt-6 rounded-lg border border-surface-border bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">核验照片</h3>
          {photos.length === 0 ? (
            <Empty icon={Camera} message="暂无照片" className="min-h-[100px]" />
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {photos.map((p) => (
                <div key={p.id} className="group relative aspect-square overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-700">
                  <img src={p.url} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <p className="text-xs text-white">{p.remark}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="w-64 shrink-0">
        <div className="sticky top-4 rounded-lg border border-surface-border bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">操作</h3>
          <div className="flex flex-col gap-2">
            {(ticket.status === 'pending' || ticket.status === 'transferred') && (
              <button onClick={handleClaim} disabled={claimMutation.isPending} className="flex items-center justify-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
                <CheckCircle2 size={16} /> 认领
              </button>
            )}
            {(ticket.status === 'claimed' || ticket.status === 'in_progress' || ticket.status === 'supplement_requested' || ticket.status === 'supplement_needed') && (
              <>
                {(ticket.status === 'claimed' || ticket.status === 'in_progress') && (
                  <button onClick={() => setSupplementOpen(true)} disabled={supplementMutation.isPending} className="flex items-center justify-center gap-2 rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50">
                    <MessageSquarePlus size={16} /> 请求补充
                  </button>
                )}
                {ticket.status === 'supplement_requested' && (
                  <button onClick={() => setUploadSupplementOpen(true)} disabled={uploadSupplementMutation.isPending} className="flex items-center justify-center gap-2 rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50">
                    <Upload size={16} /> 上传补充
                  </button>
                )}
                <button onClick={() => setRejectOpen(true)} disabled={rejectMutation.isPending} className="flex items-center justify-center gap-2 rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50">
                  <AlertCircle size={16} /> 驳回
                </button>
                <button onClick={() => setTransferOpen(true)} disabled={transferMutation.isPending} className="flex items-center justify-center gap-2 rounded-md bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-600 disabled:opacity-50">
                  <ArrowRightLeft size={16} /> 转交
                </button>
                <button onClick={handleResolve} disabled={resolveMutation.isPending} className="flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50">
                  <CheckCircle2 size={16} /> 解决
                </button>
              </>
            )}
            {ticket.status === 'resolved' && (
              <button onClick={handleClose} disabled={closeMutation.isPending} className="flex items-center justify-center gap-2 rounded-md bg-slate-600 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50">
                <Clock size={16} /> 关闭
              </button>
            )}
          </div>
        </div>
      </div>

      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} title="驳回工单">
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="请输入驳回原因" rows={4} className="w-full rounded-md border border-surface-border p-3 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200" />
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => setRejectOpen(false)} className="rounded-md border border-surface-border px-4 py-2 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300">取消</button>
          <button onClick={handleReject} disabled={!reason.trim() || rejectMutation.isPending} className="rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50">确认驳回</button>
        </div>
      </Dialog>

      <Dialog open={transferOpen} onClose={() => setTransferOpen(false)} title="转交工单">
        <select value={transferTarget} onChange={(e) => setTransferTarget(e.target.value)} className="mb-3 w-full rounded-md border border-surface-border p-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
          <option value="">选择目标处理人</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.display_name} ({u.username})</option>)}
        </select>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="请输入转交原因" rows={4} className="w-full rounded-md border border-surface-border p-3 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200" />
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => setTransferOpen(false)} className="rounded-md border border-surface-border px-4 py-2 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300">取消</button>
          <button onClick={handleTransfer} disabled={!transferTarget || !reason.trim() || transferMutation.isPending} className="rounded-md bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-600 disabled:opacity-50">确认转交</button>
        </div>
      </Dialog>

      <Dialog open={supplementOpen} onClose={() => setSupplementOpen(false)} title="请求补充信息">
        <textarea value={supplementDesc} onChange={(e) => setSupplementDesc(e.target.value)} placeholder="请输入需要补充的内容说明" rows={4} className="w-full rounded-md border border-surface-border p-3 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200" />
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => setSupplementOpen(false)} className="rounded-md border border-surface-border px-4 py-2 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300">取消</button>
          <button onClick={handleRequestSupplement} disabled={!supplementDesc.trim() || supplementMutation.isPending} className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50">确认请求</button>
        </div>
      </Dialog>

      <Dialog open={uploadSupplementOpen} onClose={() => setUploadSupplementOpen(false)} title="上传补充材料">
        <textarea value={supplementUploadDesc} onChange={(e) => setSupplementUploadDesc(e.target.value)} placeholder="请输入补充说明" rows={4} className="w-full rounded-md border border-surface-border p-3 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200" />
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => setUploadSupplementOpen(false)} className="rounded-md border border-surface-border px-4 py-2 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300">取消</button>
          <button onClick={handleUploadSupplement} disabled={!supplementUploadDesc.trim() || uploadSupplementMutation.isPending} className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50">确认提交</button>
        </div>
      </Dialog>
    </div>
  )
}
