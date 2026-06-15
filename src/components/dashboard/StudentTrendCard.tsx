'use client'

import Link from 'next/link'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { useTrendData } from '@/hooks/use-data'
import type { Role } from '@/lib/types'
import { ArrowUpRight, Loader2 } from 'lucide-react'

interface Props {
  role?: Role
  department?: string
}

interface TooltipPayloadItem {
  name: string
  value: number
  color: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload) return null
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs shadow-lg"
      style={{ backgroundColor: '#1B2A4A', color: '#FFFFFF', border: '1px solid rgba(245,158,11,0.3)' }}
    >
      <p className="font-medium mb-1">{label}</p>
      {payload.map((item, i) => (
        <p key={i} style={{ color: item.color }}>
          {item.name}: {item.value}
        </p>
      ))}
    </div>
  )
}

export default function StudentTrendCard({ role = 'admin', department }: Props) {
  const { data, loading } = useTrendData(role, department)

  const latest = data[data.length - 1] ?? { count: 0, semester: '' }
  const prev = data[data.length - 2]
  const momChange = prev && prev.count > 0 ? (((latest.count - prev.count) / prev.count) * 100).toFixed(1) : '0'
  const first = data[0]
  const yoyChange = first && first.count > 0 ? (((latest.count - first.count) / first.count) * 100).toFixed(1) : '0'

  if (loading) {
    return (
      <div className="rounded-xl p-5 shadow-sm flex items-center justify-center" style={{ backgroundColor: 'var(--bg-card)', minHeight: 320 }}>
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--amber)' }} />
      </div>
    )
  }

  return (
    <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: 'var(--bg-card)' }}>
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="text-base font-semibold" style={{ color: 'var(--navy)' }}>
            复核申请趋势
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--slate)' }}>
            最新学期申请数: <span className="font-semibold" style={{ color: 'var(--navy)' }}>{latest.count}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <span
            className="text-xs px-2 py-0.5 rounded font-medium"
            style={{ backgroundColor: '#FFFBEB', color: '#D97706' }}
          >
            同比 +{yoyChange}%
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded font-medium"
            style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}
          >
            环比 +{momChange}%
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="countGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1B2A4A" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#1B2A4A" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EF4444" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#EF4444" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="semester" tick={{ fontSize: 11 }} stroke="var(--slate)" />
          <YAxis tick={{ fontSize: 11 }} stroke="var(--slate)" />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="count" name="申请数" stroke="#1B2A4A" strokeWidth={2} fill="url(#countGradient)" dot={{ r: 3, fill: '#1B2A4A' }} />
          <Area type="monotone" dataKey="riskScore" name="风险分" stroke="#EF4444" strokeWidth={2} fill="url(#riskGradient)" dot={{ r: 3, fill: '#EF4444' }} />
        </AreaChart>
      </ResponsiveContainer>

      <Link
        href="/trend"
        className="flex items-center gap-1 text-xs font-medium mt-2 transition-colors duration-200"
        style={{ color: 'var(--amber)' }}
      >
        查看详情
        <ArrowUpRight size={12} />
      </Link>
    </div>
  )
}
