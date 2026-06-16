import React, { useEffect, useState } from 'react'
import { Table, Tag, Badge, Space, Empty } from 'antd'
import { analyticsAPI } from '../utils/api'
import dayjs from 'dayjs'

const AnomalyAlertsTable = ({ onRefresh, externalData = null }) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(!externalData)
  const [total, setTotal] = useState(0)
  const [severityStats, setSeverityStats] = useState({})
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [hasPermission, setHasPermission] = useState(true)

  const fetchData = async (p = page, ps = pageSize) => {
    if (externalData) {
      setData(externalData.data || [])
      setTotal(externalData.total || 0)
      setSeverityStats(externalData.severity_stats || {})
      setHasPermission((externalData.data?.length || 0) > 0)
      if (onRefresh && externalData.refreshed_at) {
        onRefresh(externalData.refreshed_at)
      }
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const res = await analyticsAPI.getAnomalyAlerts({ page: p, page_size: ps })
      setData(res.data)
      setTotal(res.total)
      setSeverityStats(res.severity_stats)
      setHasPermission(true)
      if (onRefresh && res.refreshed_at) {
        onRefresh(res.refreshed_at)
      }
    } catch (err) {
      console.error('获取异常提醒失败:', err)
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

  const getSeverityColor = (severity) => {
    switch (severity) {
      case '高':
        return { color: 'red', bg: '#fef2f2' }
      case '中':
        return { color: 'orange', bg: '#fffbeb' }
      case '低':
        return { color: 'green', bg: '#f0fdf4' }
      default:
        return { color: 'default', bg: '#f3f4f6' }
    }
  }

  const columns = [
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      width: 80,
      render: (severity) => {
        const { color, bg } = getSeverityColor(severity)
        return (
          <Tag color={color} style={{ background: bg, border: 'none', borderRadius: 4 }}>
            {severity}危
          </Tag>
        )
      }
    },
    {
      title: '规则名称',
      dataIndex: 'rule_name',
      key: 'rule_name',
      width: 140,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: 13 }}>{text}</div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>{record.rule_type}</div>
        </div>
      )
    },
    {
      title: '学生',
      key: 'student',
      width: 100,
      render: (_, record) => (
        <div>
          <div style={{ fontSize: 13 }}>{record.student_name}</div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>{record.student_id}</div>
        </div>
      )
    },
    {
      title: '课程',
      dataIndex: 'course',
      key: 'course',
      width: 120,
      render: (text) => (
        <span style={{ fontSize: 12, color: '#6b7280' }}>{text}</span>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text) => (
        <span style={{ fontSize: 12, color: '#4b5563' }}>{text}</span>
      )
    },
    {
      title: '状态',
      key: 'status',
      width: 80,
      render: (_, record) => (
        <Badge
          status={record.is_resolved ? 'success' : 'warning'}
          text={record.is_resolved ? '已处理' : '待处理'}
        />
      )
    },
    {
      title: '检测时间',
      dataIndex: 'detected_at',
      key: 'detected_at',
      width: 110,
      render: (time) => (
        <span style={{ fontSize: 11, color: '#9ca3af' }}>
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

  const statsSummary = hasPermission && Object.keys(severityStats).length > 0 ? (
    <Space size={16} style={{ marginLeft: 12 }}>
      {Object.entries(severityStats).map(([level, count]) => {
        const { color } = getSeverityColor(level)
        return (
          <span key={level} style={{ fontSize: 12, color: '#6b7280' }}>
            <Tag color={color} style={{ marginRight: 4 }} />
            {level}危: {count}
          </span>
        )
      })}
    </Space>
  ) : null

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {statsSummary}
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
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

export default AnomalyAlertsTable
