'use client'

import { cn } from '@/lib/utils'

type StatusVariant =
  | 'pending_remediation'
  | 'in_remediation'
  | 'pending_review'
  | 'closed'
  | 'approved'
  | 'rejected'
  | 'returned'

interface StatusBadgeProps {
  status: StatusVariant
}

const variantConfig: Record<StatusVariant, { label: string; className: string }> = {
  pending_remediation: {
    label: '待整改',
    className: 'bg-slate-100 text-slate-600',
  },
  in_remediation: {
    label: '整改中',
    className: 'bg-amber-100 text-amber-700',
  },
  pending_review: {
    label: '待审核',
    className: 'bg-blue-100 text-blue-700',
  },
  closed: {
    label: '已关闭',
    className: 'bg-emerald-100 text-emerald-700',
  },
  approved: {
    label: '已通过',
    className: 'bg-emerald-100 text-emerald-700',
  },
  rejected: {
    label: '已驳回',
    className: 'bg-rose-100 text-rose-700',
  },
  returned: {
    label: '已退回',
    className: 'bg-amber-100 text-amber-700',
  },
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = variantConfig[status]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.className
      )}
    >
      {config.label}
    </span>
  )
}

export default StatusBadge
