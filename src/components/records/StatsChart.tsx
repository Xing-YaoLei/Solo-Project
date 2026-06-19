import { useEffect, useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { TrendingUp, BarChart3, Radar } from 'lucide-react'
import { useRecordsStore } from '@/stores/useRecordsStore'
import type { OnTimeRateBreakdown } from '@/types/records'

interface StatsChartProps {
  trendData?: { date: string; rate: number }[]
  breakdown?: OnTimeRateBreakdown
  abilityData?: { ability: string; value: number }[]
}

export default function StatsChart({ trendData, breakdown, abilityData }: StatsChartProps) {
  const stats = useRecordsStore((s) => s.stats)
  const fetchRecords = useRecordsStore((s) => s.fetchRecords)

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  const defaultTrendData = useMemo(() => {
    if (trendData && trendData.length > 0) return trendData
    return Array.from({ length: 7 }, (_, i) => ({
      date: `第${i + 1}天`,
      rate: 60 + Math.floor(Math.random() * 35),
    }))
  }, [trendData])

  const defaultBreakdown = useMemo(() => {
    if (breakdown) return breakdown
    return {
      evidence: 78,
      tag: 85,
      calendar: 62,
      task: 71,
      trend: defaultTrendData,
    }
  }, [breakdown, defaultTrendData])

  const defaultAbilityData = useMemo(() => {
    if (abilityData && abilityData.length > 0) return abilityData
    return [
      { ability: '证据识别', value: stats?.averageOnTimeRate ?? 75 },
      { ability: '标签分析', value: defaultBreakdown.tag },
      { ability: '日历调度', value: defaultBreakdown.calendar },
      { ability: '任务分配', value: defaultBreakdown.task },
      { ability: '响应速度', value: 68 },
      { ability: '综合判断', value: 72 },
    ]
  }, [abilityData, stats, defaultBreakdown])

  const trendOption = useMemo(
    () => ({
      tooltip: {
        trigger: 'axis',
        formatter: (params: Array<{ name: string; value: number }>) =>
          `${params[0].name}<br/>准时率: ${params[0].value}%`,
      },
      grid: { left: 40, right: 20, top: 20, bottom: 30 },
      xAxis: {
        type: 'category',
        data: defaultTrendData.map((d) => d.date),
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#6b7280', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#f3f4f6' } },
        axisLabel: { color: '#6b7280', fontSize: 11, formatter: '{value}%' },
      },
      series: [
        {
          data: defaultTrendData.map((d) => d.rate),
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: '#6366f1', width: 3 },
          itemStyle: { color: '#6366f1' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(99, 102, 241, 0.25)' },
                { offset: 1, color: 'rgba(99, 102, 241, 0.02)' },
              ],
            },
          },
        },
      ],
    }),
    [defaultTrendData]
  )

  const barOption = useMemo(
    () => ({
      tooltip: {
        trigger: 'axis',
        formatter: (params: Array<{ name: string; value: number }>) =>
          `${params[0].name}<br/>准时率: ${params[0].value}%`,
      },
      grid: { left: 40, right: 20, top: 20, bottom: 30 },
      xAxis: {
        type: 'category',
        data: ['证据识别', '标签分析', '日历调度', '任务分配'],
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#6b7280', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#f3f4f6' } },
        axisLabel: { color: '#6b7280', fontSize: 11, formatter: '{value}%' },
      },
      series: [
        {
          type: 'bar',
          data: [
            defaultBreakdown.evidence,
            defaultBreakdown.tag,
            defaultBreakdown.calendar,
            defaultBreakdown.task,
          ],
          barWidth: 32,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#f59e0b' },
                { offset: 1, color: '#fbbf24' },
              ],
            },
            borderRadius: [4, 4, 0, 0],
          },
        },
      ],
    }),
    [defaultBreakdown]
  )

  const radarOption = useMemo(
    () => ({
      tooltip: {
        formatter: (params: { value: number[]; name: string }) => {
          const values = params.value
          return defaultAbilityData
            .map((d, i) => `${d.ability}: ${values[i]}%`)
            .join('<br/>')
        },
      },
      radar: {
        indicator: defaultAbilityData.map((d) => ({
          name: d.ability,
          max: 100,
        })),
        shape: 'polygon',
        splitNumber: 4,
        axisName: { color: '#6b7280', fontSize: 11 },
        splitLine: { lineStyle: { color: '#e5e7eb' } },
        splitArea: { areaStyle: { color: ['#fafafa', '#ffffff'] } },
        axisLine: { lineStyle: { color: '#e5e7eb' } },
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: defaultAbilityData.map((d) => d.value),
              name: '能力值',
              areaStyle: { color: 'rgba(99, 102, 241, 0.25)' },
              lineStyle: { color: '#6366f1', width: 2 },
              itemStyle: { color: '#6366f1' },
            },
          ],
        },
      ],
    }),
    [defaultAbilityData]
  )

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-indigo-600" />
          <h3 className="text-sm font-semibold text-gray-900">准时率趋势</h3>
        </div>
        <ReactECharts option={trendOption} style={{ height: 200 }} opts={{ renderer: 'canvas' }} />
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-amber-600" />
          <h3 className="text-sm font-semibold text-gray-900">各维度准时率</h3>
        </div>
        <ReactECharts option={barOption} style={{ height: 200 }} opts={{ renderer: 'canvas' }} />
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Radar className="h-5 w-5 text-purple-600" />
          <h3 className="text-sm font-semibold text-gray-900">能力雷达图</h3>
        </div>
        <ReactECharts option={radarOption} style={{ height: 240 }} opts={{ renderer: 'canvas' }} />
      </div>
    </div>
  )
}
