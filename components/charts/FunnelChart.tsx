'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  FunnelChart as RechartsFunnel,
  Funnel,
  LabelList,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { TrendingDown, ChevronRight, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn, formatCurrency, formatPercent } from '@/lib/utils'
import { useDashboardStore } from '@/store/useDashboardStore'
import type { FunnelDataPoint } from '@/types'

interface FunnelChartProps {
  data: FunnelDataPoint[]
  loading?: boolean
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B']

export function FunnelChart({ data, loading = false }: FunnelChartProps) {
  const [hoveredStage, setHoveredStage] = useState<string | null>(null)
  const { selectChartPoint, selectedChartPoint, routeId } = useDashboardStore()

  const chartData = useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      fill: COLORS[index % COLORS.length],
    }))
  }, [data])

  const handleStageClick = (entry: FunnelDataPoint) => {
    const pointId = `funnel-${entry.stage}-${routeId || 'all'}`
    const isSelected = selectedChartPoint === pointId
    selectChartPoint(isSelected ? null : null, isSelected ? null : 'funnel')
    selectChartPoint(isSelected ? null : pointId, isSelected ? null : 'funnel')
  }

  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-primary" />
            补贴漏斗分析
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-80 w-full" />
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-primary" />
          补贴漏斗分析
        </CardTitle>
        <Badge variant="secondary" className="gap-1">
          <Filter className="h-3 w-3" />
          {routeId ? '按路线' : '全部路线'}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsFunnel>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as FunnelDataPoint
                    return (
                      <div className="bg-card border border-border/50 rounded-lg p-3 shadow-xl">
                        <p className="font-display font-semibold text-sm">{item.stageLabel}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          订单数: <span className="font-mono text-foreground">{item.count.toLocaleString()}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          金额: <span className="font-mono text-foreground">{formatCurrency(item.amount)}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          转化率: <span className="font-mono text-foreground">{formatPercent(item.conversionRate)}</span>
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Funnel
                dataKey="count"
                data={chartData}
                isAnimationActive
                animationDuration={800}
              >
                <LabelList
                  dataKey="stageLabel"
                  position="right"
                  fill="#F8FAFC"
                  fontSize={12}
                  fontWeight={500}
                />
                <LabelList
                  dataKey="conversionRate"
                  position="right"
                  fill="#94A3B8"
                  fontSize={11}
                  formatter={(value: number) => formatPercent(value)}
                  offset={20}
                />
                {chartData.map((entry, index) => {
                  const pointId = `funnel-${entry.stage}-${routeId || 'all'}`
                  const isSelected = selectedChartPoint === pointId
                  const isHovered = hoveredStage === entry.stage
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.fill}
                      fillOpacity={isSelected || isHovered ? 1 : 0.7}
                      stroke={isSelected ? '#10B981' : 'transparent'}
                      strokeWidth={isSelected ? 3 : 0}
                      style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                      onMouseEnter={() => setHoveredStage(entry.stage)}
                      onMouseLeave={() => setHoveredStage(null)}
                      onClick={() => handleStageClick(entry)}
                    />
                  )
                })}
              </Funnel>
            </RechartsFunnel>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          {data.map((item, index) => {
            const pointId = `funnel-${item.stage}-${routeId || 'all'}`
            const isSelected = selectedChartPoint === pointId
            return (
              <motion.div
                key={item.stage}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className={cn(
                  'p-4 rounded-xl border cursor-pointer transition-all',
                  isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-border/50 bg-card/30 hover:bg-card/50 hover:border-border'
                )}
                onClick={() => handleStageClick(item)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{item.stageLabel}</span>
                  <ChevronRight className={cn('h-4 w-4 transition-transform', isSelected && 'rotate-90 text-primary')} />
                </div>
                <div className="mt-2 font-mono text-2xl font-bold">
                  {item.count.toLocaleString()}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {formatCurrency(item.amount)}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Badge
                    variant={item.conversionRate < 0.5 ? 'destructive' : item.conversionRate < 0.8 ? 'warning' : 'success'}
                    className="text-xs"
                  >
                    转化率 {formatPercent(item.conversionRate)}
                  </Badge>
                </div>
              </motion.div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
