import { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Table, Tag, Spin, message } from 'antd'
import {
  BookOutlined,
  HomeOutlined,
  TeamOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { api } from '../services/api'
import { conflictLevelLabels, conflictStatusLabels, approvalStatusLabels } from '../utils/enumLabels'

const Dashboard = () => {
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<any>({})
  const [approvalTrend, setApprovalTrend] = useState<any[]>([])
  const [conflictSummary, setConflictSummary] = useState<any[]>([])
  const [recentConflicts, setRecentConflicts] = useState<any[]>([])
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [overviewRes, trendRes, conflictSummaryRes, conflictsRes, approvalsRes] = await Promise.all([
        api.dashboard.getOverview(),
        api.dashboard.getApprovalTrend(),
        api.dashboard.getConflictSummary(),
        api.conflicts.getList({ pageSize: 5, status: 'Pending' }),
        api.approvals.getMyTodos(),
      ])

      setOverview(overviewRes.data)
      setApprovalTrend(trendRes.data || [])
      const summary = conflictSummaryRes.data
      setConflictSummary(summary ? Object.entries(summary.byLevel || {}).map(([level, count]) => ({ level, count })) : [])
      setRecentConflicts(conflictsRes.data.items || [])
      setPendingApprovals(approvalsRes.data || [])
    } catch (error) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const getConflictLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      Low: 'success',
      Medium: 'warning',
      High: 'orange',
      Critical: 'error',
    }
    return colors[level] || 'default'
  }

  const conflictColumns = [
    {
      title: '风险等级',
      dataIndex: 'level',
      key: 'level',
      render: (level: string) => (
        <Tag color={getConflictLevelColor(level)}>{conflictLevelLabels[level as keyof typeof conflictLevelLabels]}</Tag>
      ),
    },
    {
      title: '冲突类型',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag>{conflictStatusLabels[status as keyof typeof conflictStatusLabels]}</Tag>,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ]

  const approvalColumns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const labels: Record<string, string> = {
          ScheduleApproval: '排课审批',
          ConflictResolution: '冲突处理',
          CoursePublish: '课程发布',
          Other: '其他'
        }
        return labels[type] || type
      },
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag>{approvalStatusLabels[status as keyof typeof approvalStatusLabels]}</Tag>,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ]

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic
              title="课程总数"
              value={overview.totalCourses || 0}
              prefix={<BookOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="教室数量"
              value={overview.totalClassrooms || 0}
              prefix={<HomeOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="学生总数"
              value={overview.totalStudents || 0}
              prefix={<TeamOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待处理冲突"
              value={overview.pendingConflicts || 0}
              prefix={<WarningOutlined style={{ color: '#f5222d' }} />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="审核时长趋势" extra={<Tag color="blue">管理层视图</Tag>}>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={approvalTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="avgApprovalHours"
                    name="平均审核时长(小时)"
                    stroke="#1890ff"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="approvalCount"
                    name="审核数量"
                    stroke="#52c41a"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="冲突风险分布">
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={conflictSummary}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="level" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="冲突数量" fill="#f5222d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card
            title="最近冲突"
            extra={
              <a href="#/conflicts" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <ClockCircleOutlined /> 查看全部
              </a>
            }
          >
            <Table
              columns={conflictColumns}
              dataSource={recentConflicts}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card
            title="我的待办审核"
            extra={
              <a href="#/approvals" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircleOutlined /> 查看全部
              </a>
            }
          >
            <Table
              columns={approvalColumns}
              dataSource={pendingApprovals}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
