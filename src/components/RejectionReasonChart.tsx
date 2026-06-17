import ReactECharts from 'echarts-for-react'

interface TooltipParam {
  axisValue?: string
  seriesName: string
  marker: string
  value: number | string
  name: string
  dataIndex: number
  componentType: string
  percent?: number
}

interface RejectionReasonChartProps {
  data: { name: string; value: number; count: number; pendingAmount: number; processingAmount: number; resolvedAmount: number }[]
  onSegmentClick?: (name: string) => void
}

const COLOR_PALETTE = ['#0F766E', '#D97706', '#E11D48', '#7C3AED', '#0284C7', '#059669']

export default function RejectionReasonChart({ data, onSegmentClick }: RejectionReasonChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  const reasons = data.map((d) => d.name)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(255,255,255,0.96)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#374151', fontSize: 13 },
      formatter(params: TooltipParam[]) {
        if (params.length === 0) return ''
        const reason = params[0].axisValue || params[0].name
        const d = data.find((x) => x.name === reason)
        let html = `<div style="font-weight:600;margin-bottom:6px">${reason}</div>`
        let totalAmount = 0
        for (const p of params) {
          const val = Number(p.value) || 0
          totalAmount += val
          html += `<div style="display:flex;align-items:center;gap:6px;margin:2px 0">
            ${p.marker}<span>${p.seriesName}:</span>
            <span style="font-weight:600">¥${val.toLocaleString()}</span>
          </div>`
        }
        html += `<div style="margin-top:4px;padding-top:4px;border-top:1px solid #e5e7eb">
          <span style="color:#6b7280">合计:</span>
          <span style="font-weight:700;margin-left:4px">¥${totalAmount.toLocaleString()}</span>
          ${d ? `<span style="color:#6b7280;margin-left:8px">(${d.count} 笔)</span>` : ''}
        </div>`
        return html
      },
    },
    legend: {
      data: ['待处理', '处理中', '已解决'],
      top: 0,
      textStyle: { fontSize: 12, color: '#6b7280' },
    },
    grid: {
      left: 10,
      right: 50,
      top: 40,
      bottom: 10,
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      axisLabel: {
        color: '#9ca3af',
        fontSize: 11,
        formatter: (v: number) => v >= 10000 ? `${(v / 10000).toFixed(0)}万` : v.toString(),
      },
      splitLine: { lineStyle: { color: '#f3f4f6' } },
    },
    yAxis: {
      type: 'category',
      data: reasons,
      axisLabel: { color: '#6b7280', fontSize: 11 },
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisTick: { show: false },
    },
    series: [
      {
        name: '待处理',
        type: 'bar',
        stack: 'status',
        barWidth: 18,
        data: data.map((d) => d.pendingAmount),
        itemStyle: { color: '#F59E0B' },
      },
      {
        name: '处理中',
        type: 'bar',
        stack: 'status',
        barWidth: 18,
        data: data.map((d) => d.processingAmount),
        itemStyle: { color: '#3B82F6' },
      },
      {
        name: '已解决',
        type: 'bar',
        stack: 'status',
        barWidth: 18,
        data: data.map((d) => d.resolvedAmount),
        itemStyle: { color: '#10B981' },
      },
    ],
    graphic: [
      {
        type: 'group',
        right: 16,
        top: 40,
        children: [
          {
            type: 'text',
            style: {
              text: '拒付总额',
              fill: '#9ca3af',
              fontSize: 11,
              textAlign: 'right',
            },
          },
          {
            type: 'text',
            style: {
              text: '¥' + total.toLocaleString(),
              fill: '#374151',
              fontSize: 16,
              fontWeight: 700,
              textAlign: 'right',
            },
            top: 16,
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
              onSegmentClick(params.name || reasons[params.dataIndex])
            }
          },
        }}
      />
    </div>
  )
}
