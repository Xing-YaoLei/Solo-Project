import { useEffect, useState, useCallback } from 'react'
import {
  Layout, Row, Col, Card, Statistic, Button, Dropdown, Space, Avatar, Tag,
  Tooltip, message, Modal, Typography, Badge,
} from 'antd'
import {
  ReloadOutlined, UserOutlined, LogoutOutlined, ShareAltOutlined,
  DownloadOutlined, SyncOutlined, ClockCircleOutlined,
  WarningOutlined, DollarOutlined, AuditOutlined, TeamOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { useAuthStore } from '../store/auth'
import { analyticsApi, DashboardOverview, PerformanceSchedule } from '../api/analytics'
import { exportApi, dataApi } from '../api'
import SeatTrendChart from '../components/SeatTrendChart'
import SignCodeCompositionChart from '../components/SignCodeCompositionChart'
import SponsorListTable from '../components/SponsorListTable'
import AnomalyCheckinTable from '../components/AnomalyCheckinTable'
import MetricDefinitionModal from '../components/MetricDefinitionModal'
import ShareViewModal from '../components/ShareViewModal'

const { Header, Content } = Layout
const { Text, Title } = Typography

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  admin: { label: '管理员', color: 'magenta' },
  operation_manager: { label: '运营经理', color: 'blue' },
  analyst: { label: '分析师', color: 'purple' },
  viewer: { label: '查看者', color: 'default' },
}

