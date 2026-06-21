import React, { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { Card, Tag, Tooltip } from 'antd'
import {
  WarningOutlined,
  ClockCircleOutlined,
  FileUnknownOutlined,
  SwapOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'

const getAnomalyIcon = (type) => {
  switch (type) {
    case 'order_delay':
      return <ClockCircleOutlined style={{ color: '#d97706' }} />
    case 'cs_missing':
      return <FileUnknownOutlined style={{ color: '#dc2626' }} />
    case 'caliber_change':
      return <SwapOutlined style={{ color: '#2563eb' }} />
    default:
      return <WarningOutlined style={{ color: '#d97706' }} />
  }
}

const getAnomalyColor = (type) => {
  switch (type) {
    case 'order_delay':
      return '#d97706'
    case 'cs_missing':
      return '#dc2626'
    case 'caliber_change':
      return '#2563eb'
    default:
      return '#d97706'
  }
}

const getAnomalyLabel = (type) => {
  switch (type) {
    case 'order_delay':
      return '订单延迟'
    case 'cs_missing':
      return '记录缺失'
    case 'caliber_change':
      return '口径变化'
    default:
      return '异常'
  }
}

const SettlementTrendChart = ({ trendData, affectedRanges, anomalySummary }) => {
  const option = useMemo(() => {
    if (!trendData || trendData.length === 0) {
      return {}
    }

    const dates = trendData.map((item) => dayjs(item.date).format('MM-DD'))
    const amounts = trendData.map((item) => item.amount)
    const orderCounts = trendData.map((item) => item.order_count)

    const markPoints = trendData
      .filter((item) => item.has_anomaly)
      .map((item, index) => ({
        name: getAnomalyLabel(item.anomaly_type),
        xAxis: dayjs(item.date).format('MM-DD'),
        yAxis: item.amount,
        value: getAnomalyLabel(item.anomaly_type),
        itemStyle: {
          color: getAnomalyColor(item.anomaly_type),
        },
        symbolSize: 12,
      }))

    const markAreas = (affectedRanges || []).map((range, index) => [
      {
        xAxis: dayjs(range.start_date).format('MM-DD'),
        itemStyle: {
          color: index % 2 === 0 ? 'rgba(217, 119, 6, 0.15)' : 'rgba(37, 99, 235, 0.15)',
        },
      },
      {
        xAxis: dayjs(range.end_date).format('MM-DD'),
      },
    ])

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
        },
        formatter: (params) => {
          const date = params[0].axisValue
          const dataIndex = dates.indexOf(date)
          const item = trendData[dataIndex]

          let html = `<div style="font-weight: 600; margin-bottom: 8px;">${date}</div>`
          params.forEach((p) => {
            html += `<div style="margin: 4px 0;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${p.color}; margin-right: 8px;"></span>
              ${p.seriesName}: <strong>${p.seriesName.includes('金额') ? '¥' : ''}${p.value.toLocaleString()}${p.seriesName.includes('订单') ? '单' : ''}</strong>
            </div>`
          })

          if (item && item.has_anomaly) {
            html += `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
              <div style="color: ${getAnomalyColor(item.anomaly_type)}; font-weight: 500;">
                ${getAnomalyIcon(item.anomaly_type) && '⚠️'} ${getAnomalyLabel(item.anomaly_type)}
              </div>
              <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">${item.anomaly_desc}</div>
            </div>`
          }

          return html
        },
      },
      legend: {
        data: ['结算金额', '订单数量'],
        top: 0,
        right: 0,
      },
      grid: {
        left: 60,
        right: 60,
        top: 50,
        bottom: 40,
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          rotate: 0,
        },
      },
      yAxis: [
        {
          type: 'value',
          name: '金额(元)',
          position: 'left',
          axisLabel: {
            formatter: (value) => {
              if (value >= 10000) {
                return (value / 10000).toFixed(1) + 'w'
              }
              return value
            },
          },
        },
        {
          type: 'value',
          name: '订单数',
          position: 'right',
          axisLabel: {
            formatter: '{value}',
          },
        },
      ],
      series: [
        {
          name: '结算金额',
          type: 'line',
          smooth: true,
          data: amounts,
          yAxisIndex: 0,
          lineStyle: {
            width: 2,
            color: '#16a34a',
          },
          itemStyle: {
            color: '#16a34a',
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(22, 163, 74, 0.3)' },
                { offset: 1, color: 'rgba(22, 163, 74, 0.05)' },
              ],
            },
          },
          markPoint: {
            data: markPoints,
            symbol: 'circle',
            symbolSize: 10,
            label: {
              show: false,
            },
          },
          markArea: {
            silent: true,
            data: markAreas,
          },
        },
        {
          name: '订单数量',
          type: 'bar',
          data: orderCounts,
          yAxisIndex: 1,
          barWidth: 6,
          itemStyle: {
            color: '#93c5fd',
            borderRadius: [3, 3, 0, 0],
          },
        },
      ],
    }
  }, [trendData, affectedRanges])

  return (
    <Card className="chart-card" style={{ marginBottom: 24 }}>
      <div className="chart-header">
        <div>
          <div className="chart-title">结算趋势图</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
            含异常点标注与受影响区间高亮
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Tag icon={<ClockCircleOutlined />} color="orange">
            订单延迟: {anomalySummary?.order_delay_count || 0}
          </Tag>
          <Tag icon={<FileUnknownOutlined />} color="red">
            记录缺失: {anomalySummary?.cs_missing_count || 0}
          </Tag>
          <Tag icon={<SwapOutlined />} color="blue">
            口径变化: {anomalySummary?.caliber_change_count || 0}
          </Tag>
        </div>
      </div>

      {affectedRanges && affectedRanges.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 8 }}>
            受影响区间:
          </div>
          {affectedRanges.map((range, index) => (
            <div
              key={index}
              className="affected-range"
              style={{
                background: index % 2 === 0 ? '#fef3c7' : '#dbeafe',
                borderLeftColor: index % 2 === 0 ? '#d97706' : '#2563eb',
              }}
            >
              <div
                className="range-title"
                style={{ color: index % 2 === 0 ? '#92400e' : '#1e40af' }}
              >
                {dayjs(range.start_date).format('YYYY-MM-DD')} ~ {dayjs(range.end_date).format('YYYY-MM-DD')}
              </div>
              <div className="range-desc" style={{ color: index % 2 === 0 ? '#78350f' : '#1e3a8a' }}>
                {range.reason}
                <span style={{ marginLeft: 12, fontWeight: 500 }}>
                  影响金额: ¥{range.affected_amount}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <ReactECharts option={option} style={{ height: 350 }} />
    </Card>
  )
}

export default SettlementTrendChart
