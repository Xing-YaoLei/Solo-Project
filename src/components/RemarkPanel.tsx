import { useState, useEffect } from 'react'
import { X, CheckCircle2, Clock, MessageSquare, User } from 'lucide-react'
import type { RejectionRecord, RemarkTask } from '@/types'
import { cn } from '@/lib/utils'

interface RemarkPanelProps {
  rejection: RejectionRecord | null
  onClose: () => void
  onSubmitRemark: (rejectionId: string, data: { assignee: string; remark: string }) => void
  onSubmitConclusion: (rejectionId: string, conclusion: string) => void
}

const statusOptions: { value: RemarkTask['status']; label: string; icon: React.ReactNode }[] = [
  { value: 'pending', label: '待处理', icon: <Clock className="h-3.5 w-3.5" /> },
  { value: 'processing', label: '处理中', icon: <MessageSquare className="h-3.5 w-3.5" /> },
  { value: 'resolved', label: '已解决', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
]

export default function RemarkPanel({ rejection, onClose, onSubmitRemark, onSubmitConclusion }: RemarkPanelProps) {
  const [status, setStatus] = useState<RemarkTask['status']>('pending')
  const [assignee, setAssignee] = useState('')
  const [remark, setRemark] = useState('')
  const [conclusion, setConclusion] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isOpen = rejection !== null

  useEffect(() => {
    if (rejection) {
      setStatus(rejection.remarkTask?.status ?? 'pending')
      setAssignee(rejection.remarkTask?.assignee ?? '')
      setRemark(rejection.remark ?? '')
      setConclusion(rejection.remarkTask?.conclusion ?? rejection.conclusion ?? '')
    }
  }, [rejection])

  const handleSubmit = async () => {
    if (!rejection || submitting) return
    setSubmitting(true)
    try {
      if (status === 'processing') {
        onSubmitRemark(rejection.id, { assignee, remark })
      } else if (status === 'resolved') {
        onSubmitConclusion(rejection.id, conclusion)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = () => {
    if (status === 'processing') return assignee.trim() && remark.trim()
    if (status === 'resolved') return conclusion.trim()
    return false
  }

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/30 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full w-[420px] flex-col bg-white shadow-xl transition-transform duration-300',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {rejection && (
          <>
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h3 className="text-base font-semibold text-gray-900">拒付处理</h3>
              <button onClick={onClose} className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="mb-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">拒付信息</h4>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">患者</span>
                    <span className="font-medium text-gray-900">{rejection.patientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">拒付金额</span>
                    <span className="font-mono font-medium text-red-600">¥{rejection.rejectedAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">拒付原因</span>
                    <span className="max-w-[200px] text-right text-gray-900">{rejection.rejectionReason}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">拒付日期</span>
                    <span className="text-gray-900">{rejection.rejectionDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">当前状态</span>
                    <span className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      (rejection.remarkTask?.status ?? 'pending') === 'pending' && 'bg-amber-100 text-amber-700',
                      (rejection.remarkTask?.status ?? 'pending') === 'processing' && 'bg-blue-100 text-blue-700',
                      (rejection.remarkTask?.status ?? 'pending') === 'resolved' && 'bg-green-100 text-green-700',
                    )}>
                      {(rejection.remarkTask?.status ?? 'pending') === 'pending' && '待处理'}
                      {(rejection.remarkTask?.status ?? 'pending') === 'processing' && '处理中'}
                      {(rejection.remarkTask?.status ?? 'pending') === 'resolved' && '已解决'}
                    </span>
                  </div>
                </div>
              </div>

              {rejection.remarkTask && (
                <div className="mb-5 rounded-lg border border-blue-100 bg-blue-50 p-4">
                  <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-blue-600">任务记录</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-500">负责人</span>
                      <span className="font-medium text-blue-900">{rejection.remarkTask.assignee}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-500">创建时间</span>
                      <span className="text-blue-900">{rejection.remarkTask.createdAt}</span>
                    </div>
                    {rejection.remark && (
                      <div>
                        <span className="text-blue-500">备注内容</span>
                        <p className="mt-1 rounded bg-white/70 p-2 text-blue-900">{rejection.remark}</p>
                      </div>
                    )}
                    {rejection.conclusion && (
                      <div>
                        <span className="text-blue-500">处理结论</span>
                        <p className="mt-1 rounded bg-white/70 p-2 text-blue-900">{rejection.conclusion}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">处理状态</label>
                  <div className="grid grid-cols-3 gap-2">
                    {statusOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setStatus(opt.value)}
                        className={cn(
                          'flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm transition-all',
                          status === opt.value
                            ? 'border-teal-500 bg-teal-50 text-teal-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300',
                        )}
                      >
                        {opt.icon}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {(status === 'processing' || status === 'resolved') && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      <User className="mr-1 inline h-3.5 w-3.5" />
                      负责人
                    </label>
                    <input
                      type="text"
                      value={assignee}
                      onChange={(e) => setAssignee(e.target.value)}
                      placeholder="请输入负责人姓名"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                )}

                {status === 'processing' && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      <MessageSquare className="mr-1 inline h-3.5 w-3.5" />
                      处理备注
                    </label>
                    <textarea
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      placeholder="请填写处理备注，如：已联系收费处核实，正在补充材料..."
                      rows={4}
                      className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                )}

                {status === 'resolved' && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />
                      处理结论
                    </label>
                    <textarea
                      value={conclusion}
                      onChange={(e) => setConclusion(e.target.value)}
                      placeholder="请填写处理结论，如：已补充完整病历资料，费用已追回..."
                      rows={5}
                      className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 px-5 py-4">
              <button
                onClick={handleSubmit}
                disabled={!canSubmit() || submitting}
                className={cn(
                  'w-full rounded-md px-4 py-2.5 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
                  canSubmit() && !submitting
                    ? 'bg-teal-600 hover:bg-teal-700 focus:ring-teal-500'
                    : 'cursor-not-allowed bg-gray-300',
                )}
              >
                {submitting ? '提交中...' : status === 'processing' ? '提交备注' : status === 'resolved' ? '提交结论' : '请选择处理状态'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
