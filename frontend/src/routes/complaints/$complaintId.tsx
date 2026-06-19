import { useState, useEffect, useCallback } from 'react'
import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { ArrowLeft, Clock, AlertTriangle, Plus } from 'lucide-react'
import { api } from '@/api/client'
import StatusBadge from '@/components/StatusBadge'
import VisitResultPanel from '@/components/VisitResultPanel'
import ResponsibilityPanel from '@/components/ResponsibilityPanel'
import TagPanel from '@/components/TagPanel'
import { STATUS_LABELS, PRIORITY_LABELS, PRIORITY_COLORS } from '@/types'
import type { Complaint, ComplaintStatus, Review } from '@/types'

const STATUS_TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
  pending: ['processing'],
  processing: ['missing_materials', 'under_review', 'completed'],
  missing_materials: ['processing'],
  under_review: ['processing', 'completed'],
  completed: ['closed'],
  closed: [],
}

export const Route = createFileRoute('/complaints/$complaintId')({
  component: ComplaintDetailPage,
})

function ComplaintDetailPage() {
  const { complaintId } = useParams({ strict: false }) as { complaintId: string }
  const navigate = useNavigate()
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  const [showRecordForm, setShowRecordForm] = useState(false)
  const [recordAction, setRecordAction] = useState('')
  const [recordDesc, setRecordDesc] = useState('')
  const [recordHandlerName, setRecordHandlerName] = useState('')
  const [submittingRecord, setSubmittingRecord] = useState(false)

  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewTags, setReviewTags] = useState('')
  const [reviewSummary, setReviewSummary] = useState('')
  const [reviewMeasures, setReviewMeasures] = useState('')
  const [reviewerName, setReviewerName] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  const [transitioning, setTransitioning] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [c, r] = await Promise.all([
        api.complaints.get(complaintId),
        api.reviews.list(complaintId),
      ])
      setComplaint(c)
      setReviews(r)
    } catch {
      setComplaint(null)
    } finally {
      setLoading(false)
    }
  }, [complaintId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleStatusTransition = async (newStatus: ComplaintStatus) => {
    if (!complaint) return
    setTransitioning(true)
    try {
      await api.complaints.updateStatus(complaintId, newStatus)
      fetchData()
    } finally {
      setTransitioning(false)
    }
  }

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingRecord(true)
    try {
      await api.complaints.addHandlingRecord(complaintId, {
        action: recordAction,
        description: recordDesc,
        handler_name: recordHandlerName || null,
      })
      setShowRecordForm(false)
      setRecordAction('')
      setRecordDesc('')
      setRecordHandlerName('')
      fetchData()
    } finally {
      setSubmittingRecord(false)
    }
  }

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingReview(true)
    try {
      await api.reviews.create({
        complaint_id: complaintId,
        review_tags: reviewTags,
        summary: reviewSummary,
        improvement_measures: reviewMeasures || null,
        reviewer_name: reviewerName,
      })
      setShowReviewForm(false)
      setReviewTags('')
      setReviewSummary('')
      setReviewMeasures('')
      setReviewerName('')
      fetchData()
    } finally {
      setSubmittingReview(false)
    }
  }

  const isOverdue = (c: Complaint): boolean => {
    if (c.status === 'closed' || c.status === 'completed') return false
    const created = new Date(c.created_at)
    const now = new Date()
    const hours = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
    if (c.status === 'pending' && hours > 24) return true
    if (c.status === 'processing' && hours > 72) return true
    return false
  }

  if (loading) {
    return <div className="text-center py-12 text-slate-400">加载中...</div>
  }

  if (!complaint) {
    return <div className="text-center py-12 text-slate-400">未找到该客诉</div>
  }

  const transitions = STATUS_TRANSITIONS[complaint.status] || []

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate({ to: '/complaints' })}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold text-slate-800">{complaint.title}</h2>
          <StatusBadge status={complaint.status} />
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[complaint.priority]}`}>
            {PRIORITY_LABELS[complaint.priority]}
          </span>
        </div>
      </div>

      {isOverdue(complaint) && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-700 font-medium">该客诉处理超时，请尽快处理！</span>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 p-4 mb-4">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">基本信息</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-slate-500">投诉人</span>
            <p className="text-slate-800 font-medium">{complaint.complainant_name}</p>
          </div>
          <div>
            <span className="text-slate-500">联系方式</span>
            <p className="text-slate-800 font-medium">{complaint.complainant_contact}</p>
          </div>
          <div>
            <span className="text-slate-500">民宿名称</span>
            <p className="text-slate-800 font-medium">{complaint.homestay_name}</p>
          </div>
          <div>
            <span className="text-slate-500">房间号</span>
            <p className="text-slate-800 font-medium">{complaint.room_number || '-'}</p>
          </div>
          <div>
            <span className="text-slate-500">入住日期</span>
            <p className="text-slate-800 font-medium">{complaint.check_in_date}</p>
          </div>
          <div>
            <span className="text-slate-500">离店日期</span>
            <p className="text-slate-800 font-medium">{complaint.check_out_date || '-'}</p>
          </div>
          <div>
            <span className="text-slate-500">来源渠道</span>
            <p className="text-slate-800 font-medium">{complaint.source_channel}</p>
          </div>
          <div>
            <span className="text-slate-500">处理人</span>
            <p className="text-slate-800 font-medium">{complaint.handler_name || '未分配'}</p>
          </div>
        </div>
        {complaint.description && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <span className="text-slate-500 text-sm">描述</span>
            <p className="text-sm text-slate-700 mt-1">{complaint.description}</p>
          </div>
        )}
      </div>

      {transitions.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-4 mb-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">状态流转</h3>
          <div className="flex flex-wrap gap-2">
            {transitions.map(s => (
              <button
                key={s}
                onClick={() => handleStatusTransition(s)}
                disabled={transitioning}
                className="px-3 py-1.5 text-sm font-medium rounded-md border border-blue-300 text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition-colors"
              >
                转为{STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <VisitResultPanel
          complaintId={complaintId}
          visitResults={complaint.visit_results || []}
          onRefresh={fetchData}
        />
        <ResponsibilityPanel
          complaintId={complaintId}
          responsibilities={complaint.responsibilities || []}
          onRefresh={fetchData}
        />
        <TagPanel
          complaintId={complaintId}
          tags={complaint.tags || []}
          onRefresh={fetchData}
        />
      </div>

      <div className="bg-white rounded-lg border border-slate-200 mb-4">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800">处理记录</h3>
          <button
            onClick={() => setShowRecordForm(!showRecordForm)}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-md"
          >
            <Plus className="w-3.5 h-3.5" />
            添加
          </button>
        </div>
        {showRecordForm && (
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
            <form onSubmit={handleAddRecord} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">操作</label>
                  <input
                    type="text"
                    value={recordAction}
                    onChange={e => setRecordAction(e.target.value)}
                    required
                    placeholder="如：电话沟通、现场处理..."
                    className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">处理人<small className="text-slate-400 ml-1">(可选)</small></label>
                  <input
                    type="text"
                    value={recordHandlerName}
                    onChange={e => setRecordHandlerName(e.target.value)}
                    placeholder="填写处理人姓名"
                    className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">描述</label>
                <textarea
                  value={recordDesc}
                  onChange={e => setRecordDesc(e.target.value)}
                  required
                  rows={2}
                  className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowRecordForm(false)} className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50">取消</button>
                <button type="submit" disabled={submittingRecord} className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {submittingRecord ? '提交中...' : '提交'}
                </button>
              </div>
            </form>
          </div>
        )}
        <div className="px-4 py-3">
          {(complaint?.handling_records || []).length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">暂无处理记录</p>
          ) : (
            <div className="relative pl-6">
              <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-slate-200" />
              {(complaint?.handling_records || []).map(record => (
                <div key={record.id} className="relative mb-4 last:mb-0">
                  <div className="absolute -left-[18px] top-1 w-3 h-3 rounded-full bg-blue-400 border-2 border-white" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-700">{record.action}</p>
                      {record.handler_id && (
                        <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">处理人：{complaint.handler_name || '未知'}</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">{record.description}</p>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {record.created_at}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800">复盘记录</h3>
          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-md"
          >
            <Plus className="w-3.5 h-3.5" />
            添加
          </button>
        </div>
        {showReviewForm && (
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
            <form onSubmit={handleAddReview} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">复盘标签</label>
                  <input
                    type="text"
                    value={reviewTags}
                    onChange={e => setReviewTags(e.target.value)}
                    required
                    placeholder="如：流程缺陷、培训不足..."
                    className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">复盘人</label>
                  <input
                    type="text"
                    value={reviewerName}
                    onChange={e => setReviewerName(e.target.value)}
                    required
                    className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">总结 *</label>
                <textarea
                  value={reviewSummary}
                  onChange={e => setReviewSummary(e.target.value)}
                  required
                  rows={2}
                  className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">改进措施</label>
                <textarea
                  value={reviewMeasures}
                  onChange={e => setReviewMeasures(e.target.value)}
                  rows={2}
                  className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowReviewForm(false)} className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50">取消</button>
                <button type="submit" disabled={submittingReview} className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {submittingReview ? '提交中...' : '提交'}
                </button>
              </div>
            </form>
          </div>
        )}
        <div className="divide-y divide-slate-100">
          {reviews.length === 0 ? (
            <div className="px-4 py-6 text-sm text-slate-400 text-center">暂无复盘记录</div>
          ) : (
            reviews.map(r => (
              <div key={r.id} className="px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                      {r.review_tags}
                    </span>
                    <span className="text-sm font-medium text-slate-700">{r.reviewer_name}</span>
                  </div>
                  <span className="text-xs text-slate-400">{r.reviewed_at}</span>
                </div>
                <p className="text-sm text-slate-600 mt-1">{r.summary}</p>
                {r.improvement_measures && (
                  <div className="mt-2 p-2 bg-green-50 rounded-md">
                    <span className="text-xs font-medium text-green-700">改进措施：</span>
                    <p className="text-sm text-green-800 mt-0.5">{r.improvement_measures}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
