'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts'
import { useAdvisorAnomalies } from '@/hooks/use-data'
import type { Role } from '@/lib/types'
import { ArrowUpRight, Loader2, AlertTriangle, Users } from 'lucide-react'

interface Props {
  role?: Role
  department?: string
  advisorId?: string
  studentId?: string
}

interface ScatterTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: { name: string; x: number; y: number; isAnomaly: boolean } }>
}

function ScatterTooltip({ active, payload }: ScatterTooltipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs shadow-lg"
      style={{ backgroundColor: '#1B2A4A', color: '#FFFFFF', border: '1px solid rgba(245,158,11,0.3)' }}
    >
      <p className="font-medium">{d.name}</p>
      <p>学生数: {d.x}</p>
      <p>偏差值: {d.y}%</p>
      {d.isAnomaly && <p style={{ color: '#F87171' }}>⚠ 异常导师</p>}
    </div>
  )
}

function AnomalyDot(props: { cx?: number; cy?: number; payload?: { isAnomaly: boolean } }) {
  const { cx, cy, payload } = props
  if (!cx || !cy || !payload) return null
  const color = payload.isAnomaly ? '#EF4444' : '#1B2A4A'
  return (
    <g>
      {payload.isAnomaly && (
        <circle cx={cx} cy={cy} r={10} fill="#EF4444" opacity={0.2} className="animate-pulse-dot" />
      )}
      <circle cx={cx} cy={cy} r={payload.isAnomaly ? 6 : 4} fill={color} stroke="#FFFFFF" strokeWidth={1.5} />
    </g>
  )
}

export default function AdvisorAnomalyCard({ role = 'admin', department, advisorId, studentId }: Props) {
  const { data: filteredAnomalies, loading, error } = useAdvisorAnomalies(role, department, advisorId, studentId)

  const scatterData = useMemo(() => filteredAnomalies.map((a) => ({
    x: a.totalReviews,
    y: a.anomalyRate,
    name: a.advisorName,
    isAnomaly: a.anomalyRate > 10,
  })), [filteredAnomalies])

  const anomalousAdvisors = filteredAnomalies.filter((a) => a.anomalyRate > 10)

  if (loading) {
    return (
      <div className="rounded-xl p-5 shadow-sm flex items-center justify-center" style={{ backgroundColor: 'var(--bg-card)', minHeight: 320 }}>
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--amber)' }} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl p-5 shadow-sm flex flex-col items-center justify-center" style={{ backgroundColor: 'var(--bg-card)', minHeight: 320 }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: '#FEF2F2' }}>
          <AlertTriangle size={20} style={{ color: '#EF4444' }} />
        </div>
        <p className="text-sm font-medium" style={{ color: '#1E293B' }}>数据加载失败</p>
        <p className="text-xs mt-1 text-center" style={{ color: '#64748B' }}>{error}</p>
      </div>
    )
  }

  if (filteredAnomalies.length === 0) {
    return (
      <div className="rounded-xl p-5 shadow-sm flex flex-col items-center justify-center" style={{ backgroundColor: 'var(--bg-card)', minHeight: 320 }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: '#F8FAFC' }}>
          <Users size={20} style={{ color: '#94A3B8' }} />
        </div>
        <p className="text-sm font-medium" style={{ color: '#64748B' }}>暂无数据</p>
        <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>当前筛选条件下无记录</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: 'var(--bg-card)' }}>
      <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--navy)' }}>
        导师异常监测
      </h3>

      <ResponsiveContainer width="100%" height={180}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="x"
            name="学生数"
            tick={{ fontSize: 11 }}
            stroke="var(--slate)"
            label={{ value: '名下学生数', position: 'insideBottomRight', offset: -5, fontSize: 11, fill: '#64748B' }}
          />
          <YAxis
            dataKey="y"
            name="偏差值"
            tick={{ fontSize: 11 }}
            stroke="var(--slate)"
            label={{ value: '偏差值(%)', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: '#64748B' }}
          />
          <ZAxis range={[60, 200]} />
          <Tooltip content={<ScatterTooltip />} />
          <Scatter data={scatterData} shape={<AnomalyDot />} />
        </ScatterChart>
      </ResponsiveContainer>

      <div className="space-y-2 mt-3 max-h-32 overflow-y-auto">
        {anomalousAdvisors.map((advisor) => (
          <div
            key={advisor.advisorId}
            className="flex items-center justify-between p-2.5 rounded-lg"
            style={{ backgroundColor: 'var(--bg-primary)' }}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{advisor.advisorName}</span>
              <span className="text-xs" style={{ color: 'var(--slate)' }}>{advisor.department}</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-xs px-2 py-0.5 rounded font-semibold"
                style={{
                  color: advisor.anomalyRate > 15 ? '#DC2626' : '#D97706',
                  backgroundColor: advisor.anomalyRate > 15 ? '#FEF2F2' : '#FFFBEB',
                }}
              >
                {advisor.anomalyRate}%
              </span>
              <div className="flex flex-wrap gap-1">
                {advisor.recentAnomalies.slice(0, 2).map((anomaly, i) => (
                  <span
                    key={i}
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}
                  >
                    {anomaly}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Link
        href="/advisor-anomaly"
        className="flex items-center gap-1 text-xs font-medium mt-3 transition-colors duration-200"
        style={{ color: 'var(--amber)' }}
      >
        查看详情
        <ArrowUpRight size={12} />
      </Link>
    </div>
  )
}
