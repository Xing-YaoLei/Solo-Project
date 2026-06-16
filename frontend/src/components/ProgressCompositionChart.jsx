import React, { useEffect, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { analyticsAPI } from '../utils/api'

const ProgressCompositionChart = ({ onRefresh, externalData = null }) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(!externalData)

  const fetchData = async () => {
    if (externalData) {
      setData(externalData)
      if (onRefresh && externalData.refreshed_at) {
        onRefresh(externalData.refreshed_at)
      }
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const res = await analyticsAPI.getProgressComposition()
      setData(res)
      if (onRefresh && res.refreshed_at) {
        onRefresh(res.refreshed_at)
      }
    } catch (err) {
      console.error('获取学习进度构成失败:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [externalData])

  const getOption = () => {
    if (!data || !data.data || data.data.length === 0) {
      return {
        title: {
          text: '暂无数据权限',
          left: 'center',
          top: 'center',
          textStyle: {
            color: '#9ca3af',
            fontSize: 14
          }
        }
      }
    }

    const pieData = data.data.map(item => ({
      name: item.category,
      value: item.count,
      value2: item.value
    }))

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          return `${params.name}<br/>人数: ${params.value}<br/>占比: ${params.data.value2}%`
        }
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        itemWidth: 12,
        itemHeight: 12,
        textStyle: {
          fontSize: 12
        }
      },
      series: [
        {
          name: '学习进度',
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 20,
              fontWeight: 'bold',
              formatter: () => {
                return `总人数\n${data.total}`
              }
            }
          },
          labelLine: {
            show: false
          },
          data: pieData,
          color: ['#10b981', '#3b82f6', '#e5e7eb', '#f59e0b', '#ef4444']
        }
      ]
    }
  }

  return (
    <ReactECharts
      option={getOption()}
      style={{ height: '100%', minHeight: '300px' }}
      opts={{ renderer: 'canvas' }}
    />
  )
}

export default ProgressCompositionChart
