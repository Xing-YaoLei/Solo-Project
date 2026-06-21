'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Wallet,
  FileCheck,
  Receipt,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Settings,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { FunnelChart } from '@/components/charts/FunnelChart'
import { DispatchDurationChart } from '@/components/charts/DispatchDurationChart'
import { ConclusionPanel } from '@/components/ConclusionPanel'
import { AlertList } from '@/components/AlertList'
import { DateRangePicker } from '@/components/DateRangePicker'
import { RouteSelector } from '@/components/RouteSelector'
import { useDashboardStore } from '@/store/useDashboardStore'
import { cn, formatCurrency, formatPercent } from '@/lib/utils'
import type { FunnelResponse, DispatchDurationResponse, FunnelDataPoint } from '@/types'

export default function DashboardPage() {
  const {
    startDate,
    endDate,
    routeId,
    funnelData,
    dispatchDurationData,
    threshold,
    setFunnelData,
    setDispatchDurationData,
    setTasks,
    setConclusions,
    showConclusionPanel,
  } = useDashboardStore()

  const [loading, setLoading] = useState(true)
  const [funnelLoading, setFunnelLoading] = useState(true)
  const [durationLoading, setDurationLoading] = useState(true)
  const [summary, setSummary] = useState<FunnelResponse['summary'] | null>(null)
  const [avgOverall, setAvgOverall] = useState(0)
  const [timeoutRate, setTimeoutRate] = useState(0)

  const fetchData = async () => {
    setLoading(true)
    setFunnelLoading(true)
    setDurationLoading(true)

    const params = new URLSearchParams({
      startDate,
      endDate,
      ...(routeId && { routeId }),
    })

    try {
      const [funnelRes, durationRes, tasksRes, conclusionsRes] = await Promise.all([
        fetch(`/api/funnel?${params}`),
        fetch(`/api/dispatch-duration?${params}`),
        fetch('/api/tasks?status=pending&status=processing&pageSize=20'),
        fetch('/api/conclusions'),
      ])

      if (funnelRes.ok) {
        const funnelData: FunnelResponse = await funnelRes.json()
        setFunnelData(funnelData.data)
        setSummary(funnelData.summary)
      }
      setFunnelLoading(false)

      if (durationRes.ok) {
        const durationData: DispatchDurationResponse = await durationRes.json()
        setDispatchDurationData(durationData.data, durationData.threshold)
        setAvgOverall(durationData.avgOverall)
        setTimeoutRate(durationData.timeoutRate)
      }
      setDurationLoading(false)

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json()
        setTasks(tasksData.data || [])
      }

      if (conclusionsRes.ok) {
        const conclusionsData = await conclusionsRes.json()
        setConclusions(conclusionsData.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      setFunnelLoading(false)
      setDurationLoading(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [startDate, endDate, routeId])

  const summaryCards = summary ? [
    {
      title: '补贴总预算',
      value: formatCurrency(summary.totalBudget),
      icon: Wallet,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      trend: '+12.5%',
      trendUp: true,
    },
    {
      title: '申诉金额',
      value: formatCurrency(summary.appealedAmount),
      icon: FileCheck,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      trend: '-8.3%',
      trendUp: false,
    },
    {
      title: '已结算金额',
      value: formatCurrency(summary.settledAmount),
      icon: Receipt,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      trend: '+15.2%',
      trendUp: true,
    },
    {
      title: '整体转化率',
      value: formatPercent(summary.overallConversion),
      icon: TrendingUp,
      color: summary.overallConversion < 0.6 ? 'text-rose-400' : 'text-emerald-400',
      bgColor: summary.overallConversion < 0.6 ? 'bg-rose-500/10' : 'bg-emerald-500/10',
      borderColor: summary.overallConversion < 0.6 ? 'border-rose-500/20' : 'border-emerald-500/20',
      trend: '+2.1%',
      trendUp: true,
    },
  ] : []

  return (
    <div className="relative">
      <div className="flex flex-col gap-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">
              补贴漏斗看板
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              补贴规则 → 申诉证据 → 结算明细 全链路追踪分析
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <DateRangePicker />
            <RouteSelector />
            <Button
              variant="outline"
              size="icon"
              onClick={fetchData}
              disabled={loading}
              className="shrink-0"
            >
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-32 mb-2" />
                  <Skeleton className="h-3 w-16" />
                </CardContent>
              </Card>
            ))
          ) : (
            summaryCards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Card className={cn('overflow-hidden border', card.borderColor)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">
                          {card.title}
                        </p>
                        <p className={cn('font-mono text-2xl font-bold mt-1', card.color)}>
                          {card.value}
                        </p>
                      </div>
                      <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', card.bgColor)}>
                        <card.icon className={cn('h-5 w-5', card.color)} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-3">
                      <Badge
                        variant={card.trendUp ? 'success' : 'destructive'}
                        className="text-xs"
                      >
                        {card.trend}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        较上月
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-2"
          >
            <FunnelChart data={funnelData} loading={funnelLoading} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="lg:col-span-1"
          >
            <AlertList loading={loading} />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <DispatchDurationChart
            data={dispatchDurationData}
            threshold={threshold}
            avgOverall={avgOverall}
            timeoutRate={timeoutRate}
            loading={durationLoading}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                漏斗分析说明
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span className="font-display font-semibold text-emerald-400">第一层：补贴规则</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    按路线和时间段配置的补贴规则，展示理论可补贴的订单总数和金额。
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                    <span className="font-display font-semibold text-blue-400">第二层：申诉证据</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    骑手实际申诉并提交证据的订单，需客服审核。转化率低表明申诉流程可能存在障碍。
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-3 w-3 rounded-full bg-amber-500" />
                    <span className="font-display font-semibold text-amber-400">第三层：结算明细</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    最终通过审核并完成结算的订单。与第二层对比可发现审核通过率问题。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <ConclusionPanel className={cn(showConclusionPanel && 'md:translate-x-0')} />
    </div>
  )
}
