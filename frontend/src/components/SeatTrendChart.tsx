import { useEffect, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { Spin, Select, Button, Tooltip } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { analyticsApi, SeatTrendResponse, PerformanceSchedule } from '../api/analytics'

interface Props {
  schedules: PerformanceSchedule[]
  loading: boolean
  onOpenMetric: (code: string) => void
}

const SeatTrendChart = ({ schedules, loading, onOpenMetric }: Props) => {
  const [selectedSchedule, setSelectedSchedule] = useState<number | null>(null)
  const [data, setData] = useState<SeatTrendResponse | null>(null)
  const [chartLoading, setChartLoading] = useState(false)

  useEffect(() => {
    if (schedules.length > 0 && !selectedSchedule) {
      setSelectedSchedule(schedules[0].id)
    }
  }, [schedules])

  useEffect(() => {
    if (selectedSchedule) {
      setChartLoading(true)
      analyticsApi
        .getSeatTrend(selectedSchedule)
        .then(setData)
        .finally(() => setChartLoading(false))
    }
  }, [selectedSchedule])

  const option = data
    ? {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'cross' },
        },
        legend: {
          data: ['已售', '可售', '预留', '上座率(%)'],
          top: 0,
        },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: data.data.map((d) => dayjs(d.timestamp).format('MM-DD HH:mm')),
        },
        yAxis: [
          {
            type: 'value',
            name: '座位数',
            position: 'left',
          },
          {
            type: 'value',
            name: '上座率(%)',
            position: 'right',
            min: 0,
            max: 100,
            axisLabel: { formatter: '{value}%' },
          },
        ],
        series: [
          {
            name: '已售',
            type: 'line',
            smooth: true,
            stack: 'Total',
            areaStyle: {},
            data: data.data.map((d) => d.sold),
            itemStyle: { color: '#52c41a' },
          },
          {
            name: '可售',
            type: 'line',
            smooth: true,
            stack: 'Total',
            areaStyle: {},
            data: data.data.map((d) => d.available),
            itemStyle: { color: '#1677ff' },
          },
          {
            name: '预留',
            type: 'line',
            smooth: true,
            stack: 'Total',
            areaStyle: {},
            data: data.data.map((d) => d.reserved),
            itemStyle: { color: '#faad14' },
          },
          {
            name: '上座率(%)',
            type: 'line',
            yAxisIndex: 1,
            smooth: true,
            data: data.data.map((d) => d.occupancy_rate),
            itemStyle: { color: '#cf1322' },
            lineStyle: { width: 2, type: 'dashed' },
          },
        ],
      }
    : {}

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <span className="chart-card-title">座位销售趋势</span>
          <Tooltip title="点击查看上座率指标定义">
            <Button
              type="text"
              size="small"
              icon={<InfoCircleOutlined />}
              onClick={() => onOpenMetric('occupancy_rate')}
              style={{ marginLeft: 4 }}
            />
          </Tooltip>
        </div>
        <Select
          style={{ width: 260 }}
          value={selectedSchedule}
          onChange={setSelectedSchedule}
          loading={loading}
          options={schedules.map((s) => ({
            label: `${s.performance_name} (${dayjs(s.performance_date).format('MM-DD HH:mm')})`,
            value: s.id,
          }))}
        />
      </div>
      <Spin spinning={chartLoading}>
        <div style={{ height: 320 }}>{data && <ReactECharts option={option} style={{ height: '100%' }} />}</div>
      </Spin>
    </div>
  )
}

export default SeatTrendChart
