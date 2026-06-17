'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getTrends, getAlerts } from '@/lib/api'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { AlertTriangle, TrendingDown, Users, Pill, DoorOpen, CheckSquare } from 'lucide-react'

type Period = 'week' | 'month'

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>('week')

  const { data: trends } = useQuery({
    queryKey: ['trends', period],
    queryFn: () => getTrends({ period }),
  })

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => getAlerts(),
  })

  const complianceCards = trends?.summary
    ? [
        { label: '综合合规率', value: trends.summary.overall, icon: TrendingDown, color: 'text-teal-600' },
        { label: '用药合规率', value: trends.summary.medication, icon: Pill, color: 'text-blue-600' },
        { label: '探访合规率', value: trends.summary.visit, icon: DoorOpen, color: 'text-purple-600' },
        { label: '活动合规率', value: trends.summary.activity, icon: CheckSquare, color: 'text-orange-600' },
      ]
    : []

  const chartData = trends?.chartData ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-800">趋势看板</h2>
        <div className="flex rounded-full border border-slate-200 overflow-hidden">
          <button
            onClick={() => setPeriod('week')}
            className={`px-4 py-1.5 text-sm font-medium transition-colors ${
              period === 'week' ? 'bg-teal-700 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            周
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-4 py-1.5 text-sm font-medium transition-colors ${
              period === 'month' ? 'bg-teal-700 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            月
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {complianceCards.map((card) => {
          const Icon = card.icon
          const pct = typeof card.value === 'number' ? card.value : 0
          return (
            <div key={card.label} className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-500">{card.label}</span>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div className="font-mono text-3xl font-bold text-slate-800">{pct}%</div>
              <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-600 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
        <h3 className="font-semibold text-slate-800 mb-4">合规趋势</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="medication" stroke="#0f766e" strokeWidth={2} name="用药合规" dot={false} />
              <Line type="monotone" dataKey="visit" stroke="#7c3aed" strokeWidth={2} name="探访合规" dot={false} />
              <Line type="monotone" dataKey="activity" stroke="#ea580c" strokeWidth={2} name="活动合规" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          预警通知
        </h3>
        {alerts.length > 0 ? (
          <div className="space-y-3">
            {alerts.map((alert: any, i: number) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-100 animate-fade-in-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  {alert.type === 'DECLINING' ? (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  ) : (
                    <Users className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-red-800">{alert.title}</p>
                  <p className="text-xs text-red-600 mt-0.5">{alert.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 text-sm">暂无预警</div>
        )}
      </div>
    </div>
  )
}
