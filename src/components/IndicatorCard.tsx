import type { ReactNode } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface IndicatorCardProps {
  title: string
  value: string | number
  change: number
  unit?: string
  icon?: ReactNode
}

export default function IndicatorCard({ title, value, change, unit, icon }: IndicatorCardProps) {
  const isPositive = change >= 0

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 font-medium">{title}</span>
        {icon && <span className="text-teal-600">{icon}</span>}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        {unit && <span className="text-sm text-gray-400 mb-0.5">{unit}</span>}
      </div>
      <div className={cn('flex items-center gap-1 text-xs font-medium', isPositive ? 'text-emerald-600' : 'text-rose-600')}>
        {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        <span>
          同比 {isPositive ? '+' : ''}{change.toFixed(1)}%
        </span>
      </div>
    </div>
  )
}
