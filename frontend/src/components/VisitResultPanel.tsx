import { useState } from 'react'
import { Plus } from 'lucide-react'
import { api } from '@/api/client'
import type { VisitResult, Satisfaction } from '@/types'

const SATISFACTION_COLORS: Record<Satisfaction, string> = {
  '非常满意': 'bg-green-100 text-green-700',
  '满意': 'bg-blue-100 text-blue-700',
  '一般': 'bg-yellow-100 text-yellow-700',
  '不满意': 'bg-red-100 text-red-700',
}

const SATISFACTION_OPTIONS: Satisfaction[] = ['非常满意', '满意', '一般', '不满意']
const VISIT_METHODS = ['电话回访', '微信回访', '现场回访', '邮件回访']

interface VisitResultPanelProps {
  complaintId: string
  visitResults: VisitResult[]
  onRefresh: () => void
}

export default function VisitResultPanel({ complaintId, visitResults, onRefresh }: VisitResultPanelProps) {
  const [showForm, setShowForm] = useState(false)
  const [visitMethod, setVisitMethod] = useState('电话回访')
  const [visitorName, setVisitorName] = useState('')
  const [satisfaction, setSatisfaction] = useState<Satisfaction>('满意')
  const [feedback, setFeedback] = useState('')
  const [visitAt, setVisitAt] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.visitResults.create({
        complaint_id: complaintId,
        visit_method: visitMethod,
        visitor_name: visitorName,
        satisfaction,
        feedback: feedback || null,
        visit_at: visitAt,
      })
      setShowForm(false)
      setVisitorName('')
      setFeedback('')
      setVisitAt('')
      onRefresh()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-800">回访结果</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-md"
        >
          <Plus className="w-3.5 h-3.5" />
          新增
        </button>
      </div>

      {showForm && (
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">回访方式</label>
                <select
                  value={visitMethod}
                  onChange={e => setVisitMethod(e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {VISIT_METHODS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">回访人</label>
                <input
                  type="text"
                  value={visitorName}
                  onChange={e => setVisitorName(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">满意度</label>
                <select
                  value={satisfaction}
                  onChange={e => setSatisfaction(e.target.value as Satisfaction)}
                  className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {SATISFACTION_OPTIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">回访时间</label>
                <input
                  type="date"
                  value={visitAt}
                  onChange={e => setVisitAt(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">反馈内容</label>
              <textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                rows={2}
                className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? '提交中...' : '提交'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="divide-y divide-slate-100">
        {visitResults.length === 0 ? (
          <div className="px-4 py-6 text-sm text-slate-400 text-center">暂无回访记录</div>
        ) : (
          visitResults.map(vr => (
            <div key={vr.id} className="px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700">{vr.visitor_name}</span>
                  <span className="text-xs text-slate-400">{vr.visit_method}</span>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${SATISFACTION_COLORS[vr.satisfaction]}`}>
                  {vr.satisfaction}
                </span>
              </div>
              {vr.feedback && (
                <p className="text-sm text-slate-600 mt-1">{vr.feedback}</p>
              )}
              <p className="text-xs text-slate-400 mt-1">{vr.visit_at}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
