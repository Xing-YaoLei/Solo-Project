import { cn } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  claimed: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  draft: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  default: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  reviewing: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  in_review: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  expired: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  supplement_needed: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  supplement_requested: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  transferred: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  escalated: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  closed: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400',
  resolved: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400',
}

const STATUS_LABELS: Record<string, string> = {
  pending: '待处理',
  claimed: '已认领',
  draft: '草稿',
  default: '默认',
  active: '生效中',
  pending_approval: '待审批',
  approved: '已通过',
  paid: '已支付',
  reviewing: '审核中',
  in_review: '审核中',
  in_progress: '处理中',
  rejected: '已驳回',
  expired: '已过期',
  supplement_needed: '需补充',
  supplement_requested: '请求补充',
  transferred: '已转交',
  escalated: '已升级',
  closed: '已关闭',
  resolved: '已解决',
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const colorClass = STATUS_COLORS[status] ?? STATUS_COLORS.default
  const label = STATUS_LABELS[status] ?? status

  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', colorClass, className)}>
      {label}
    </span>
  )
}
