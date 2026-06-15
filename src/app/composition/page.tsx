'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { gradeComposition } from '@/lib/mock-data'
import { ArrowLeft, Maximize2 } from 'lucide-react'
import RefreshIndicator from '@/components/dashboard/RefreshIndicator'

const semesters = ['2022-2023-1', '2022-2023-2', '2023-2024-1', '2023-2024-2', '2024-2025-1']

const gradeColors: Record<string, string> = {
  A: '#10B981',
  B: '#3B82F6',
  C: '#F59E0B',
  D: '#F97316',
  F: '#EF4444',
}

const comparisonData = [
  { grade: 'A', before: 108, after: 120, change: 12 },
  { grade: 'B', before: 175, after: 180, change: 5 },
  { grade: 'C', before: 125, after: 110, change: -15 },
  { grade: 'D', before: 65, after: 60, change: -5 },
  { grade: 'F', before: 27, after: 30, change: 3 },
]

const maxChangeGrade = comparisonData.reduce((max, d) =>
  Math.abs(d.change) > Math.abs(max.change) ? d : max, comparisonData[0])

interface PieLabelProps {
  cx: number
  cy: number
  midAngle: number
  innerRadius: number
  outerRadius: number
  percent: number
  name: string
}

function renderPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: PieLabelProps) {
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 1.4
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fill="#64748B">
      {name} {(percent * 100).toFixed(0)}%
    </text>
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

export default function CompositionPage() {
  const [selectedSemester, setSelectedSemester] = useState('2024-2025-1')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-1 text-sm font-medium transition-colors duration-200"
          style={{ color: 'var(--amber)' }}
        >
          <ArrowLeft size={16} />
          返回
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--navy)' }}>
          成绩单构成
        </h1>
        <div className="ml-auto">
          <RefreshIndicator />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <select
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm border"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)', color: 'var(--navy)' }}
        >
          {semesters.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: 'var(--bg-card)' }}>
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--navy)' }}>
            成绩等级分布
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={gradeComposition}
                dataKey="count"
                nameKey="grade"
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={140}
                paddingAngle={3}
                label={renderPieLabel}
                labelLine={false}
              >
                {gradeComposition.map((entry) => (
                  <Cell key={entry.grade} fill={gradeColors[entry.grade]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: 'var(--bg-card)' }}>
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--navy)' }}>
            复核前后对比
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={comparisonData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="grade" tick={{ fontSize: 12 }} stroke="var(--slate)" />
              <YAxis tick={{ fontSize: 12 }} stroke="var(--slate)" />
              <Tooltip content={<BarTooltip />} />
              <Legend />
              <Bar dataKey="before" name="复核前" fill="#94A3B8" radius={[4, 4, 0, 0]} barSize={24} />
              <Bar dataKey="after" name="复核后" fill="#1B2A4A" radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: 'var(--bg-card)' }}>
        <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--navy)' }}>
          各等级变化汇总
        </h3>
        <div className="grid grid-cols-5 gap-4">
          {comparisonData.map((item) => (
            <div
              key={item.grade}
              className="rounded-lg p-4 text-center"
              style={{ backgroundColor: 'var(--bg-primary)' }}
            >
              <div
                className="text-lg font-bold mb-1"
                style={{ color: gradeColors[item.grade] }}
              >
                {item.grade}
              </div>
              <div className="text-xs mb-1" style={{ color: 'var(--slate)' }}>
                {item.before} → {item.after}
              </div>
              <div
                className="text-sm font-semibold"
                style={{ color: item.change > 0 ? '#10B981' : item.change < 0 ? '#EF4444' : 'var(--slate)' }}
              >
                {item.change > 0 ? '+' : ''}{item.change}人
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: '#FFFBEB' }}>
          <Maximize2 size={16} style={{ color: '#D97706' }} />
          <span className="text-sm" style={{ color: '#D97706' }}>
            复核变动最大等级：<strong>{maxChangeGrade.grade}</strong>（变化 {maxChangeGrade.change > 0 ? '+' : ''}{maxChangeGrade.change} 人）
          </span>
        </div>
      </div>
    </div>
  )
}
