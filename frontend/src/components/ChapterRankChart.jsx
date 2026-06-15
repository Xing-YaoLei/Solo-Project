import React, { useEffect, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { Button, Space, Radio } from 'antd'
import { analyticsAPI } from '../utils/api'

const ChapterRankChart = ({ onRefresh }) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('rate')
  const [sortBy, setSortBy] = useState('completion_rate')

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await analyticsAPI.getChapterRank({
        sort_by: sortBy,
        view_mode: viewMode
      })
      setData(res.data)
      if (onRefresh && res.refreshed_at) {
        onRefresh(res.refreshed_at)
      }
    } catch (err) {
      console.error('获取章节排行失败:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [sortBy, viewMode])

  const handleViewModeChange = (e) => {
    const newMode = e.target.value
    setViewMode(newMode)
    setSortBy(newMode === 'rate' ? 'completion_rate' : 'total_students')
  }

  const getOption = () => {
    if (!data || data.length === 0) return {}

    const sortedData = [...data].sort((a, b) => {
      if (viewMode === 'rate') {
        return b.completion_rate - a.completion_rate
      }
      return b.total_students - a.total_students
    }).slice(0, 10)

    const labels = sortedData.map(item => `${item.chapter_name}`)
    const values = viewMode === 'rate'
      ? sortedData.map(item => item.completion_rate)
      : sortedData.map(item => item.total_students)

    const completedValues = sortedData.map(item => item.completed_students)

    const maxValue = Math.max(...values) * 1.1

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: (params) => {
          const idx = params[0].dataIndex
          const item = sortedData[idx]
          return `
            <div style="padding: 4px;">
              <div style="font-weight: 600; margin-bottom: 4px;">${item.chapter_name}</div>
              <div>课程: ${item.course}</div>
              <div>学习人数: ${item.total_students}人</div>
              <div>完成人数: ${item.completed_students}人</div>
              <div>完成率: ${item.completion_rate}%</div>
              <div>平均分: ${item.avg_score}分</div>
            </div>
          `
        }
      },
      grid: {
        left: '3%',
        right: '8%',
        bottom: '3%',
        top: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        max: viewMode === 'rate' ? 100 : undefined,
        axisLabel: {
          formatter: viewMode === 'rate' ? '{value}%' : '{value}',
          fontSize: 11
        }
      },
      yAxis: {
        type: 'category',
        data: labels.reverse(),
        axisLabel: {
          fontSize: 11,
          width: 100,
          overflow: 'truncate'
        }
      },
      series: [
        {
          name: viewMode === 'rate' ? '完成率' : '学习人数',
          type: 'bar',
          data: values.reverse(),
          itemStyle: {
            color: (params) => {
              const reversedIdx = values.length - 1 - params.dataIndex
              if (reversedIdx === 0) return '#fbbf24'
              if (reversedIdx === 1) return '#9ca3af'
              if (reversedIdx === 2) return '#d97706'
              return '#3b82f6'
            },
            borderRadius: [0, 4, 4, 0]
          },
          barWidth: 16,
          label: {
            show: true,
            position: 'right',
            formatter: viewMode === 'rate' ? '{c}%' : '{c}',
            fontSize: 11,
            color: '#6b7280'
          }
        }
      ]
    }
  }

  const viewToggle = (
    <Radio.Group size="small" value={viewMode} onChange={handleViewModeChange}>
      <Radio.Button value="rate">按完成率</Radio.Button>
      <Radio.Button value="absolute">按人数</Radio.Button>
    </Radio.Group>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
        {viewToggle}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ReactECharts
          option={getOption()}
          style={{ height: '100%', minHeight: '280px' }}
          opts={{ renderer: 'canvas' }}
        />
      </div>
    </div>
  )
}

export default ChapterRankChart
