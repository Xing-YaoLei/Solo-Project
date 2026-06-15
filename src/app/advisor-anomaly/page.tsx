'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts'
import { advisorAnomalies } from '@/lib/mock-data'
import { ArrowLeft, SlidersHorizontal, CheckCircle, AlertTriangle } from 'lucide-react'
import RefreshIndicator from '@/components/dashboard/RefreshIndicator'

const departments = ['全部', '计算机科学学院', '数学与统计学院', '经济管理学院', '外国语学院']

const scatterData = advisorAnomalies.map((a) => ({
  x: a.totalReviews,
  y: a.anomalyRate,
  z: a.totalReviews,
  name: a.advisorName,
  department: a.department,
  isAnomaly: a.anomalyRate > 10,
  advisorId: a.advisorId,
}))

interface ScatterTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: { name: string; x: number; y: number; isAnomaly: boolean; department: string } }>
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
      <p>异常率: {d.y}%</p>
      <p>院系: {d.department}</p>
      {d.isAnomaly && <p style={{ color: '#F87171' }}>⚠ 异常导师</p>}
    </div>
  )
}

function AnomalyDot(props: { cx?: number; cy?: number; payload?: { isAnomaly: boolean; y: number }; threshold: number; r?: number }) {
  const { cx, cy, payload, threshold } = props
  if (!cx || !cy || !payload) return null
  const isAboveThreshold = payload.isAnomaly && payload.y >= threshold
  const isAnomaly = payload.isAnomaly
  return (
    <g>
      {isAboveThreshold && (
        <circle cx={cx} cy={cy} r={12} fill="#EF4444" opacity={0.2} className="animate-pulse-dot" />
      )}
      <circle
        cx={cx}
        cy={cy}
        r={isAnomaly ? 7 : 5}
        fill={isAnomaly ? '#EF4444' : '#1B2A4A'}
        stroke="#FFFFFF"
        strokeWidth={1.5}
      />
    </g>
  )
}

export default function AdvisorAnomalyPage() {
  const [selectedDepartment, setSelectedDepartment] = useState('全部')
  const [threshold, setThreshold] = useState(10)
  const [handledIds, setHandledIds] = useState<Set<string>>(new Set())

  const filteredScatter = useMemo(() => {
    if (selectedDepartment === '全部') return scatterData
    return scatterData.filter((d) => d.department === selectedDepartment)
  }, [selectedDepartment])

  const anomalousAdvisors = useMemo(() => {
    return advisorAnomalies.filter((a) => {
      const matchDept = selectedDepartment === '全部' || a.department === selectedDepartment
      return matchDept && a.anomalyRate >= threshold
    })
  }, [selectedDepartment, threshold])

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
          导师名额异常标注
        </h1>
        <div className="ml-auto">
          <RefreshIndicator />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--slate)' }}>院系</span>
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

        <div className="flex items-center gap-3">
          <SlidersHorizontal size={14} style={{ color: 'var(--slate)' }} />
          <span className="text-xs" style={{ color: 'var(--slate)' }}>异常率阈值</span>
          <input
            type="range"
            min={5}
            max={25}
            step={1}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-40"
          />
          <span className="text-sm font-semibold min-w-[40px]" style={{ color: 'var(--navy)' }}>
            {threshold}%
          </span>
        </div>
      </div>

      <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: 'var(--bg-card)' }}>
        <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--navy)' }}>
          异常分布散点图
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="x"
              name="学生数"
              tick={{ fontSize: 12 }}
              stroke="var(--slate)"
              label={{ value: '名下学生数', position: 'insideBottomRight', offset: -5, fontSize: 12, fill: '#64748B' }}
            />
            <YAxis
              dataKey="y"
              name="异常率"
              tick={{ fontSize: 12 }}
              stroke="var(--slate)"
              label={{ value: '异常率(%)', angle: -90, position: 'insideLeft', offset: 10, fontSize: 12, fill: '#64748B' }}
            />
            <ZAxis dataKey="z" range={[80, 250]} />
            <Tooltip content={<ScatterTooltip />} />
            <Scatter
              data={filteredScatter}
              shape={<AnomalyDot threshold={threshold} />}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl p-6 shadow-sm" style={{ backgroundColor: 'var(--bg-card)' }}>
        <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--navy)' }}>
          异常导师列表
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-primary)' }}>
              <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--slate)' }}>导师姓名</th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--slate)' }}>院系</th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--slate)' }}>复核次数</th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--slate)' }}>异常数</th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--slate)' }}>异常率</th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--slate)' }}>近期异常</th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--slate)' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {anomalousAdvisors.map((advisor) => {
              const isHandled = handledIds.has(advisor.advisorId)
              return (
                <tr key={advisor.advisorId} className="border-t" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-4 py-3 font-medium">{advisor.advisorName}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--slate)' }}>{advisor.department}</td>
                  <td className="px-4 py-3">{advisor.totalReviews}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold" style={{ color: '#EF4444' }}>{advisor.anomalyCount}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-semibold"
                      style={{
                        color: advisor.anomalyRate > 15 ? '#DC2626' : '#D97706',
                        backgroundColor: advisor.anomalyRate > 15 ? '#FEF2F2' : '#FFFBEB',
                      }}
                    >
                      {advisor.anomalyRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {advisor.recentAnomalies.map((anomaly, i) => (
                        <span
                          key={i}
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}
                        >
                          {anomaly}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {isHandled ? (
                      <span className="flex items-center gap-1 text-xs font-medium" style={{ color: '#059669' }}>
                        <CheckCircle size={14} />
                        已处理
                      </span>
                    ) : (
                      <button
                        onClick={() => setHandledIds((prev) => new Set(prev).add(advisor.advisorId))}
                        className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors duration-150"
                        style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}
                      >
                        <AlertTriangle size={12} />
                        标记处理
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
            {anomalousAdvisors.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-6" style={{ color: 'var(--slate)' }}>
                  当前阈值下无异常导师
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
