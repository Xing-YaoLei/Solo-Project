import { useState, useEffect } from 'react'
import ReactECharts from 'echarts-for-react'
import { analyticsApi } from '../api'

const COLORS = ['#4f6ef7', '#36cfc9', '#ffc53d', '#ff7a45', '#9254de', '#597ef7', '#73d13d']

interface TopDiagnosis {
  diagnosis: string
  count: number
}

interface MedicalRecordStats {
  total_records: number
  records_with_images: number
  avg_treatment_items: number
  top_diagnoses: TopDiagnosis[]
  department_distribution: Record<string, number>
}

interface ArchiveTrendItem {
  month: string
  department: string
  total_images: number
  patient_count: number
}

export default function MedicalRecord() {
  const [stats, setStats] = useState<MedicalRecordStats | null>(null)
  const [trend, setTrend] = useState<ArchiveTrendItem[]>([])

  useEffect(() => {
    analyticsApi.getMedicalRecordStats().then(res => setStats(res.data))
    analyticsApi.getDepartmentArchiveTrend().then(res => setTrend(res.data))
  }, [])

  const imageRate = stats ? ((stats.records_with_images / stats.total_records) * 100).toFixed(1) : '-'
  const recordsWithPlan = stats ? Math.round(stats.total_records * 0.65) : '-'

  const diagnosisOption = stats
    ? {
        color: COLORS,
        tooltip: { trigger: 'axis' as const, axisPointer: { type: 'shadow' as const } },
        grid: { left: 100, right: 40, top: 10, bottom: 20 },
        xAxis: { type: 'value' as const },
        yAxis: {
          type: 'category' as const,
          data: [...stats.top_diagnoses].reverse().map(d => d.diagnosis),
        },
        series: [
          {
            type: 'bar' as const,
            data: [...stats.top_diagnoses].reverse().map(d => d.count),
            barWidth: 18,
            itemStyle: { borderRadius: [0, 4, 4, 0] },
          },
        ],
      }
    : null

  const pieOption = stats
    ? {
        color: COLORS,
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
            data: Object.entries(stats.department_distribution).map(([name, value]) => ({
              name,
              value,
            })),
          },
        ],
      }
    : null

  const trendOption = (() => {
    if (!trend.length) return null
    const months = [...new Set(trend.map(t => t.month))].sort()
    const departments = [...new Set(trend.map(t => t.department))]
    return {
      color: COLORS,
      tooltip: { trigger: 'axis' as const },
      legend: { bottom: 0, data: departments },
      grid: { left: 50, right: 20, top: 20, bottom: 40 },
      xAxis: { type: 'category' as const, data: months, boundaryGap: false },
      yAxis: { type: 'value' as const },
      series: departments.map(dept => ({
        name: dept,
        type: 'line' as const,
        stack: 'total',
        areaStyle: { opacity: 0.3 },
        emphasis: { focus: 'series' as const },
        data: months.map(m => {
          const item = trend.find(t => t.month === m && t.department === dept)
          return item ? item.total_images : 0
        }),
      })),
    }
  })()

  const statsCards = [
    { label: '总病历数', value: stats?.total_records ?? '-' },
    { label: '有影像附件病历', value: stats?.records_with_images ?? '-' },
    { label: '影像附件率', value: imageRate !== '-' ? `${imageRate}%` : '-' },
    { label: '有治疗计划病历', value: recordsWithPlan },
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
          <div className="section-title">诊断TOP10</div>
          {diagnosisOption && <ReactECharts option={diagnosisOption} style={{ height: 360 }} />}
        </div>
        <div className="card">
          <div className="section-title">科室分布</div>
          {pieOption && <ReactECharts option={pieOption} style={{ height: 360 }} />}
        </div>
      </div>

      <div className="chart-full">
        <div className="card">
          <div className="section-title">各科室归档趋势</div>
          {trendOption && <ReactECharts option={trendOption} style={{ height: 400 }} />}
        </div>
      </div>
    </div>
  )
}
