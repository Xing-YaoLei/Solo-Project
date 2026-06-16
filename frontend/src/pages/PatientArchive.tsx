import { useState, useEffect } from 'react'
import ReactECharts from 'echarts-for-react'
import { analyticsApi } from '../api'

const COLORS = ['#4f6ef7', '#36cfc9', '#ffc53d', '#ff7a45', '#9254de', '#597ef7', '#73d13d']

interface PatientArchiveStats {
  total_patients: number
  new_patients: number
  active_patients: number
  avg_visits_per_patient: number
  gender_distribution: Record<string, number>
  age_distribution: Record<string, number>
}

interface TrendItem {
  date: string
  patient_count: number
  total_images: number
  total_size_mb: number
  study_count: number
}

interface ImageTypeDistribution {
  image_type: string
  count: number
  total_images: number
  total_size_mb: number
}

export default function PatientArchive() {
  const [stats, setStats] = useState<PatientArchiveStats | null>(null)
  const [trend, setTrend] = useState<TrendItem[]>([])
  const [imageTypes, setImageTypes] = useState<ImageTypeDistribution[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      analyticsApi.getPatientArchiveStats(),
      analyticsApi.getImageArchiveTrend({ period: 'monthly' }),
      analyticsApi.getImageTypeDistribution(),
    ])
      .then(([statsRes, trendRes, imageTypeRes]) => {
        setStats(statsRes.data)
        setTrend(trendRes.data.data)
        setImageTypes(imageTypeRes.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const archiveRate = stats
    ? ((stats.active_patients / stats.total_patients) * 100).toFixed(1)
    : '-'

  const statsCards = [
    { label: '总患者数', value: stats?.total_patients ?? '-' },
    { label: '有影像档案患者', value: stats?.active_patients ?? '-' },
    { label: '归档覆盖率', value: archiveRate !== '-' ? `${archiveRate}%` : '-' },
    { label: '人均就诊次数', value: stats?.avg_visits_per_patient ?? '-' },
  ]

  const trendOption = trend.length
    ? {
        color: COLORS,
        tooltip: { trigger: 'axis' as const },
        legend: { bottom: 0, data: ['患者数', '影像数量', '检查数'] },
        grid: { left: 50, right: 50, top: 30, bottom: 50 },
        xAxis: {
          type: 'category' as const,
          data: trend.map(t => t.date),
          boundaryGap: false,
        },
        yAxis: [
          { type: 'value' as const, name: '患者/检查' },
          { type: 'value' as const, name: '影像数量', splitLine: { show: false } },
        ],
        series: [
          {
            name: '患者数',
            type: 'line' as const,
            smooth: true,
            data: trend.map(t => t.patient_count),
            areaStyle: { opacity: 0.15 },
          },
          {
            name: '影像数量',
            type: 'line' as const,
            smooth: true,
            yAxisIndex: 1,
            data: trend.map(t => t.total_images),
            areaStyle: { opacity: 0.15 },
          },
          {
            name: '检查数',
            type: 'line' as const,
            smooth: true,
            data: trend.map(t => t.study_count),
          },
        ],
      }
    : null

  const imageTypeOption = imageTypes.length
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
            data: imageTypes.map(t => ({
              name: t.image_type,
              value: t.total_images,
            })),
          },
        ],
      }
    : null

  const genderOption = stats
    ? {
        color: [COLORS[0], COLORS[1], COLORS[2]],
        tooltip: { trigger: 'item' as const },
        legend: { bottom: 0, type: 'scroll' as const },
        series: [
          {
            type: 'pie' as const,
            radius: ['35%', '60%'],
            center: ['50%', '45%'],
            avoidLabelOverlap: true,
            itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
            label: { show: true, formatter: '{b}: {d}%' },
            data: Object.entries(stats.gender_distribution).map(([name, value]) => ({
              name,
              value,
            })),
          },
        ],
      }
    : null

  const ageOption = stats
    ? {
        color: COLORS,
        tooltip: { trigger: 'axis' as const, axisPointer: { type: 'shadow' as const } },
        grid: { left: 50, right: 30, top: 20, bottom: 40 },
        xAxis: {
          type: 'category' as const,
          data: Object.keys(stats.age_distribution),
        },
        yAxis: { type: 'value' as const },
        series: [
          {
            type: 'bar' as const,
            data: Object.values(stats.age_distribution),
            barWidth: 36,
            itemStyle: { borderRadius: [4, 4, 0, 0] },
            label: { show: true, position: 'top' as const, fontWeight: 'bold' as const },
          },
        ],
      }
    : null

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 80, color: '#999' }}>加载中...</div>
  }

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

      <div className="chart-full">
        <div className="card">
          <div className="section-title">影像归档趋势</div>
          {trendOption && <ReactECharts option={trendOption} style={{ height: 400 }} />}
        </div>
      </div>

      <div className="charts-grid">
        <div className="card">
          <div className="section-title">影像类型分布</div>
          {imageTypeOption && <ReactECharts option={imageTypeOption} style={{ height: 360 }} />}
        </div>
        <div className="card">
          <div className="section-title">患者性别年龄分布</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {genderOption && <ReactECharts option={genderOption} style={{ height: 180 }} />}
            {ageOption && <ReactECharts option={ageOption} style={{ height: 180 }} />}
          </div>
        </div>
      </div>
    </div>
  )
}
