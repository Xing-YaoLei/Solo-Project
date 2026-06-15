import React, { useEffect, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { analyticsAPI } from '../utils/api'

const TagTrendChart = ({ onRefresh }) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await analyticsAPI.getTagTrend(30)
      setData(res)
      if (onRefresh && res.refreshed_at) {
        onRefresh(res.refreshed_at)
      }
    } catch (err) {
      console.error('获取题目标签趋势失败:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getOption = () => {
    if (!data) return {}

    const dates = [...new Set(data.data.map(item => item.date))].sort()
    const tags = data.tags

    const series = tags.map(tag => {
      const tagData = dates.map(date => {
        const item = data.data.find(d => d.date === date && d.tag === tag)
        return item ? item.count : 0
      })
      return {
        name: tag,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: tagData,
        emphasis: {
          focus: 'series'
        }
      }
    })

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        }
      },
      legend: {
        data: tags,
        type: 'scroll',
        bottom: 0,
        textStyle: {
          fontSize: 12
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '5%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates.map(d => d.slice(5)),
        axisLabel: {
          fontSize: 11,
          rotate: 30
        }
      },
      yAxis: {
        type: 'value',
        name: '题目数',
        axisLabel: {
          fontSize: 11
        }
      },
      color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#6b7280'],
      series
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

export default TagTrendChart
