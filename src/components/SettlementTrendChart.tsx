import ReactECharts from 'echarts-for-react'
import type { SettlementTrend } from '@/types'

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

interface SettlementTrendChartProps {
  data: SettlementTrend[]
  onPeriodClick: (period: string) => void
}

export default function SettlementTrendChart({ data, onPeriodClick }: SettlementTrendChartProps) {
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      backgroundColor: 'rgba(255,255,255,0.96)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#374151', fontSize: 13 },
      formatter(params: TooltipParam[]) {
        let html = `<div style="font-weight:600;margin-bottom:6px">${params[0].axisValue}</div>`
        for (const p of params) {
          const unit = p.seriesName === '拒付率' ? '%' : p.seriesName === '训练完成率' ? '%' : ' 元'
          html += `<div style="display:flex;align-items:center;gap:6px;margin:2px 0">
            ${p.marker}<span>${p.seriesName}:</span>
            <span style="font-weight:600">${typeof p.value === 'number' ? p.value.toLocaleString() : p.value}${unit}</span>
          </div>`
        }
        return html
      },
    },
    grid: {
      left: 60,
      right: 60,
      top: 40,
      bottom: 36,
    },
    legend: {
      data: ['结算总额', '拒付金额', '训练完成率', '拒付率'],
      top: 4,
      textStyle: { fontSize: 12, color: '#6b7280' },
    },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.period),
      axisLabel: { color: '#9ca3af', fontSize: 11 },
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisTick: { show: false },
    },
    yAxis: [
      {
        type: 'value',
        name: '元',
        nameTextStyle: { color: '#9ca3af', fontSize: 11 },
        axisLabel: {
          color: '#9ca3af',
          fontSize: 11,
          formatter: (v: number) => v >= 10000 ? `${(v / 10000).toFixed(0)}万` : v.toString(),
        },
        splitLine: { lineStyle: { color: '#f3f4f6' } },
      },
      {
        type: 'value',
        name: '%',
        nameTextStyle: { color: '#9ca3af', fontSize: 11 },
        axisLabel: { color: '#9ca3af', fontSize: 11, formatter: '{value}%' },
        splitLine: { show: false },
        min: 0,
        max: 100,
      },
    ],
    series: [
      {
        name: '结算总额',
        type: 'line',
        data: data.map((d) => d.totalAmount),
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2.5, color: '#0F766E' },
        itemStyle: { color: '#0F766E' },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(15,118,110,0.15)' }, { offset: 1, color: 'rgba(15,118,110,0.01)' }] } },
      },
      {
        name: '拒付金额',
        type: 'line',
        data: data.map((d) => d.rejectedAmount),
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2, color: '#D97706', type: 'dashed' },
        itemStyle: { color: '#D97706' },
      },
      {
        name: '训练完成率',
        type: 'line',
        yAxisIndex: 1,
        data: data.map((d) => d.completionRate),
        smooth: true,
        symbol: 'diamond',
        symbolSize: 6,
        lineStyle: { width: 2, color: '#5EEAD4', type: 'dotted' },
        itemStyle: { color: '#5EEAD4' },
      },
      {
        name: '拒付率',
        type: 'bar',
        yAxisIndex: 1,
        data: data.map((d) => d.rejectionRate),
        barWidth: 16,
        barGap: '20%',
        itemStyle: { color: 'rgba(217,119,6,0.18)', borderRadius: [3, 3, 0, 0] },
        z: -1,
      },
    ],
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">结算趋势</h3>
      <ReactECharts
        option={option}
        style={{ height: 400 }}
        onEvents={{
          click: (params: TooltipParam) => {
            if (params.componentType === 'series') {
              onPeriodClick(data[params.dataIndex].period)
            }
          },
        }}
      />
    </div>
  )
}
