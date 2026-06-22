'use client'

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  REVIEW_OPINION_COLORS,
  CLOSURE_REASON_COLORS,
  TICKET_STATUS_COLORS,
} from '@/lib/constants'
import type { BoardGroupBy, BoardGroup } from '@/lib/types'

interface BoardChartProps {
  groupBy: BoardGroupBy
  groups: BoardGroup[]
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const data = payload[0]?.payload
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-sm font-medium text-navy-900">{data?.label ?? data?.name}</p>
      <p className="font-mono text-sm font-bold text-navy-900">{data?.count ?? data?.value}</p>
    </div>
  )
}

const ReviewOpinionChart: React.FC<{ groups: BoardGroup[] }> = ({ groups }) => {
  const data = groups.map((g) => ({
    name: g.label,
    value: g.count,
    color: (REVIEW_OPINION_COLORS as any)[g.key] ?? '#64748B',
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          iconSize={8}
          formatter={(value: string) => (
            <span className="text-xs text-slate-600">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

const ClosureReasonChart: React.FC<{ groups: BoardGroup[] }> = ({ groups }) => {
  const data = groups.map((g) => ({
    name: g.label,
    label: g.label,
    count: g.count,
    key: g.key,
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
        <YAxis hide />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={48}>
          {data.map((entry, index) => (
            <Cell key={index} fill={(CLOSURE_REASON_COLORS as any)[entry.key] ?? '#64748B'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

const StatusChart: React.FC<{ groups: BoardGroup[] }> = ({ groups }) => {
  const data = groups.map((g) => ({
    name: g.label,
    label: g.label,
    count: g.count,
    key: g.key,
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ top: 10, right: 40, left: 10, bottom: 10 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 12, fill: '#1B2A4A' }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={28}>
          {data.map((entry, index) => (
            <Cell key={index} fill={(TICKET_STATUS_COLORS as any)[entry.key] ?? '#64748B'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

const BoardChart: React.FC<BoardChartProps> = ({ groupBy, groups }) => {
  switch (groupBy) {
    case 'review_opinion':
      return <ReviewOpinionChart groups={groups} />
    case 'closure_reason':
      return <ClosureReasonChart groups={groups} />
    case 'status':
      return <StatusChart groups={groups} />
    default:
      return null
  }
}

export default BoardChart
