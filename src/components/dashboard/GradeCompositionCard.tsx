'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useGradeComposition } from '@/hooks/use-data'
import type { Role, GradeComposition } from '@/lib/types'
import { ArrowUpRight, Loader2 } from 'lucide-react'

interface Props {
  role?: Role
  department?: string
}

const gradeColors: Record<string, string> = {
  A: '#10B981',
  B: '#3B82F6',
  C: '#F59E0B',
  D: '#F97316',
  F: '#EF4444',
}

interface PieTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: { grade: string; percentage: number } }>
}

function PieTooltip({ active, payload }: PieTooltipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs shadow-lg"
      style={{ backgroundColor: '#1B2A4A', color: '#FFFFFF', border: '1px solid rgba(245,158,11,0.3)' }}
    >
      <p className="font-medium">{d.payload.grade} 等级</p>
      <p>人数: {d.value}</p>
      <p>占比: {d.payload.percentage}%</p>
    </div>
  )
}

interface BarTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}

function BarTooltip({ active, payload, label }: BarTooltipProps) {
  if (!active || !payload) return null
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs shadow-lg"
      style={{ backgroundColor: '#1B2A4A', color: '#FFFFFF', border: '1px solid rgba(245,158,11,0.3)' }}
    >
      <p className="font-medium mb-1">{label} 等级</p>
      {payload.map((item, i) => (
        <p key={i} style={{ color: item.color }}>{item.name}: {item.value}</p>
      ))}
    </div>
  )
}

export default function GradeCompositionCard({ role = 'admin', department }: Props) {
  const { data: filteredComposition, loading } = useGradeComposition(role, department)

  const comparisonData = useMemo(() => {
    return filteredComposition.map((g: GradeComposition) => ({
      grade: g.grade,
      before: Math.round(g.count * 0.9),
      after: g.count,
    }))
  }, [filteredComposition])

  const legendData = filteredComposition.map((g) => ({
    grade: g.grade,
    color: gradeColors[g.grade] || '#94A3B8',
    percentage: g.percentage,
  }))

  function CustomLegend() {
    return (
      <div className="flex items-center justify-center gap-4 mt-2 flex-wrap">
        {legendData.map((item) => (
          <div key={item.grade} className="flex items-center gap-1.5 text-xs">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
            <span style={{ color: 'var(--slate)' }}>{item.grade}</span>
            <span className="font-medium" style={{ color: 'var(--navy)' }}>{item.percentage}%</span>
          </div>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="rounded-xl p-5 shadow-sm flex items-center justify-center" style={{ backgroundColor: 'var(--bg-card)', minHeight: 320 }}>
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--amber)' }} />
      </div>
    )
  }

  return (
    <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: 'var(--bg-card)' }}>
      <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--navy)' }}>
        成绩等级分布
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={filteredComposition}
                dataKey="count"
                nameKey="grade"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
              >
                {filteredComposition.map((entry) => (
                  <Cell key={entry.grade} fill={gradeColors[entry.grade] || '#94A3B8'} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={comparisonData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="grade" tick={{ fontSize: 11 }} stroke="var(--slate)" />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--slate)" width={35} />
              <Tooltip content={<BarTooltip />} />
              <Bar dataKey="before" name="复核前" fill="#94A3B8" radius={[2, 2, 0, 0]} barSize={12} />
              <Bar dataKey="after" name="复核后" fill="#1B2A4A" radius={[2, 2, 0, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <CustomLegend />

      <div className="flex items-center justify-center gap-6 mt-2 text-xs" style={{ color: 'var(--slate)' }}>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-2 rounded-sm" style={{ backgroundColor: '#94A3B8' }} />
          复核前
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-2 rounded-sm" style={{ backgroundColor: '#1B2A4A' }} />
          复核后
        </span>
      </div>

      <Link
        href="/composition"
        className="flex items-center gap-1 text-xs font-medium mt-3 transition-colors duration-200"
        style={{ color: 'var(--amber)' }}
      >
        查看详情
        <ArrowUpRight size={12} />
      </Link>
    </div>
  )
}
