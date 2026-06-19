import { Card, Col, Row, Statistic, Table, Tag, Progress } from 'antd'
import { ArrowUpOutlined, CalendarOutlined, UserOutlined, WarningOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { conflictApi, masterDataApi, statisticsApi } from '../services/api'
import { ConflictStatusText, ConflictTypeText } from '../types'

function DashboardPage() {
  const now = dayjs()
  const statsQuery = useQuery({
    queryKey: ['monthly-stats', now.year(), now.month() + 1],
    queryFn: () => statisticsApi.getMonthlyStatistics(now.year(), now.month() + 1).catch(() => null),
  })

  const conflictsQuery = useQuery({
    queryKey: ['active-conflicts'],
    queryFn: () => conflictApi.getActiveConflicts({ pageIndex: 1, pageSize: 10 }).catch(() => null),
  })

  const spotsQuery = useQuery({
    queryKey: ['scenic-spots'],
    queryFn: () => masterDataApi.getScenicSpots().catch(() => []),
  })

  const stats = statsQuery.data
  const conflicts = conflictsQuery.data?.items || []
  const spots = spotsQuery.data || []

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="本月预约数"
              value={stats?.totalBookings ?? 0}
              suffix="单"
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="本月到场率"
              value={stats?.arrivalRate ?? 0}
              precision={2}
              suffix="%"
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="本月游客数"
              value={stats?.totalVisitors ?? 0}
              suffix="人次"
              prefix={<ArrowUpOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="待处理冲突"
              value={stats?.conflictCount ?? conflicts.length}
              suffix="条"
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card title="本月核心指标" className="page-container">
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <div>
                  <div style={{ marginBottom: 8, color: '#666' }}>到场率</div>
                  <Progress
                    type="circle"
                    percent={Math.round((stats?.arrivalRate ?? 0) * 100) / 100}
                    strokeColor="#52c41a"
                  />
                </div>
              </Col>
              <Col span={8}>
                <div>
                  <div style={{ marginBottom: 8, color: '#666' }}>未到场率</div>
                  <Progress
                    type="circle"
                    percent={Math.round((stats?.noShowRate ?? 0) * 100) / 100}
                    strokeColor="#fa8c16"
                  />
                </div>
              </Col>
              <Col span={8}>
                <div>
                  <div style={{ marginBottom: 8, color: '#666' }}>取消率</div>
                  <Progress
                    type="circle"
                    percent={Math.round((stats?.cancellationRate ?? 0) * 100) / 100}
                    strokeColor="#999"
                  />
                </div>
              </Col>
            </Row>
            {spots.length > 0 && (
              <div>
                <h4 style={{ marginBottom: 12 }}>各景区概况</h4>
                <Table
                  size="small"
                  pagination={false}
                  dataSource={spots}
                  rowKey="id"
                  columns={[
                    { title: '景区', dataIndex: 'name', key: 'name' },
                    { title: '日容量', dataIndex: 'maxDailyCapacity', key: 'cap' },
                    { title: '营业时间', dataIndex: 'openingTime', key: 'open',
                      render: (t, r) => `${t} - ${r.closingTime}` },
                    { title: '状态', key: 'status',
                      render: (_, r) => r.isActive
                        ? <Tag color="green">营业中</Tag>
                        : <Tag color="default">暂停</Tag> },
                  ]}
                />
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title="最新冲突告警" className="page-container">
            {conflicts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                <WarningOutlined style={{ fontSize: 48, opacity: 0.3 }} />
                <div style={{ marginTop: 8 }}>暂无冲突告警</div>
              </div>
            ) : (
              <Table
                size="small"
                pagination={false}
                dataSource={conflicts}
                rowKey="id"
                columns={[
                  { title: '类型', key: 'type', width: 80,
                    render: (_, r) => <Tag color="red">{ConflictTypeText[r.conflictType]}</Tag> },
                  { title: '原因', dataIndex: 'reason', key: 'reason', ellipsis: true },
                  { title: '状态', key: 'status', width: 70,
                    render: (_, r) => {
                      const color = r.status <= 1 ? 'red' : r.status === 2 ? 'orange' : 'green'
                      return <Tag color={color}>{ConflictStatusText[r.status]}</Tag>
                    } },
                  { title: '时间', key: 'time', width: 100,
                    render: (_, r) => dayjs(r.createdAt).format('MM-DD HH:mm') },
                ]}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default DashboardPage
