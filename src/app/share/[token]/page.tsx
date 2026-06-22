'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react'
import FunnelChart from '@/components/funnel/funnel-chart'
import FirstResolutionCard from '@/components/funnel/first-resolution-card'
import BoardChart from '@/components/board/board-chart'
import BoardGroupCard from '@/components/board/board-group'
import StatusBadge from '@/components/ui/status-badge'
import PriorityBadge from '@/components/ui/priority-badge'
import {
  REVIEW_OPINION_COLORS,
  CLOSURE_REASON_COLORS,
  TICKET_STATUS_COLORS,
  TICKET_STATUS_LABELS,
  REVIEW_OPINION_LABELS,
  CLOSURE_REASON_LABELS,
  USER_ROLE_LABELS,
} from '@/lib/constants'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type {
  ShareAccessResponse,
  UserRole,
  TicketDetailResponse,
  FunnelData,
  BoardData,
} from '@/lib/types'

export default function SharePage({ params }: { params: { token: string } }) {
  const router = useRouter()
  const [role, setRole] = useState<UserRole | ''>('')
  const [data, setData] = useState<ShareAccessResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSensitive, setShowSensitive] = useState(false)

  const validRoles: UserRole[] = ['auditor', 'business_owner', 'compliance_officer', 'management']

  const handleAccess = async () => {
    if (!role) return

    try {
      setLoading(true)
      setError('')
      const res = await fetch(`/api/share/${params.token}?role=${role}`)
      const result = await res.json()

      if (!res.ok) {
        setError(result.error || '访问失败')
        setData(null)
        return
      }

      if (!result.allowed) {
        setError(result.error || '无权访问')
        setData(null)
        return
      }

      setData(result)
    } catch (err) {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-lg px-4 py-16">
          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                <Lock className="h-8 w-8 text-amber-600" />
              </div>
              <h1 className="text-lg font-bold text-navy-900">安全访问</h1>
              <p className="mt-2 text-sm text-slate-500">请选择您的角色以访问分享内容</p>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-600">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="mb-6 space-y-2">
              <label className="mb-2 block text-xs font-medium text-slate-600">选择角色</label>
              {validRoles.map((r) => (
                <label
                  key={r}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                    role === r
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r}
                    checked={role === r}
                    onChange={() => setRole(r)}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-navy-900">{USER_ROLE_LABELS[r]}</p>
                    <p className="text-xs text-slate-400">
                      {r === 'auditor' && '可查看审计相关数据'}
                      {r === 'business_owner' && '可查看业务相关数据'}
                      {r === 'compliance_officer' && '可查看完整合规数据'}
                      {r === 'management' && '可查看管理汇总数据'}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            <button
              onClick={handleAccess}
              disabled={!role || loading}
              className="w-full rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {loading ? '验证中...' : '验证并访问'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const pageData = data.data as FunnelData | BoardData | TicketDetailResponse
  const isFunnel = 'stages' in pageData
  const isBoard = 'groups' in pageData && 'groupBy' in pageData
  const isTicket = 'ticket' in pageData

  const groupColors = isBoard
    ? (pageData as BoardData).groupBy === 'review_opinion'
      ? REVIEW_OPINION_COLORS
      : (pageData as BoardData).groupBy === 'closure_reason'
      ? CLOSURE_REASON_COLORS
      : TICKET_STATUS_COLORS
    : {}

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                <Eye className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-navy-900">
                  {isFunnel && '漏斗报表'}
                  {isBoard && '数据看板'}
                  {isTicket && '工单详情'}
                </h1>
                <p className="text-xs text-slate-400">
                  以 {USER_ROLE_LABELS[data.role as UserRole]} 身份访问
                </p>
              </div>
            </div>
            {data.masked && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSensitive(!showSensitive)}
                  className="flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                >
                  {showSensitive ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5" />
                      隐藏敏感信息
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5" />
                      显示敏感信息
                    </>
                  )}
                </button>
                <div className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                  <AlertTriangle className="h-3 w-3" />
                  数据已脱敏
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl p-6">
        {isFunnel && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-sm font-bold text-navy-900">整改跟踪漏斗</h2>
              <FunnelChart stages={(pageData as FunnelData).stages} />
            </div>
            <FirstResolutionCard
              rate={(pageData as FunnelData).firstResolutionRate}
              trend={(pageData as FunnelData).firstResolutionTrend}
            />
          </div>
        )}

        {isBoard && (
          <div className="flex gap-6">
            <div className="w-2/5 shrink-0">
              <div className="sticky top-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-sm font-bold text-navy-900">分布统计</h2>
                <BoardChart
                  groupBy={(pageData as BoardData).groupBy}
                  groups={(pageData as BoardData).groups}
                />
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <h2 className="mb-3 text-sm font-bold text-navy-900">分组明细</h2>
              {(pageData as BoardData).groups.map((group) => (
                <BoardGroupCard
                  key={group.key}
                  group={group}
                  color={(groupColors as any)[group.key] ?? '#64748B'}
                />
              ))}
            </div>
          </div>
        )}

        {isTicket && (
          <TicketDetailView
            data={pageData as TicketDetailResponse}
            showSensitive={showSensitive || !data.masked}
          />
        )}
      </div>
    </div>
  )
}

