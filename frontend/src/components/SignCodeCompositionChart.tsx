import { useEffect, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { Spin, Select, Button, Tooltip } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { analyticsApi, SignCodeCompositionResponse, PerformanceSchedule } from '../api/analytics'

interface Props {
  schedules: PerformanceSchedule[]
  loading: boolean
  onOpenMetric: (code: string) => void
}

const CODE_TYPE_LABELS: Record<string, string> = {
  qr: '二维码',
  barcode: '条形码',
  nfc: 'NFC',
  manual: '人工核销',
}

const COLORS = ['#1677ff', '#52c41a', '#faad14', '#722ed1']

const SignCodeCompositionChart = ({ schedules, loading, onOpenMetric }: Props) => {
  const [selectedSchedule, setSelectedSchedule] = useState<number | null>(null)
  const [data, setData] = useState<SignCodeCompositionResponse | null>(null)
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
        .getSignCodeComposition(selectedSchedule)
        .then(setData)
        .finally(() => setChartLoading(false))
    }
  }, [selectedSchedule])

  const pieOption = data
    ? {
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c} 个 ({d}%)',
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          top: 'center',
        },
        series: [
          {
            name: '签到码类型',
            type: 'pie',
            radius: ['45%', '70%'],
            center: ['65%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 6,
              borderColor: '#fff',
              borderWidth: 2,
            },
            label: {
              show: false,
              position: 'center',
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 16,
                fontWeight: 'bold',
                formatter: '{b}\n{c}个',
              },
            },
            data: data.composition.map((c, i) => ({
              value: c.count,
              name: CODE_TYPE_LABELS[c.code_type] || c.code_type,
              itemStyle: { color: COLORS[i % COLORS.length] },
            })),
          },
        ],
      }
    : {}

  const usedOption = data
    ? {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: { data: ['发放数量', '已使用', '使用率(%)'], top: 0 },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
          type: 'category',
          data: data.composition.map((c) => CODE_TYPE_LABELS[c.code_type] || c.code_type),
        },
        yAxis: [
          { type: 'value', name: '数量' },
          { type: 'value', name: '使用率(%)', min: 0, max: 100, axisLabel: { formatter: '{value}%' } },
        ],
        series: [
          {
            name: '发放数量',
            type: 'bar',
            data: data.composition.map((c) => c.count),
            itemStyle: { color: '#1677ff' },
            barWidth: '30%',
          },
          {
            name: '已使用',
            type: 'bar',
            data: data.composition.map((c) => c.used_count),
            itemStyle: { color: '#52c41a' },
            barWidth: '30%',
          },
          {
            name: '使用率(%)',
            type: 'line',
            yAxisIndex: 1,
            smooth: true,
            data: data.composition.map((c) => c.used_percentage),
            itemStyle: { color: '#faad14' },
          },
        ],
      }
    : {}

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <span className="chart-card-title">签到码构成分析</span>
          <Tooltip title="点击查看核销效率指标定义">
            <Button
              type="text"
              size="small"
              icon={<InfoCircleOutlined />}
              onClick={() => onOpenMetric('checkin_efficiency')}
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
        <div style={{ display: 'flex', height: 320 }}>
          <div style={{ flex: 1 }}>{data && <ReactECharts option={pieOption} style={{ height: '100%' }} />}</div>
          <div style={{ flex: 1 }}>{data && <ReactECharts option={usedOption} style={{ height: '100%' }} />}</div>
        </div>
      </Spin>
    </div>
  )
}

export default SignCodeCompositionChart
