import { cn, STATUS_LABELS, STATUS_COLORS } from '@/lib/utils'
import type { CleaningStatus } from '@/lib/types'

interface StatusBadgeProps {
  status: CleaningStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn('badge', STATUS_COLORS[status], className)}>
      {STATUS_LABELS[status]}
    </span>
  )
}

export { STATUS_LABELS, STATUS_COLORS }
