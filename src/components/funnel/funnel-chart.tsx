'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts'
import { FUNNEL_STAGES } from '@/lib/constants'
import type { FunnelStage } from '@/lib/types'

interface FunnelChartProps {
  stages: FunnelStage[]
  compact?: boolean
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-lg">
      <p className="text-sm font-medium text-navy-900">{data.label}</p>
      <p className="mt-1 font-mono text-lg font-bold text-navy-900">{data.count}</p>
      {data.conversionRate !== undefined && data.conversionRate !== null && (
        <p className="mt-0.5 text-xs text-slate-500">
          转化率: <span className="font-mono font-medium text-amber-600">{data.conversionRate}%</span>
        </p>
      )}
    </div>
  )
}

const FunnelChart: React.FC<FunnelChartProps> = ({ stages, compact = false }) => {
  const data = FUNNEL_STAGES.map((stageDef, index) => {
    const stageData = stages.find((s) => s.stage === stageDef.key)
    return {
      name: stageDef.key,
      label: stageDef.label,
      count: stageData?.count ?? 0,
      conversionRate: stageData?.conversionRate ?? 0,
      color: stageDef.color,
      fill: stageDef.color,
      isFirst: index === 0,
    }
  })

  const maxCount = Math.max(...data.map((d) => d.count), 1)

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={compact ? 180 : 320}>
        <BarChart
          data={data}
          layout="vertical"
          margin={compact ? { top: 5, right: 80, left: 5, bottom: 5 } : { top: 10, right: 100, left: 10, bottom: 10 }}
          barCategoryGap={compact ? 8 : 16}
        >
          <XAxis type="number" hide domain={[0, maxCount * 1.1]} />
          <YAxis type="category" dataKey="label" width={compact ? 60 : 80} tick={{ fontSize: compact ? 11 : 13, fill: '#1B2A4A' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={compact ? 20 : 36}>
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
            <LabelList
              dataKey={(row: any) => {
                if (row.isFirst) return `${row.count}`
                return `${row.count} (${row.conversionRate}%)`
              }}
              position="right"
              style={{ fontSize: compact ? 10 : 12, fill: '#64748B', fontFamily: 'DM Mono, monospace' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default FunnelChart
