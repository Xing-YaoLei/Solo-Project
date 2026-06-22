'use client'

import { type LucideIcon, Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  className?: string
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12', className)}>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
        <Icon className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-navy-900">{title}</h3>
      <p className="mt-1 max-w-xs text-center text-sm text-slate-500">{description}</p>
    </div>
  )
}

export default EmptyState
