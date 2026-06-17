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
  data: {
    name: string
    rate: number
    target: number
    rejectionStatus?: 'pending' | 'processing' | 'resolved' | null
    rejectionAmount?: number
    rejectionReason?: string
  }[]
  onBarClick?: (name: string) => void
}

const statusColors: Record<string, string> = {
  pending: '#F59E0B',
  processing: '#3B82F6',
  resolved: '#10B981',
}

const statusLabels: Record<string, string> = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
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
        let html = `<div style="font-weight:600;margin-bottom:4px">${bar.name}</div>
          <div style="margin-bottom:2px">完成率: <b>${item.rate}%</b></div>
          <div>目标: ${item.target}%</div>`
        if (item.rejectionStatus && statusLabels[item.rejectionStatus]) {
          const color = statusColors[item.rejectionStatus]
          html += `<div style="margin-top:6px;padding-top:6px;border-top:1px solid #e5e7eb">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:4px"></span>
            <span style="font-weight:500">拒付状态: ${statusLabels[item.rejectionStatus]}</span>`
          if (item.rejectionAmount) {
            html += `<div style="margin-top:2px;color:#6b7280">拒付金额: ¥${item.rejectionAmount.toLocaleString()}</div>`
          }
          if (item.rejectionReason) {
            html += `<div style="margin-top:2px;color:#6b7280">原因: ${item.rejectionReason}</div>`
          }
          html += `</div>`
        }
        return html
      },
    },
    grid: {
      left: 100,
      right: 60,
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
          formatter: (params: TooltipParam) => {
            const item = data[params.dataIndex]
            let label = `${item.rate}%`
            if (item.rejectionStatus) {
              label += ' '
            }
            return label
          },
          fontSize: 11,
          color: '#6b7280',
        },
      },
      {
        name: '拒付状态',
        type: 'scatter',
        data: data.map((d) => ({
          value: d.rejectionStatus ? [d.rate + 3, d.name] : null,
          itemStyle: d.rejectionStatus ? {
            color: statusColors[d.rejectionStatus],
            borderColor: '#fff',
            borderWidth: 2,
          } : { opacity: 0 },
          symbolSize: d.rejectionStatus ? 10 : 0,
        })).filter((d: any) => d.value !== null),
        symbol: 'circle',
        label: {
          show: false,
        },
        tooltip: {
          show: false,
        },
      },
    ],
    graphic: data.some(d => d.rejectionStatus) ? [
      {
        type: 'group',
        right: 16,
        bottom: 8,
        children: [
          {
            type: 'text',
            style: {
              text: '拒付状态',
              fill: '#6b7280',
              fontSize: 11,
            },
          },
          ...Object.entries(statusLabels).map(([key, label], i) => ({
            type: 'group',
            left: 60 + i * 70,
            children: [
              {
                type: 'circle',
                shape: { cx: 0, cy: 6, r: 4 },
                style: { fill: statusColors[key] },
              },
              {
                type: 'text',
                style: {
                  text: label,
                  fill: '#6b7280',
                  fontSize: 11,
                  x: 10,
                  y: 10,
                },
              },
            ],
          })),
        ],
      },
    ] : [],
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
