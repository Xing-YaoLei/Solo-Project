import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KPICardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: 'up' | 'down'
  trendValue?: string
  color?: string
}

const COLOR_MAP: Record<string, string> = {
  primary: 'from-primary-600 to-primary-800',
  accent: 'from-accent-500 to-accent-700',
  emerald: 'from-emerald-500 to-emerald-700',
  blue: 'from-blue-500 to-blue-700',
  purple: 'from-purple-500 to-purple-700',
}

export default function KPICard({ title, value, icon: Icon, trend, trendValue, color = 'primary' }: KPICardProps) {
  const gradientClass = COLOR_MAP[color] ?? COLOR_MAP.primary

  return (
    <div className={cn('relative overflow-hidden rounded-xl bg-gradient-to-br p-5 text-white shadow-sm', gradientClass)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-white/80">{title}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
          {trend && trendValue && (
            <div className="mt-2 flex items-center gap-1 text-xs text-white/70">
              {trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className="rounded-lg bg-white/20 p-2.5">
          <Icon size={24} />
        </div>
      </div>
    </div>
  )
}
