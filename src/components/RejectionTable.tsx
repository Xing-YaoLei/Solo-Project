import { AlertTriangle, CheckCircle2, Clock, MessageSquare } from 'lucide-react'
import type { RejectionRecord, RemarkTask } from '@/types'
import { cn } from '@/lib/utils'

interface RejectionTableProps {
  data: RejectionRecord[]
  onProcess: (id: string) => void
  onView: (id: string) => void
}

const statusConfig: Record<RemarkTask['status'], { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: '待处理', color: 'bg-amber-100 text-amber-700', icon: <Clock className="h-3.5 w-3.5" /> },
  processing: { label: '处理中', color: 'bg-blue-100 text-blue-700', icon: <MessageSquare className="h-3.5 w-3.5" /> },
  resolved: { label: '已解决', color: 'bg-green-100 text-green-700', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
}

function StatusBadge({ status }: { status: RemarkTask['status'] }) {
  const config = statusConfig[status]
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', config.color)}>
      {config.icon}
      {config.label}
    </span>
  )
}

export default function RejectionTable({ data, onProcess, onView }: RejectionTableProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <AlertTriangle className="mb-3 h-12 w-12" />
        <p className="text-sm">暂无拒付记录</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-3 text-left font-medium text-gray-600">序号</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">患者</th>
            <th className="px-4 py-3 text-right font-medium text-gray-600">拒付金额(元)</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">拒付原因</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">拒付日期</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">备注任务状态</th>
            <th className="px-4 py-3 text-center font-medium text-gray-600">操作</th>
          </tr>
        </thead>
        <tbody>
          {data.map((record, index) => {
            const status = record.remarkTask?.status ?? 'pending'
            return (
              <tr
                key={record.id}
                className={cn(
                  'border-b border-gray-100 transition-colors hover:bg-teal-50/40',
                  index % 2 === 1 ? 'bg-gray-50/50' : 'bg-white',
                )}
              >
                <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{record.patientName}</td>
                <td className="px-4 py-3 text-right font-mono text-red-600">
                  {record.rejectedAmount.toLocaleString()}
                </td>
                <td className="max-w-[200px] truncate px-4 py-3 text-gray-700">{record.rejectionReason}</td>
                <td className="px-4 py-3 text-gray-600">{record.rejectionDate}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={status} />
                </td>
                <td className="px-4 py-3 text-center">
                  {status === 'resolved' ? (
                    <button
                      onClick={() => onView(record.id)}
                      className="rounded-md px-3 py-1 text-xs font-medium text-teal-600 transition-colors hover:bg-teal-50"
                    >
                      查看
                    </button>
                  ) : (
                    <button
                      onClick={() => onProcess(record.id)}
                      className="rounded-md bg-teal-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-teal-700"
                    >
                      处理
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
