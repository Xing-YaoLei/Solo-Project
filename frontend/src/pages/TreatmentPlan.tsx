import { useState, useEffect } from 'react'
import ReactECharts from 'echarts-for-react'
import { analyticsApi } from '../api'

const COLORS = ['#4f6ef7', '#36cfc9', '#ffc53d', '#ff7a45', '#9254de', '#597ef7', '#73d13d']

interface PriorityDistribution {
  high: number
  normal: number
  low: number
}

interface TreatmentPlanStats {
  total_plans: number
  completed_plans: number
  pending_plans: number
  avg_estimated_cost: number
  priority_distribution: PriorityDistribution
  completion_rate: number
}

const PRIORITY_LABELS: Record<string, string> = {
  high: '高优先级',
  normal: '普通优先级',
  low: '低优先级',
}

export default function TreatmentPlan() {
  const [stats, setStats] = useState<TreatmentPlanStats | null>(null)

  useEffect(() => {
    analyticsApi.getTreatmentPlanStats().then(res => setStats(res.data))
  }, [])

  const inProgressPlans = stats ? stats.total_plans - stats.completed_plans - stats.pending_plans : 0

  const gaugeOption = stats
    ? {
        series: [
          {
            type: 'gauge' as const,
            startAngle: 200,
            endAngle: -20,
            min: 0,
            max: 100,
            progress: { show: true, width: 18, itemStyle: { color: COLORS[0] } },
            axisLine: { lineStyle: { width: 18, color: [[1, '#e8e8e8']] } },
            axisTick: { show: false },
            splitLine: { show: false },
            axisLabel: { show: false },
            pointer: { show: false },
            title: { offsetCenter: [0, '60%'], fontSize: 14, color: '#666' },
            detail: {
              valueAnimation: true,
              offsetCenter: [0, '20%'],
              fontSize: 36,
              fontWeight: 'bold',
              color: COLORS[0],
              formatter: '{value}%',
            },
            data: [{ value: stats.completion_rate, name: '完成率' }],
          },
        ],
      }
    : null

  const pieOption = stats
    ? {
        color: [COLORS[3], COLORS[0], COLORS[1]],
        tooltip: { trigger: 'item' as const },
        legend: { bottom: 0, type: 'scroll' as const },
        series: [
          {
            type: 'pie' as const,
            radius: ['40%', '65%'],
            center: ['50%', '45%'],
            avoidLabelOverlap: true,
            itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
            label: { show: true, formatter: '{b}: {d}%' },
            data: Object.entries(stats.priority_distribution).map(([key, value]) => ({
              name: PRIORITY_LABELS[key] || key,
              value,
            })),
          },
        ],
      }
    : null

  const barOption = stats
    ? {
        color: COLORS,
        tooltip: { trigger: 'axis' as const, axisPointer: { type: 'shadow' as const } },
        grid: { left: 60, right: 40, top: 30, bottom: 40 },
        xAxis: {
          type: 'category' as const,
          data: ['已完成', '待执行', '进行中'],
        },
        yAxis: { type: 'value' as const },
        series: [
          {
            type: 'bar' as const,
            data: [
              { value: stats.completed_plans, itemStyle: { color: COLORS[0] } },
              { value: stats.pending_plans, itemStyle: { color: COLORS[2] } },
              { value: inProgressPlans, itemStyle: { color: COLORS[1] } },
            ],
            barWidth: 48,
            itemStyle: { borderRadius: [4, 4, 0, 0] },
            label: { show: true, position: 'top' as const, fontWeight: 'bold' },
          },
        ],
      }
    : null

  const costOption = stats
    ? {
        color: COLORS,
        tooltip: { trigger: 'axis' as const, axisPointer: { type: 'shadow' as const } },
        grid: { left: 120, right: 40, top: 10, bottom: 20 },
        xAxis: { type: 'value' as const, axisLabel: { formatter: '¥{value}' } },
        yAxis: {
          type: 'category' as const,
          data: ['平均预估费用'],
        },
        series: [
          {
            type: 'bar' as const,
            data: [
              {
                value: stats.avg_estimated_cost,
                itemStyle: {
                  color: {
                    type: 'linear' as const,
                    x: 0, y: 0, x2: 1, y2: 0,
                    colorStops: [
                      { offset: 0, color: COLORS[0] },
                      { offset: 1, color: COLORS[1] },
                    ],
                  },
                },
              },
            ],
            barWidth: 28,
            itemStyle: { borderRadius: [0, 4, 4, 0] },
            label: { show: true, position: 'right' as const, formatter: `¥${stats.avg_estimated_cost.toLocaleString()}`, fontWeight: 'bold' },
          },
        ],
      }
    : null

  const statsCards = [
    { label: '治疗计划总数', value: stats?.total_plans ?? '-' },
    { label: '已完成计划', value: stats?.completed_plans ?? '-' },
    { label: '待执行计划', value: stats?.pending_plans ?? '-' },
    { label: '完成率', value: stats ? `${stats.completion_rate}%` : '-' },
    { label: '平均预估费用', value: stats ? `¥${stats.avg_estimated_cost.toLocaleString()}` : '-' },
  ]

  return (
    <div>
      <div className="stats-grid">
        {statsCards.map(card => (
          <div className="stat-card" key={card.label}>
            <div className="stat-value">{card.value}</div>
            <div className="stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        <div className="card">
          <div className="section-title">治疗计划完成率</div>
          {gaugeOption && <ReactECharts option={gaugeOption} style={{ height: 360 }} />}
        </div>
        <div className="card">
          <div className="section-title">优先级分布</div>
          {pieOption && <ReactECharts option={pieOption} style={{ height: 360 }} />}
        </div>
      </div>

      <div className="chart-full">
        <div className="card">
          <div className="section-title">计划状态分布</div>
          {barOption && <ReactECharts option={barOption} style={{ height: 360 }} />}
        </div>
      </div>

      <div className="chart-full">
        <div className="card">
          <div className="section-title">平均预估费用</div>
          {costOption && <ReactECharts option={costOption} style={{ height: 140 }} />}
        </div>
      </div>
    </div>
  )
}