function TicketDetailView({
  data,
  showSensitive,
}: {
  data: TicketDetailResponse
  showSensitive: boolean
}) {
  const { ticket, remediationLog, reviewRecords, emailMaterials, remarkTasks } = data

  const maskText = (text: string) => {
    if (showSensitive) return text
    return text.replace(/[\u4e00-\u9fa5a-zA-Z0-9]/g, '*')
  }

  const maskEmail = (email: string) => {
    if (showSensitive) return email
    return '***@***.com'
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-medium text-navy-900">{ticket.ticketNo}</span>
          <StatusBadge status={ticket.status} />
          {ticket.closureReason && (
            <span className="text-xs text-slate-500">
              关闭原因：{CLOSURE_REASON_LABELS[ticket.closureReason]}
            </span>
          )}
        </div>
        <h1 className="mt-3 text-lg font-bold text-navy-900">{maskText(ticket.title)}</h1>
        <p className="mt-2 text-sm text-slate-600">{maskText(ticket.description)}</p>
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
            <h2 className="mb-4 text-sm font-bold text-navy-900">复核记录</h2>
            {reviewRecords.length === 0 ? (
              <p className="text-xs text-slate-400">暂无复核记录</p>
            ) : (
              <div className="space-y-3">
                {reviewRecords.map((record) => (
                  <div
                    key={record.id}
                    className="rounded-lg border border-slate-100 bg-slate-50 p-3"
                  >
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
                    <p className="mt-2 text-xs text-slate-600">{maskText(record.comment)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-bold text-navy-900">整改日志</h2>
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
                        <p className="mt-1 text-xs text-slate-500">{maskText(log.description)}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-bold text-navy-900">邮件材料追溯</h2>
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
                          主题：{maskText(email.subject)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          发件人：{maskEmail(email.sender)}
                        </p>
                        <p className="text-xs text-slate-500">
                          收件人：{maskEmail(email.recipients)}
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
                        {maskText(email.bodyPreview)}
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
            <h2 className="mb-4 text-sm font-bold text-navy-900">备注任务</h2>
            {remarkTasks.length === 0 ? (
              <p className="text-xs text-slate-400">暂无备注任务</p>
            ) : (
              <div className="space-y-2">
                {remarkTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-start gap-2 rounded-lg border p-3 ${
                      task.completed
                        ? 'border-emerald-200 bg-emerald-50'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {task.completed ? (
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <div className="h-4 w-4 rounded border-2 border-slate-300" />
                      )}
                    </div>
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
                        className={`mt-1 text-xs ${
                          task.completed ? 'text-slate-400 line-through' : 'text-slate-600'
                        }`}
                      >
                        {maskText(task.description)}
                      </p>
                      {task.completedBy && (
                        <p className="mt-1 text-[10px] text-emerald-600">
                          已由 {maskText(task.completedBy)} 完成
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
  )
}
