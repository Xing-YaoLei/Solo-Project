import ReactECharts from 'echarts-for-react'

interface TooltipParam {
  seriesName: string
  marker: string
  value: number | string
  name: string
  dataIndex: number
  componentType: string
}

interface CompletionRateChartProps {
  data: { name: string; rate: number; target: number }[]
  onBarClick?: (name: string) => void
}

export default function CompletionRateChart({ data, onBarClick }: CompletionRateChartProps) {
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(255,255,255,0.96)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#374151', fontSize: 13 },
      formatter(params: TooltipParam[]) {
        const bar = params.find((p: TooltipParam) => p.seriesName === '完成率')
        if (!bar) return ''
        const item = data[bar.dataIndex]
        return `<div style="font-weight:600;margin-bottom:4px">${bar.name}</div>
          <div>完成率: <b>${item.rate}%</b></div>
          <div>目标: ${item.target}%</div>`
      },
    },
    grid: {
      left: 100,
      right: 40,
      top: 16,
      bottom: 16,
    },
    xAxis: {
      type: 'value',
      max: 100,
      axisLabel: { color: '#9ca3af', fontSize: 11, formatter: '{value}%' },
      splitLine: { lineStyle: { color: '#f3f4f6' } },
    },
    yAxis: {
      type: 'category',
      data: data.map((d) => d.name),
      axisLabel: { color: '#6b7280', fontSize: 12 },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        name: '目标线',
        type: 'line',
        data: data.map(() => 80),
        symbol: 'none',
        lineStyle: { color: '#9ca3af', type: 'dashed', width: 1.5 },
        markLine: { silent: true },
      },
      {
        name: '完成率',
        type: 'bar',
        data: data.map((d) => ({
          value: d.rate,
          itemStyle: {
            color: d.rate >= 80 ? '#0F766E' : '#D97706',
            borderRadius: [0, 4, 4, 0],
          },
        })),
        barWidth: 18,
        label: {
          show: true,
          position: 'right',
          formatter: '{c}%',
          fontSize: 11,
          color: '#6b7280',
        },
      },
    ],
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">训练完成率</h3>
      <ReactECharts
        option={option}
        style={{ height: 300 }}
        onEvents={{
          click: (params: TooltipParam) => {
            if (params.seriesName === '完成率' && onBarClick) {
              onBarClick(data[params.dataIndex].name)
            }
          },
        }}
      />
    </div>
  )
}
