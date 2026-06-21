'use client'

import { useState, useMemo } from 'react'
import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  AreaChart,
  ComposedChart,
  Bar,
  Cell,
} from 'recharts'
import { Clock, AlertTriangle, TrendingUp, MessageSquare } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn, formatDuration, formatPercent, formatShortDate } from '@/lib/utils'
import { useDashboardStore } from '@/store/useDashboardStore'
import type { DispatchDurationPoint } from '@/types'

interface DispatchDurationChartProps {
  data: DispatchDurationPoint[]
  threshold: number
  avgOverall: number
  timeoutRate: number
  loading?: boolean
}

export function DispatchDurationChart({
  data,
  threshold,
  avgOverall,
  timeoutRate,
  loading = false,
}: DispatchDurationChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null)
  const { selectChartPoint, selectedChartPoint, routeId, conclusions } = useDashboardStore()

  const chartData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      isTimeout: item.avgDuration > threshold,
      dateLabel: formatShortDate(item.date),
    }))
  }, [data, threshold])

  const handlePointClick = (point: DispatchDurationPoint) => {
    const pointId = `dispatch-${point.date}-${routeId || 'all'}`
    const isSelected = selectedChartPoint === pointId
    selectChartPoint(isSelected ? null : pointId, isSelected ? null : 'dispatch_trend')
  }

  const pointHasConclusion = (date: string) => {
    const pointId = `dispatch-${date}-${routeId || 'all'}`
    return conclusions.some(c => c.chartPointId === pointId)
  }

  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-accent" />
            派单时长趋势
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-72 w-full" />
          <div className="grid grid-cols-3 gap-4 mt-4">
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-accent" />
            派单时长趋势
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            阈值: <span className="font-mono text-destructive">{formatDuration(threshold)}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="warning" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            超时率 {formatPercent(timeoutRate)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis
                dataKey="dateLabel"
                stroke="#94A3B8"
                tick={{ fill: '#94A3B8', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94A3B8"
                tick={{ fill: '#94A3B8', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${Math.floor(value / 60)}m`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as DispatchDurationPoint & { isTimeout: boolean }
                    return (
                      <div className="bg-card border border-border/50 rounded-lg p-3 shadow-xl">
                        <p className="font-display font-semibold text-sm">{label}</p>
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-muted-foreground">
                            平均时长: <span className={cn('font-mono', item.isTimeout ? 'text-destructive' : 'text-foreground')}>
                              {formatDuration(item.avgDuration)}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            订单数: <span className="font-mono text-foreground">{item.orderCount}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            超时订单: <span className="font-mono text-destructive">{item.timeoutCount}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            最长: <span className="font-mono text-foreground">{formatDuration(item.maxDuration)}</span>
                          </p>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <ReferenceLine
                y={threshold}
                stroke="#EF4444"
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{
                  value: `阈值 ${Math.floor(threshold / 60)}分钟`,
                  fill: '#EF4444',
                  fontSize: 11,
                  position: 'insideTopRight',
                }}
              />
              <Area
                type="monotone"
                dataKey="avgDuration"
                stroke="transparent"
                fill="url(#colorDuration)"
                animationDuration={800}
              />
              <Line
                type="monotone"
                dataKey="avgDuration"
                stroke="#3B82F6"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#0F172A' }}
                activeDot={{ r: 6, fill: '#3B82F6', strokeWidth: 2, stroke: '#F8FAFC' }}
                animationDuration={800}
              />
              <Bar dataKey="timeoutCount" barSize={4} radius={[2, 2, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`bar-${index}`}
                    fill="#EF4444"
                    fillOpacity={entry.timeoutCount > 0 ? 0.6 : 0}
                  />
                ))}
              </Bar>
              {chartData.map((entry, index) => {
                const pointId = `dispatch-${entry.date}-${routeId || 'all'}`
                const isSelected = selectedChartPoint === pointId
                const hasConclusion = pointHasConclusion(entry.date)
                if (!hasConclusion) return null
                return (
                  <ReferenceLine
                    key={`conclusion-${index}`}
                    x={entry.dateLabel}
                    stroke="#10B981"
                    strokeWidth={2}
                    strokeDasharray="3 3"
                  />
                )
              })}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20"
          >
            <div className="flex items-center gap-2 text-xs text-blue-400">
              <TrendingUp className="h-3 w-3" />
              平均时长
            </div>
            <div className="mt-1 font-mono text-xl font-bold text-blue-400">
              {formatDuration(avgOverall)}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-3 rounded-lg bg-red-500/10 border border-red-500/20"
          >
            <div className="flex items-center gap-2 text-xs text-red-400">
              <AlertTriangle className="h-3 w-3" />
              超时率
            </div>
            <div className="mt-1 font-mono text-xl font-bold text-red-400">
              {formatPercent(timeoutRate)}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-3 rounded-lg bg-green-500/10 border border-green-500/20"
          >
            <div className="flex items-center gap-2 text-xs text-green-400">
              <MessageSquare className="h-3 w-3" />
              处理结论
            </div>
            <div className="mt-1 font-mono text-xl font-bold text-green-400">
              {conclusions.filter(c => c.chartType === 'dispatch_trend').length}
            </div>
          </motion.div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <AnimatePresence>
            {chartData
              .filter(d => d.avgDuration > threshold)
              .slice(0, 5)
              .map((point, index) => {
                const pointId = `dispatch-${point.date}-${routeId || 'all'}`
                const isSelected = selectedChartPoint === pointId
                const hasConclusion = pointHasConclusion(point.date)
                return (
                  <motion.div
                    key={point.date}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                  >
                    <Button
                      variant={isSelected ? 'default' : 'secondary'}
                      size="sm"
                      className={cn(
                        'gap-2 text-xs h-8',
                        isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                      )}
                      onClick={() => handlePointClick(point)}
                    >
                      <AlertTriangle className="h-3 w-3 text-destructive" />
                      {point.dateLabel}
                      <span className="font-mono text-destructive">
                        +{formatDuration(point.avgDuration - threshold)}
                      </span>
                      {hasConclusion && (
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                      )}
                    </Button>
                  </motion.div>
                )
              })}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}
