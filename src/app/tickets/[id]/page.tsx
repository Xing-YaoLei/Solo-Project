'use client'

import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Mail,
  FileText,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  AlertTriangle,
  CheckSquare,
  Square,
  Share2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/sidebar'
import Header from '@/components/layout/header'
import StatusBadge from '@/components/ui/status-badge'
import PriorityBadge from '@/components/ui/priority-badge'
import Modal from '@/components/ui/modal'
import {
  TICKET_STATUS_LABELS,
  REVIEW_OPINION_LABELS,
  REVIEW_OPINION_COLORS,
  REMARK_PRIORITY_COLORS,
  CLOSURE_REASON_LABELS,
  USER_ROLE_LABELS,
} from '@/lib/constants'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type {
  TicketDetailResponse,
  ReviewOpinion,
  UserRole,
} from '@/lib/types'
import { cn } from '@/lib/utils'

export default function TicketDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [data, setData] = useState<TicketDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [reviewOpinion, setReviewOpinion] = useState<ReviewOpinion>('approved')
  const [reviewComment, setReviewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [shareScope, setShareScope] = useState<UserRole[]>(['compliance_officer', 'management'])
  const [shareExpiresIn, setShareExpiresIn] = useState(7)
  const [shareUrl, setShareUrl] = useState('')

  useEffect(() => {
    fetchTicketDetail()
  }, [params.id])

  const fetchTicketDetail = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/tickets/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setData(data)
      }
    } catch (error) {
      console.error('Failed to fetch ticket:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReview = async () => {
    if (!reviewComment.trim()) return

    try {
      setSubmitting(true)
      const res = await fetch(`/api/tickets/${params.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opinion: reviewOpinion,
          comment: reviewComment,
        }),
      })

      if (res.ok) {
        const result = await res.json()
        if (result.remarkTask) {
          alert(`复核完成，已生成 ${data?.remarkTasks.length ? data.remarkTasks.length + 1 : 1} 条备注任务`)
        }
        setShowReviewModal(false)
        setReviewComment('')
        fetchTicketDetail()
      }
    } catch (error) {
      console.error('Failed to submit review:', error)
      alert('提交失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateShare = async () => {
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope: shareScope,
          expiresIn: shareExpiresIn,
          page: 'ticket',
          ticketId: params.id,
        }),
      })

      if (res.ok) {
        const result = await res.json()
        setShareUrl(result.shareUrl)
      }
    } catch (error) {
      console.error('Failed to create share:', error)
    }
  }

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    try {
      const res = await fetch(`/api/tickets/${params.id}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed }),
      })

      if (res.ok) {
        fetchTicketDetail()
      }
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-slate-500">加载中...</div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-slate-500">工单不存在</div>
        </div>
      </div>
    )
  }

  const { ticket, remediationLog, reviewRecords, emailMaterials, remarkTasks } = data

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title="工单详情" />
        <main className="flex-1 overflow-y-auto">
          <div className="border-b border-slate-200 bg-white px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.back()}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-navy-900"
                >
                  <ArrowLeft className="h-4 w-4" />
                  返回
                </button>
                <span className="font-mono text-sm font-medium text-navy-900">{ticket.ticketNo}</span>
                <StatusBadge status={ticket.status} />
                {ticket.closureReason && (
                  <span className="text-xs text-slate-500">
                    关闭原因：{CLOSURE_REASON_LABELS[ticket.closureReason]}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  <Share2 className="h-4 w-4" />
                  分享
                </button>
                {ticket.status === 'pending_review' && (
                  <button
                    onClick={() => setShowReviewModal(true)}
                    className="flex items-center gap-1 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
                  >
                    复核
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h1 className="text-lg font-bold text-navy-900">{ticket.title}</h1>
              <p className="mt-2 text-sm text-slate-600">{ticket.description}</p>
              <div className="mt-4 grid grid-cols-4 gap-4 text-xs">
                <div>
                  <p className="text-slate-400">部门</p>
                  <p className="mt-0.5 font-medium text-slate-700">{ticket.department || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-400">创建时间</p>
                  <p className="mt-0.5 font-medium text-slate-700">
                    {format(new Date(ticket.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">截止日期</p>
                  <p className="mt-0.5 font-medium text-slate-700">
                    {ticket.dueDate
                      ? format(new Date(ticket.dueDate), 'yyyy-MM-dd', { locale: zhCN })
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">首次解决</p>
                  <p className="mt-0.5 font-medium text-slate-700">
                    {ticket.firstResolution ? (
                      <span className="text-emerald-600">是</span>
                    ) : (
                      <span className="text-slate-400">否</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 space-y-6">
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <h2 className="text-sm font-bold text-navy-900">复核记录</h2>
                  </div>
                  {reviewRecords.length === 0 ? (
                    <p className="text-xs text-slate-400">暂无复核记录</p>
                  ) : (
                    <div className="space-y-3">
                      {reviewRecords.map((record) => (
                        <div
                          key={record.id}
                          className="rounded-lg border border-slate-100 bg-slate-50 p-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className="inline-flex h-5 items-center rounded-full px-2 text-xs font-medium"
                                style={{
                                  backgroundColor: `${REVIEW_OPINION_COLORS[record.opinion]}15`,
                                  color: REVIEW_OPINION_COLORS[record.opinion],
                                }}
                              >
                                {REVIEW_OPINION_LABELS[record.opinion]}
                              </span>
                              <span className="text-xs text-slate-400">
                                {format(new Date(record.createdAt), 'yyyy-MM-dd HH:mm', {
                                  locale: zhCN,
                                })}
                              </span>
                            </div>
                          </div>
                          <p className="mt-2 text-xs text-slate-600">{record.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <h2 className="text-sm font-bold text-navy-900">整改日志</h2>
                  </div>
                  {remediationLog.length === 0 ? (
                    <p className="text-xs text-slate-400">暂无整改日志</p>
                  ) : (
                    <div className="relative">
                      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-200" />
                      <div className="space-y-4">
                        {remediationLog.map((log) => (
                          <div key={log.id} className="relative pl-6">
                            <div className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-amber-500 shadow" />
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-navy-900">{log.action}</span>
                              <span className="text-xs text-slate-400">
                                {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm', {
                                  locale: zhCN,
                                })}
                              </span>
                            </div>
                            {log.description && (
                              <p className="mt-1 text-xs text-slate-500">{log.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <h2 className="text-sm font-bold text-navy-900">邮件材料追溯</h2>
                  </div>
                  {emailMaterials.length === 0 ? (
                    <p className="text-xs text-slate-400">暂无关联邮件材料</p>
                  ) : (
                    <div className="space-y-3">
                      {emailMaterials.map((email) => (
                        <div
                          key={email.id}
                          className="rounded-lg border border-slate-100 bg-slate-50 p-3"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-navy-900 truncate">
                                主题：{email.subject}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                发件人：{email.sender}
                              </p>
                              <p className="text-xs text-slate-500">
                                收件人：{email.recipients}
                              </p>
                              <p className="text-xs text-slate-400">
                                {format(new Date(email.sentAt), 'yyyy-MM-dd HH:mm', {
                                  locale: zhCN,
                                })}
                              </p>
                            </div>
                            {email.attachmentUrls && (
                              <span className="ml-2 shrink-0 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                                含附件
                              </span>
                            )}
                          </div>
                          {email.bodyPreview && (
                            <div className="mt-2 rounded bg-white p-2 text-xs text-slate-600">
                              {email.bodyPreview}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-slate-400" />
                    <h2 className="text-sm font-bold text-navy-900">备注任务</h2>
                  </div>
                  {remarkTasks.length === 0 ? (
                    <p className="text-xs text-slate-400">暂无备注任务</p>
                  ) : (
                    <div className="space-y-2">
                      {remarkTasks.map((task) => (
                        <div
                          key={task.id}
                          className={cn(
                            'flex items-start gap-2 rounded-lg border p-3 transition-colors',
                            task.completed
                              ? 'border-emerald-200 bg-emerald-50'
                              : 'border-slate-200 bg-white'
                          )}
                        >
                          <button
                            onClick={() => handleToggleTask(task.id, task.completed)}
                            className="mt-0.5 shrink-0"
                          >
                            {task.completed ? (
                              <CheckSquare className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <Square className="h-4 w-4 text-slate-300" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <PriorityBadge priority={task.priority} />
                              {task.dueDate && (
                                <span className="text-[10px] text-slate-400">
                                  截止：{format(new Date(task.dueDate), 'MM-dd', { locale: zhCN })}
                                </span>
                              )}
                            </div>
                            <p
                              className={cn(
                                'mt-1 text-xs',
                                task.completed ? 'text-slate-400 line-through' : 'text-slate-600'
                              )}
                            >
                              {task.description}
                            </p>
                            {task.completedBy && (
                              <p className="mt-1 text-[10px] text-emerald-600">
                                已由 {task.completedBy} 完成
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <Modal
        open={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="复核工单"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-600">复核意见</label>
            <div className="flex gap-2">
              {(['approved', 'rejected', 'returned_for_modification'] as ReviewOpinion[]).map(
                (opinion) => (
                  <button
                    key={opinion}
                    onClick={() => setReviewOpinion(opinion)}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                      reviewOpinion === opinion
                        ? 'border-transparent text-white'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    )}
                    style={
                      reviewOpinion === opinion
                        ? { backgroundColor: REVIEW_OPINION_COLORS[opinion] }
                        : {}
                    }
                  >
                    {opinion === 'approved' && <CheckCircle2 className="h-4 w-4" />}
                    {opinion === 'rejected' && <XCircle className="h-4 w-4" />}
                    {opinion === 'returned_for_modification' && <RotateCcw className="h-4 w-4" />}
                    {REVIEW_OPINION_LABELS[opinion]}
                  </button>
                )
              )}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-600">复核说明</label>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="请输入复核意见说明..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 focus:border-amber-500 focus:outline-none"
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowReviewModal(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              取消
            </button>
            <button
              onClick={handleSubmitReview}
              disabled={submitting || !reviewComment.trim()}
              className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {submitting ? '提交中...' : '提交复核'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="生成分享链接"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-600">共享范围</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(USER_ROLE_LABELS) as UserRole[]).map((role) => (
                <label
                  key={role}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs"
                >
                  <input
                    type="checkbox"
                    checked={shareScope.includes(role)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setShareScope([...shareScope, role])
                      } else {
                        setShareScope(shareScope.filter((r) => r !== role))
                      }
                    }}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  {USER_ROLE_LABELS[role]}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-600">
              有效期（天）
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={shareExpiresIn}
              onChange={(e) => setShareExpiresIn(parseInt(e.target.value) || 7)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 focus:border-amber-500 focus:outline-none"
            />
          </div>
          {shareUrl ? (
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="mb-2 text-xs font-medium text-slate-600">分享链接已生成：</p>
              <p className="break-all font-mono text-xs text-navy-900">{shareUrl}</p>
              <button
                onClick={() => navigator.clipboard.writeText(shareUrl)}
                className="mt-2 text-xs text-amber-600 hover:underline"
              >
                复制链接
              </button>
            </div>
          ) : (
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowShareModal(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                取消
              </button>
              <button
                onClick={handleCreateShare}
                disabled={shareScope.length === 0}
                className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
              >
                生成链接
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
