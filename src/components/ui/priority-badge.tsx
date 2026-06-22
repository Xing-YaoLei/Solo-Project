'use client'

import { cn } from '@/lib/utils'

type PriorityVariant = 'high' | 'medium' | 'low'

interface PriorityBadgeProps {
  priority: PriorityVariant
}

const variantConfig: Record<PriorityVariant, { label: string; className: string }> = {
  high: {
    label: '高',
    className: 'bg-rose-100 text-rose-700',
  },
  medium: {
    label: '中',
    className: 'bg-amber-100 text-amber-700',
  },
  low: {
    label: '低',
    className: 'bg-slate-100 text-slate-600',
  },
}

const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const config = variantConfig[priority]

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

export default PriorityBadge
