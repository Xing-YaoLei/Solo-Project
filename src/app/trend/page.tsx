'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts'
import { trendData } from '@/lib/mock-data'
import { ArrowLeft, TrendingUp, AlertTriangle, BarChart3, Percent } from 'lucide-react'
import RefreshIndicator from '@/components/dashboard/RefreshIndicator'

const semesters = ['2022-2023-1', '2022-2023-2', '2023-2024-1', '2023-2024-2', '2024-2025-1']
const departments = ['计算机科学学院', '数学与统计学院', '经济管理学院', '外国语学院']

const departmentTrendData = semesters.map((semester, i) => ({
  semester,
  '计算机科学学院': [12, 15, 22, 25, 32][i],
  '数学与统计学院': [10, 12, 16, 20, 24][i],
  '经济管理学院': [8, 10, 14, 18, 20][i],
  '外国语学院': [6, 8, 10, 12, 13][i],
}))

const departmentColors: Record<string, string> = {
  '计算机科学学院': '#1B2A4A',
  '数学与统计学院': '#F59E0B',
  '经济管理学院': '#10B981',
  '外国语学院': '#8B5CF6',
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

export default function TrendPage() {
  const [selectedSemester, setSelectedSemester] = useState('2024-2025-1')
  const [selectedDepartment, setSelectedDepartment] = useState('计算机科学学院')

  const totalCount = trendData.reduce((sum, d) => sum + d.count, 0)
  const avgRisk = (trendData.reduce((sum, d) => sum + d.riskScore, 0) / trendData.length).toFixed(1)
  const peakSemester = trendData.reduce((max, d) => d.count > max.count ? d : max, trendData[0])
  const yoyChange = (
    ((trendData[trendData.length - 1].count - trendData[0].count) / trendData[0].count) * 100
  ).toFixed(1)

  const filteredData = selectedSemester === 'all'
    ? trendData
    : trendData

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
          学生名单趋势
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
        <select
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm border"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)', color: 'var(--navy)' }}
        >
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: 'var(--bg-card)' }}>
        <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--navy)' }}>
          复核申请与风险趋势
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="detailCountGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1B2A4A" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#1B2A4A" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="detailRiskGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EF4444" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#EF4444" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="semester" tick={{ fontSize: 12 }} stroke="var(--slate)" />
            <YAxis tick={{ fontSize: 12 }} stroke="var(--slate)" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area type="monotone" dataKey="count" name="申请数" stroke="#1B2A4A" strokeWidth={2} fill="url(#detailCountGradient)" dot={{ r: 4, fill: '#1B2A4A' }} />
            <Area type="monotone" dataKey="riskScore" name="风险分" stroke="#EF4444" strokeWidth={2} fill="url(#detailRiskGradient)" dot={{ r: 4, fill: '#EF4444' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: 'var(--bg-card)' }}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} style={{ color: 'var(--navy)' }} />
            <span className="text-xs" style={{ color: 'var(--slate)' }}>总申请数</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'var(--navy)' }}>{totalCount}</p>
        </div>
        <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: 'var(--bg-card)' }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} style={{ color: '#EF4444' }} />
            <span className="text-xs" style={{ color: 'var(--slate)' }}>平均风险分</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: '#EF4444' }}>{avgRisk}</p>
        </div>
        <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: 'var(--bg-card)' }}>
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={16} style={{ color: 'var(--amber)' }} />
            <span className="text-xs" style={{ color: 'var(--slate)' }}>峰值学期</span>
          </div>
          <p className="text-lg font-bold" style={{ color: 'var(--navy)' }}>{peakSemester.semester}</p>
        </div>
        <div className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: 'var(--bg-card)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Percent size={16} style={{ color: '#10B981' }} />
            <span className="text-xs" style={{ color: 'var(--slate)' }}>同比变化</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: '#10B981' }}>+{yoyChange}%</p>
        </div>
      </div>

      <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: 'var(--bg-card)' }}>
        <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--navy)' }}>
          院系对比趋势
        </h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={departmentTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="semester" tick={{ fontSize: 12 }} stroke="var(--slate)" />
            <YAxis tick={{ fontSize: 12 }} stroke="var(--slate)" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {departments.map((dept) => (
              <Line
                key={dept}
                type="monotone"
                dataKey={dept}
                stroke={departmentColors[dept]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
