import React, { useEffect, useState } from 'react'
import { Table, Tag, Progress, Empty } from 'antd'
import { analyticsAPI } from '../utils/api'
import dayjs from 'dayjs'

const GradeFeedbackTable = ({ onRefresh, externalData = null }) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(!externalData)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [hasPermission, setHasPermission] = useState(true)

  const fetchData = async (p = page, ps = pageSize) => {
    if (externalData) {
      setData(externalData.data || [])
      setTotal(externalData.total || 0)
      setHasPermission((externalData.data?.length || 0) > 0)
      if (onRefresh && externalData.refreshed_at) {
        onRefresh(externalData.refreshed_at)
      }
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const res = await analyticsAPI.getGradeFeedback({ page: p, page_size: ps })
      setData(res.data)
      setTotal(res.total)
      setHasPermission(true)
      if (onRefresh && res.refreshed_at) {
        onRefresh(res.refreshed_at)
      }
    } catch (err) {
      console.error('获取成绩反馈失败:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [externalData])

  const handlePageChange = (p, ps) => {
    if (externalData) return
    setPage(p)
    setPageSize(ps)
    fetchData(p, ps)
  }

  const getScoreColor = (score) => {
    if (score >= 90) return '#10b981'
    if (score >= 70) return '#3b82f6'
    if (score >= 60) return '#f59e0b'
    return '#ef4444'
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}分${secs}秒`
  }

  const columns = [
    {
      title: '学生',
      dataIndex: 'student_name',
      key: 'student_name',
      width: 100,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>{record.student_id}</div>
        </div>
      )
    },
    {
      title: '课程/章节',
      dataIndex: 'course',
      key: 'course',
      width: 160,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>{record.chapter}</div>
        </div>
      )
    },
    {
      title: '得分',
      dataIndex: 'score',
      key: 'score',
      width: 120,
      render: (score, record) => (
        <div>
          <div style={{ color: getScoreColor(score), fontWeight: 600, fontSize: 16 }}>
            {score.toFixed(1)}分
          </div>
          <Progress
            percent={score}
            size="small"
            strokeColor={getScoreColor(score)}
            showInfo={false}
          />
        </div>
      )
    },
    {
      title: '正确率',
      key: 'correct_rate',
      width: 100,
      render: (_, record) => (
        <span style={{ color: '#6b7280', fontSize: 12 }}>
          {record.correct_count}/{record.total_questions}题
        </span>
      )
    },
    {
      title: '用时',
      dataIndex: 'time_spent',
      key: 'time_spent',
      width: 80,
      render: (time) => (
        <span style={{ fontSize: 12, color: '#6b7280' }}>{formatTime(time)}</span>
      )
    },
    {
      title: '提交时间',
      dataIndex: 'submit_time',
      key: 'submit_time',
      width: 140,
      render: (time) => (
        <span style={{ fontSize: 12, color: '#9ca3af' }}>
          {dayjs(time).format('MM-DD HH:mm')}
        </span>
      )
    }
  ]

  if (!hasPermission) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 280 }}>
        <Empty description="暂无数据权限" />
      </div>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="student_id"
        loading={loading}
        pagination={externalData ? false : {
          current: page,
          pageSize: pageSize,
          total: total,
          onChange: handlePageChange,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          size: 'small'
        }}
        size="small"
        scroll={{ y: 240 }}
      />
    </div>
  )
}

export default GradeFeedbackTable
