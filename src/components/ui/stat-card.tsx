'use client'

import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  trend?: 'up' | 'down'
  trendPercent?: number
  className?: string
}

const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  label,
  value,
  trend,
  trendPercent,
  className,
}) => {
  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white p-5 shadow-sm', className)}>
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-900">
          <Icon className="h-5 w-5 text-white" />
        </div>
        {trend && trendPercent !== undefined && (
          <div
            className={cn(
              'flex items-center gap-1 text-xs font-medium',
              trend === 'up' ? 'text-emerald-600' : 'text-rose-600'
            )}
          >
            {trend === 'up' ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            <span>{trendPercent}%</span>
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="font-mono text-2xl font-bold text-navy-900">{value}</p>
        <p className="mt-1 text-sm text-slate-500">{label}</p>
      </div>
    </div>
  )
}

export default StatCard
