import {
  Plus, Send, Eye, MessageSquarePlus, Upload, CheckCircle2,
  XCircle, ArrowRightLeft, AlertTriangle, Lock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FlowLog, FlowAction } from '@/types'

const ACTION_CONFIG: Record<FlowAction, { icon: React.ElementType; color: string; label: string }> = {
  created: { icon: Plus, color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300', label: '创建' },
  submitted: { icon: Send, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300', label: '提交' },
  reviewing: { icon: Eye, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300', label: '审核中' },
  reviewed: { icon: Eye, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300', label: '开始审核' },
  claimed: { icon: CheckCircle2, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300', label: '已认领' },
  supplement_requested: { icon: MessageSquarePlus, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300', label: '请求补充' },
  supplement_uploaded: { icon: Upload, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300', label: '已补充' },
  approved: { icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300', label: '已通过' },
  rejected: { icon: XCircle, color: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300', label: '已驳回' },
  transferred: { icon: ArrowRightLeft, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300', label: '已转交' },
  escalated: { icon: AlertTriangle, color: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300', label: '已升级' },
  resolved: { icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300', label: '已解决' },
  closed: { icon: Lock, color: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400', label: '已关闭' },
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

interface FlowTimelineProps {
  logs: FlowLog[]
}

export default function FlowTimeline({ logs }: FlowTimelineProps) {
  if (logs.length === 0) {
    return <div className="py-8 text-center text-sm text-slate-400">暂无流程记录</div>
  }

  return (
    <div className="relative">
      {logs.map((log, index) => {
        const config = ACTION_CONFIG[log.action as FlowAction] ?? ACTION_CONFIG.created
        const Icon = config.icon
        const isLast = index === logs.length - 1

        return (
          <div key={log.id} className="relative flex gap-4 pb-6">
            <div className="relative flex flex-col items-center">
              <div className={cn('flex h-8 w-8 items-center justify-center rounded-full', config.color)}>
                <Icon size={16} />
              </div>
              {!isLast && (
                <div className="mt-1 h-full w-px bg-slate-200 dark:bg-slate-700" />
              )}
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{config.label}</span>
                <span className="text-xs text-slate-400">{formatTime(log.created_at)}</span>
              </div>
              <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                {log.operator_role} · {log.comment}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
