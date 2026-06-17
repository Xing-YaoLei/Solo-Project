import ReactECharts from 'echarts-for-react'

interface TooltipParam {
  seriesName: string
  marker: string
  value: number | string
  name: string
  dataIndex: number
  componentType: string
  percent?: number
}

interface RejectionReasonChartProps {
  data: { name: string; value: number }[]
  onSegmentClick?: (name: string) => void
}

const COLOR_PALETTE = ['#0F766E', '#D97706', '#E11D48', '#7C3AED', '#0284C7', '#059669']

export default function RejectionReasonChart({ data, onSegmentClick }: RejectionReasonChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255,255,255,0.96)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#374151', fontSize: 13 },
      formatter(params: TooltipParam) {
        return `<div style="font-weight:600;margin-bottom:4px">${params.name}</div>
          <div>金额: <b>¥${Number(params.value).toLocaleString()}</b></div>
          <div>占比: ${params.percent ?? 0}%</div>`
      },
    },
    legend: {
      type: 'scroll',
      orient: 'vertical',
      right: 8,
      top: 16,
      bottom: 16,
      textStyle: { fontSize: 12, color: '#6b7280' },
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 10,
    },
    series: [
      {
        type: 'pie',
        radius: ['45%', '72%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 13, fontWeight: 'bold' },
        },
        color: COLOR_PALETTE,
        data: data.map((d) => ({ name: d.name, value: d.value })),
      },
    ],
    graphic: [
      {
        type: 'group',
        left: '27%',
        top: 'center',
        children: [
          {
            type: 'text',
            style: {
              text: '¥' + total.toLocaleString(),
              fill: '#374151',
              fontSize: 14,
              fontWeight: 700,
              textAlign: 'center',
            },
            left: 'center',
          },
          {
            type: 'text',
            style: {
              text: '拒付总额',
              fill: '#9ca3af',
              fontSize: 11,
              textAlign: 'center',
            },
            left: 'center',
            top: 20,
          },
        ],
      },
    ],
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">拒付原因分布</h3>
      <ReactECharts
        option={option}
        style={{ height: 300 }}
        onEvents={{
          click: (params: TooltipParam) => {
            if (params.componentType === 'series' && onSegmentClick) {
              onSegmentClick(params.name)
            }
          },
        }}
      />
    </div>
  )
}