const Dashboard = () => {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const hasRole = useAuthStore((state) => state.hasRole)

  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [schedules, setSchedules] = useState<PerformanceSchedule[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [metricOpen, setMetricOpen] = useState(false)
  const [currentMetric, setCurrentMetric] = useState<string | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(dayjs())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(dayjs()), 1000)
    return () => clearInterval(timer)
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [ov, sc] = await Promise.all([
        analyticsApi.getOverview(),
        analyticsApi.listSchedules(),
      ])
      setOverview(ov)
      setSchedules(sc)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRefreshAll = async () => {
    setRefreshing(true)
    try {
      await dataApi.refreshAll()
      message.success('数据刷新成功')
      loadData()
    } catch (e) {
      message.error('数据刷新失败，请检查接口连接')
    } finally {
      setRefreshing(false)
    }
  }

  const handleLogout = () => {
    Modal.confirm({
      title: '确认退出登录？',
      onOk: () => {
        logout()
        navigate('/login')
      },
    })
  }

  const openMetric = (code: string) => {
    setCurrentMetric(code)
    setMetricOpen(true)
  }

  const exportMenu = {
    items: [
      {
        key: 'summary',
        label: '演出排期汇总（含核销效率口径）',
        icon: <AuditOutlined />,
        disabled: !hasRole('operation_manager', 'analyst', 'admin'),
        onClick: () => exportApi.exportPerformanceSummary(),
      },
      {
        key: 'checkin',
        label: '核销异常记录',
        icon: <WarningOutlined />,
        disabled: !hasRole('operation_manager', 'analyst'),
        onClick: () => exportApi.exportCheckinRecords(),
      },
      {
        key: 'sponsor',
        label: '赞助清单明细',
        icon: <DollarOutlined />,
        disabled: !hasRole('operation_manager', 'analyst'),
        onClick: () => exportApi.exportSponsorList(),
      },
    ],
  }

  const refreshMenu = {
    items: [
      { key: 'all', label: '全部刷新', icon: <SyncOutlined />, onClick: handleRefreshAll },
      { key: 'miniapp', label: '小程序订单', onClick: () => dataApi.refreshMiniapp().then(() => { message.success('小程序订单已刷新'); loadData() }) },
      { key: 'merchant', label: '商户流水', onClick: () => dataApi.refreshMerchant().then(() => { message.success('商户流水已刷新'); loadData() }) },
      { key: 'camera', label: '摄像头统计', onClick: () => dataApi.refreshCamera().then(() => { message.success('摄像头统计已刷新'); loadData() }) },
    ],
  }

  const roleInfo = user ? ROLE_LABELS[user.role] || { label: user.role, color: 'default' } : null

  return (
    <Layout className="dashboard-layout">
      <Header className="dashboard-header" style={{ background: '#001529', padding: '0 24px', height: 64 }}>
        <Space>
          <Title level={4} style={{ color: '#fff', margin: 0 }}>
            <AuditOutlined style={{ marginRight: 8 }} />
            景区运营演出排期风险监测
          </Title>
        </Space>

        <Space size="large">
          <Space className="refresh-info" style={{ color: 'rgba(255,255,255,0.75)' }}>
            <ClockCircleOutlined />
            <span>当前时间：{currentTime.format('YYYY-MM-DD HH:mm:ss')}</span>
            {overview?.last_refresh_time && (
              <Tooltip title={`最近数据刷新：${dayjs(overview.last_refresh_time).format('YYYY-MM-DD HH:mm:ss')}`}>
                <Badge status="processing" color="#52c41a" text={`最近刷新：${dayjs(overview.last_refresh_time).fromNow()}`} />
              </Tooltip>
            )}
          </Space>

          <Dropdown menu={refreshMenu} placement="bottomRight">
            <Button icon={<ReloadOutlined spin={refreshing} />} loading={refreshing}>
              刷新数据
            </Button>
          </Dropdown>

          {hasRole('operation_manager', 'analyst', 'admin') && (
            <>
              <Button icon={<ShareAltOutlined />} onClick={() => setShareOpen(true)}>
                分享视图
              </Button>
              <Dropdown menu={exportMenu} placement="bottomRight">
                <Button type="primary" icon={<DownloadOutlined />}>
                  导出CSV
                </Button>
              </Dropdown>
            </>
          )}

          <Dropdown
            menu={{
              items: [
                { key: 'role', label: (
                  <Space>
                    <Text type="secondary">角色：</Text>
                    {roleInfo && <Tag color={roleInfo.color}>{roleInfo.label}</Tag>}
                  </Space>
                ), disabled: true },
                { type: 'divider' as const },
                { key: 'logout', label: '退出登录', icon: <LogoutOutlined />, onClick: handleLogout },
              ],
            }}
            placement="bottomRight"
          >
            <Space style={{ cursor: 'pointer', color: '#fff' }}>
              <Avatar size="small" icon={<UserOutlined />} style={{ background: '#1677ff' }} />
              <span>{user?.full_name || user?.username}</span>
            </Space>
          </Dropdown>
        </Space>
      </Header>

      <Content className="dashboard-content">
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Card loading={loading}>
              <Statistic
                title="演出排期数"
                value={overview?.total_performances || 0}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#1677ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card loading={loading}>
              <Statistic
                title={<span>已售票数 <span className="metric-link" onClick={() => openMetric('ticket_sold')}>(定义)</span></span>}
                value={overview?.total_tickets_sold || 0}
                suffix="张"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card loading={loading}>
              <Statistic
                title={<span>核销效率 <span className="metric-link" onClick={() => openMetric('checkin_efficiency')}>(口径)</span></span>}
                value={overview?.checkin_rate || 0}
                precision={2}
                suffix="%"
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card loading={loading}>
              <Statistic
                title={<span>异常核销 <span className="metric-link" onClick={() => openMetric('anomaly_rate')}>(定义)</span></span>}
                value={overview?.anomaly_count || 0}
                prefix={<WarningOutlined />}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} lg={12}>
            <SeatTrendChart schedules={schedules} loading={loading} onOpenMetric={openMetric} />
          </Col>
          <Col xs={24} lg={12}>
            <SignCodeCompositionChart schedules={schedules} loading={loading} onOpenMetric={openMetric} />
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={24}>
            <SponsorListTable schedules={schedules} loading={loading} onOpenMetric={openMetric} />
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={24}>
            <AnomalyCheckinTable schedules={schedules} loading={loading} onOpenMetric={openMetric} />
          </Col>
        </Row>
      </Content>

      <MetricDefinitionModal
        open={metricOpen}
        metricCode={currentMetric}
        onClose={() => { setMetricOpen(false); setCurrentMetric(null) }}
      />

      <ShareViewModal open={shareOpen} onClose={() => setShareOpen(false)} />
    </Layout>
  )
}

export default Dashboard
