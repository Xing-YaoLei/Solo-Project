import { useState } from 'react'
import { X, CheckCircle2, Clock, MessageSquare } from 'lucide-react'
import type { RejectionRecord, RemarkTask } from '@/types'
import { cn } from '@/lib/utils'

interface RemarkPanelProps {
  rejection: RejectionRecord | null
  onClose: () => void
  onSubmit: (rejectionId: string, data: { status: RemarkTask['status']; conclusion: string }) => void
}

const statusOptions: { value: RemarkTask['status']; label: string; icon: React.ReactNode }[] = [
  { value: 'pending', label: '待处理', icon: <Clock className="h-3.5 w-3.5" /> },
  { value: 'processing', label: '处理中', icon: <MessageSquare className="h-3.5 w-3.5" /> },
  { value: 'resolved', label: '已解决', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
]

export default function RemarkPanel({ rejection, onClose, onSubmit }: RemarkPanelProps) {
  const [status, setStatus] = useState<RemarkTask['status']>(rejection?.remarkTask?.status ?? 'pending')
  const [conclusion, setConclusion] = useState(rejection?.remarkTask?.conclusion ?? '')

  const isOpen = rejection !== null

  const handleSubmit = () => {
    if (!rejection) return
    onSubmit(rejection.id, { status, conclusion })
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
          'fixed right-0 top-0 z-50 flex h-full w-[400px] flex-col bg-white shadow-xl transition-transform duration-300',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {rejection && (
          <>
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h3 className="text-base font-semibold text-gray-900">处理拒付备注</h3>
              <button onClick={onClose} className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="mb-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">拒付信息</h4>
                <div className="space-y-2 text-sm">
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
                </div>
              </div>

              {rejection.remarkTask && (
                <div className="mb-5 rounded-lg border border-blue-100 bg-blue-50 p-4">
                  <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-blue-600">当前备注信息</h4>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-500">负责人</span>
                      <span className="text-blue-900">{rejection.remarkTask.assignee}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-500">创建时间</span>
                      <span className="text-blue-900">{rejection.remarkTask.createdAt}</span>
                    </div>
                    {rejection.remarkTask.conclusion && (
                      <div>
                        <span className="text-blue-500">处理结论</span>
                        <p className="mt-1 rounded bg-white p-2 text-blue-900">{rejection.remarkTask.conclusion}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">处理状态</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as RemarkTask['status'])}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">处理结论</label>
                  <textarea
                    value={conclusion}
                    onChange={(e) => setConclusion(e.target.value)}
                    placeholder="请填写处理结论..."
                    rows={4}
                    className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                {rejection.remarkTask && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="mb-1 text-xs font-medium text-gray-500">负责人</p>
                    <p className="text-sm text-gray-900">{rejection.remarkTask.assignee}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 px-5 py-4">
              <button
                onClick={handleSubmit}
                className="w-full rounded-md bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                提交
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
