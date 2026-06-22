'use client'

import { LineChart, Line, ResponsiveContainer, YAxis, XAxis } from 'recharts'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FirstResolutionCardProps {
  rate: number
  trend: Array<{ month: string; rate: number }>
  yoyChange?: number
  momChange?: number
}

const FirstResolutionCard: React.FC<FirstResolutionCardProps> = ({
  rate,
  trend,
  yoyChange,
  momChange,
}) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">首次解决率</p>
          <p className="mt-2 font-mono text-4xl font-bold text-navy-900">{rate}%</p>
          <div className="mt-3 flex items-center gap-4">
            {yoyChange !== undefined && (
              <div className={cn('flex items-center gap-1 text-xs font-medium', yoyChange >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                {yoyChange >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                <span>同比 {yoyChange >= 0 ? '+' : ''}{yoyChange}%</span>
              </div>
            )}
            {momChange !== undefined && (
              <div className={cn('flex items-center gap-1 text-xs font-medium', momChange >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                {momChange >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                <span>环比 {momChange >= 0 ? '+' : ''}{momChange}%</span>
              </div>
            )}
          </div>
        </div>
        <div className="h-20 w-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#D97706"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, fill: '#D97706' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default FirstResolutionCard
