'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { getFall, addCommunication, addReview } from '@/lib/api'
import StatusBadge from '@/components/StatusBadge'
import { Send, FileCheck, MapPin, Clock, User, AlertTriangle } from 'lucide-react'
import { formatDateTime } from '@/app/helpers'

const statusSteps = ['REPORTED', 'IN_REVIEW', 'REVIEWED', 'CLOSED']
const stepLabels: Record<string, string> = {
  REPORTED: '已报告',
  IN_REVIEW: '复核中',
  REVIEWED: '已复核',
  CLOSED: '已关闭',
}

export default function FallDetailPage() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const [msg, setMsg] = useState('')
  const [reviewForm, setReviewForm] = useState({
    conclusion: '',
    actionPlan: '',
    followUpDate: '',
  })

  const { data: fall, isLoading } = useQuery({
    queryKey: ['fall', id],
    queryFn: () => getFall(id as string),
    enabled: !!id,
  })

  const commMutation = useMutation({
    mutationFn: (content: string) =>
      addCommunication(id as string, {
        content,
        type: 'NOTE',
        authorId: 'u1',
        authorName: '张主管',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fall', id] })
      setMsg('')
    },
  })

  const reviewMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      addReview(id as string, {
        ...data,
        reviewerId: 'u1',
        reviewerName: '张主管',
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fall', id] }),
  })

  if (isLoading) return <div className="text-center py-20 text-slate-400">加载中...</div>
  if (!fall) return <div className="text-center py-20 text-slate-400">未找到跌倒事件</div>

  const currentStepIndex = statusSteps.indexOf(fall.status)

  return (
    <div>
      <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-bold text-slate-800">跌倒事件详情</h2>
          </div>
          <StatusBadge status={fall.riskLevel} variant="risk" pulse={fall.riskLevel === 'HIGH'} />
        </div>
        <div className="flex items-center gap-6 text-sm text-slate-600 mb-4">
          <span className="flex items-center gap-1"><User className="w-4 h-4" />{fall.elder?.name ?? '未知'}</span>
          <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{formatDateTime(fall.incidentTime)}</span>
          <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{fall.location}</span>
        </div>
        <div className="flex items-center gap-2">
          {statusSteps.map((step, i) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  i <= currentStepIndex
                    ? 'bg-teal-700 text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {i + 1}
              </div>
              <span className="ml-1.5 text-xs text-slate-500">{stepLabels[step]}</span>
              {i < statusSteps.length - 1 && (
                <div className={`w-8 h-0.5 mx-1 ${i < currentStepIndex ? 'bg-teal-700' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-7">
          <div className="bg-white rounded-xl p-5 shadow-sm h-full flex flex-col">
            <h3 className="font-semibold text-slate-800 mb-4">沟通记录</h3>
            <div className="flex-1 space-y-3 max-h-[500px] overflow-y-auto mb-4">
              {fall.communications?.length > 0 ? (
                fall.communications.map((c: any) => (
                  <div key={c.id} className="flex justify-start">
                    <div className="max-w-[80%] bg-slate-50 rounded-2xl rounded-tl-sm px-4 py-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-teal-700">{c.authorName}</span>
                        <span className="text-xs text-slate-400">{formatDateTime(c.createdAt)}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">
                          {c.type === 'NOTE' ? '备注' : c.type === 'PHONE_CALL' ? '电话' : '家属通知'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700">{c.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm">暂无沟通记录</div>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                placeholder="输入沟通内容..."
                className="flex-1 border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                onKeyDown={(e) => e.key === 'Enter' && msg.trim() && commMutation.mutate(msg.trim())}
              />
              <button
                onClick={() => msg.trim() && commMutation.mutate(msg.trim())}
                disabled={commMutation.isPending}
                className="w-9 h-9 rounded-full bg-teal-700 flex items-center justify-center hover:bg-teal-800 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>

        <div className="col-span-5">
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-teal-600" />
              复核结论
            </h3>
            {fall.reviewConclusion ? (
              <div className="space-y-4">
                <div>
                  <span className="text-xs text-slate-400">复核人</span>
                  <p className="text-sm font-medium text-slate-700 mt-0.5">{fall.reviewConclusion.reviewerName}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">结论</span>
                  <p className="text-sm text-slate-700 mt-0.5">{fall.reviewConclusion.conclusion}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">行动计划</span>
                  <p className="text-sm text-slate-700 mt-0.5">{fall.reviewConclusion.actionPlan}</p>
                </div>
                {fall.reviewConclusion.followUpDate && (
                  <div>
                    <span className="text-xs text-slate-400">跟进日期</span>
                    <p className="text-sm text-slate-700 mt-0.5 font-mono">{fall.reviewConclusion.followUpDate}</p>
                  </div>
                )}
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  reviewMutation.mutate(reviewForm)
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs text-slate-400 mb-1">结论</label>
                  <textarea
                    value={reviewForm.conclusion}
                    onChange={(e) => setReviewForm({ ...reviewForm, conclusion: e.target.value })}
                    rows={2}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">行动计划</label>
                  <textarea
                    value={reviewForm.actionPlan}
                    onChange={(e) => setReviewForm({ ...reviewForm, actionPlan: e.target.value })}
                    rows={2}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">跟进日期</label>
                  <input
                    type="date"
                    value={reviewForm.followUpDate}
                    onChange={(e) => setReviewForm({ ...reviewForm, followUpDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={reviewMutation.isPending}
                  className="w-full py-2 rounded-full bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 transition-colors disabled:opacity-50"
                >
                  提交复核
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
