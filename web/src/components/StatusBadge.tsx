import { clsx } from 'clsx'

const colorMap: Record<string, Record<string, string>> = {
  reminder: {
    PENDING: 'bg-slate-100 text-slate-600',
    IN_PROGRESS: 'bg-teal-100 text-teal-700',
    COMPLETED: 'bg-green-100 text-green-700',
    MISSED: 'bg-red-100 text-red-700',
    REFUSED: 'bg-orange-100 text-orange-700',
    ADVERSE_REACTION: 'bg-red-100 text-red-700',
  },
  fall: {
    REPORTED: 'bg-slate-100 text-slate-600',
    IN_REVIEW: 'bg-teal-100 text-teal-700',
    REVIEWED: 'bg-blue-100 text-blue-700',
    CLOSED: 'bg-green-100 text-green-700',
  },
  risk: {
    HIGH: 'bg-red-100 text-red-700',
    MEDIUM: 'bg-orange-100 text-orange-700',
    LOW: 'bg-yellow-100 text-yellow-700',
  },
}

const labelMap: Record<string, string> = {
  PENDING: '待执行',
  IN_PROGRESS: '执行中',
  COMPLETED: '已完成',
  MISSED: '已遗漏',
  REFUSED: '已拒绝',
  ADVERSE_REACTION: '不良反应',
  REPORTED: '已报告',
  IN_REVIEW: '复核中',
  REVIEWED: '已复核',
  CLOSED: '已关闭',
  HIGH: '高危',
  MEDIUM: '中危',
  LOW: '低危',
}

interface StatusBadgeProps {
  status: string
  variant: 'reminder' | 'fall' | 'risk'
  pulse?: boolean
}

export default function StatusBadge({ status, variant, pulse }: StatusBadgeProps) {
  const colors = colorMap[variant]?.[status] ?? 'bg-slate-100 text-slate-600'
  const label = labelMap[status] ?? status

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        colors,
        pulse && 'animate-pulse'
      )}
    >
      {label}
    </span>
  )
}
