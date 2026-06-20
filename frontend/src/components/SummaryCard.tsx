import { cn } from '../lib/utils'

interface SummaryCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: { value: number; label: string }
  className?: string
}

export default function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  className,
}: SummaryCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 p-5',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          )}
          {trend && (
            <p
              className={cn(
                'mt-1 text-xs',
                trend.value >= 0 ? 'text-green-600' : 'text-red-600',
              )}
            >
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%{' '}
              {trend.label}
            </p>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 ml-4 text-gray-400">{icon}</div>
        )}
      </div>
    </div>
  )
}
