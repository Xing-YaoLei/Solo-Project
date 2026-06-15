import { useEffect, useState } from 'react'
import { Row, Col, Card, Table, Progress, Tag, Space, Statistic, Empty } from 'antd'
import {
  FileSearchOutlined, TeamOutlined, ReadOutlined, CheckCircleOutlined,
  ClockCircleOutlined, WarningOutlined, CloseCircleOutlined,
} from '@ant-design/icons'
import { reviewsApi, reportsApi, notificationsApi } from '../services'
import dayjs from 'dayjs'

const statusMap = {
  pending: { label: '待处理', color: 'default', icon: <ClockCircleOutlined /> },
  under_review: { label: '复核中', color: 'processing', icon: <FileSearchOutlined /> },
  materials_missing: { label: '材料缺失', color: 'warning', icon: <WarningOutlined /> },
  approved: { label: '已通过', color: 'success', icon: <CheckCircleOutlined /> },
  rejected: { label: '已驳回', color: 'error', icon: <CloseCircleOutlined /> },
  closed: { label: '已关闭', color: 'default', icon: <CloseCircleOutlined /> },
}

export default function Dashboard() {
  const [summary, setSummary] = useState({})
  const [recentReviews, setRecentReviews] = useState([])
  const [monthlySummary, setMonthlySummary] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [reviewsRes, monthlyRes] = await Promise.all([
        reviewsApi.list({ page_size: 8 }),
        reportsApi.monthlySummary({ year: dayjs().year() }),
      ])
      const reviews = reviewsRes.data.data
      setRecentReviews(reviews)
      setMonthlySummary(monthlyRes.data)

      const counts = {
        total: reviewsRes.data.pagination.total,
        pending: reviews.filter(r => r.status === 'pending').length,
        under_review: reviews.filter(r => r.status === 'under_review').length,
        materials_missing: reviews.filter(r => r.status === 'materials_missing').length,
        approved: reviews.filter(r => r.status === 'approved').length,
        closed: reviews.filter(r => ['approved', 'rejected', 'closed'].includes(r.status)).length,
      }
      if (counts.total < reviewsRes.data.pagination.total) {
        const allRes = await reviewsApi.list({ page_size: 200 })
        const all = allRes.data.data
        counts.total = allRes.data.pagination.total
        counts.pending = all.filter(r => r.status === 'pending').length
        counts.under_review = all.filter(r => r.status === 'under_review').length
        counts.materials_missing = all.filter(r => r.status === 'materials_missing').length
        counts.approved = all.filter(r => r.status === 'approved').length
        counts.closed = all.filter(r => ['approved', 'rejected', 'closed'].includes(r.status)).length
      }
      setSummary(counts)
    } catch {}
    setLoading(false)
  }

  const columns = [
    { title: '申请编号', dataIndex: 'application_no', width: 130 },
    { title: '学生', dataIndex: 'student_name' },
    { title: '课程', dataIndex: 'course_name' },
    { title: '当前成绩', dataIndex: 'current_score', width: 90, render: v => <b>{v}</b> },
    { title: '状态', dataIndex: 'status', width: 110, render: s => {
      const cfg = statusMap[s] || {}
      return <Tag color={cfg.color} icon={cfg.icon}>{cfg.label}</Tag>
    } },
    { title: '申请时间', dataIndex: 'applied_at', width: 160, render: v => dayjs(v).format('YYYY-MM-DD HH:mm') },
  ]

  const stats = [
    { label: '复核申请总数', value: summary.total || 0, icon: <FileSearchOutlined />, color: '#1677ff' },
    { label: '待处理', value: summary.pending || 0, icon: <ClockCircleOutlined />, color: '#faad14' },
    { label: '复核中', value: summary.under_review || 0, icon: <TeamOutlined />, color: '#13c2c2' },
    { label: '材料缺失', value: summary.materials_missing || 0, icon: <WarningOutlined />, color: '#ff4d4f' },
    { label: '已通过', value: summary.approved || 0, icon: <CheckCircleOutlined />, color: '#52c41a' },
    { label: '已关闭', value: summary.closed || 0, icon: <ReadOutlined />, color: '#722ed1' },
  ]

  return (
    <div>
      <div className="page-title">工作台概览</div>
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {stats.map(s => (
          <Col xs={12} md={8} lg={4} key={s.label}>
            <Card size="small" style={{ borderTop: `3px solid ${s.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>{s.label}</div>
                  <div style={{ fontSize: 26, fontWeight: 600, marginTop: 4 }}>{s.value}</div>
                </div>
                <div style={{ fontSize: 24, color: s.color, opacity: 0.8 }}>{s.icon}</div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={16}>
        <Col xs={24} lg={14}>
          <Card title="最近的复核申请" size="small">
            <Table
              size="small"
              loading={loading}
              dataSource={recentReviews}
              columns={columns}
              rowKey="id"
              pagination={false}
              locale={{ emptyText: <Empty description="暂无数据" /> }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="本月处理进度" size="small">
            {summary.total ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>完成率</span>
                    <b>{summary.total ? Math.round(summary.closed / summary.total * 100) : 0}%</b>
                  </div>
                  <Progress percent={summary.total ? Math.round(summary.closed / summary.total * 100) : 0} status="active" />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>材料待补齐</span>
                    <b>{summary.materials_missing}</b>
                  </div>
                  <Progress percent={summary.total ? Math.round(summary.materials_missing / summary.total * 100) : 0} showInfo={false} strokeColor="#ff4d4f" />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>待处理</span>
                    <b>{summary.pending}</b>
                  </div>
                  <Progress percent={summary.total ? Math.round(summary.pending / summary.total * 100) : 0} showInfo={false} strokeColor="#faad14" />
                </div>
              </Space>
            ) : <Empty />}
          </Card>
          <Card title="月度统计（{dayjs().year()}年）" size="small" style={{ marginTop: 16 }}>
            <Table
              size="small"
              loading={loading}
              dataSource={monthlySummary.slice(-6)}
              rowKey="year_month"
              pagination={false}
              columns={[
                { title: '月份', dataIndex: 'year_month', width: 80 },
                { title: '申请数', dataIndex: 'total_reviews', width: 70 },
                { title: '通过率', width: 90, render: (_, r) => r.total_reviews ? `${Math.round(r.approved_count / r.total_reviews * 100)}%` : '-' },
                { title: '平均天数', dataIndex: 'avg_processing_days', render: v => v ? `${v}天` : '-' },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
