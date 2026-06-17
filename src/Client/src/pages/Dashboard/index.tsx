import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Progress, List, Tag, Spin, message, Space, Button } from 'antd'
import {
  HomeOutlined,
  TeamOutlined,
  FileTextOutlined,
  BellOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ArrowRightOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { getStatisticsOverview } from '@/services/statistics'
import type { StatisticsOverview, TodoItem } from '@/types'
import { formatDate } from '@/utils/date'

function Dashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [overview, setOverview] = useState<StatisticsOverview | null>(null)
  const [todos] = useState<TodoItem[]>([
    {
      id: 1,
      title: '待确认排程',
      description: '万科城市花园3栋201室',
      type: 'schedule',
      priority: 'high',
      status: 'pending',
      deadline: '2024-01-15',
      siteId: 1,
      siteName: '万科城市花园3栋201室'
    },
    {
      id: 2,
      title: '材料审批',
      description: '合同附件待审核',
      type: 'material',
      priority: 'high',
      status: 'pending',
      deadline: '2024-01-14',
      siteId: 2,
      siteName: '碧桂园天玺5栋1002室'
    },
    {
      id: 3,
      title: '资料完整率预警',
      description: '3个工地资料完整率低于80%',
      type: 'warning',
      priority: 'medium',
      status: 'pending',
      siteId: 3
    },
    {
      id: 4,
      title: '今日完工确认',
      description: '2个工地今日计划完工',
      type: 'schedule',
      priority: 'medium',
      status: 'pending'
    },
    {
      id: 5,
      title: '客户回访',
      description: '已完成工地客户满意度回访',
      type: 'customer',
      priority: 'low',
      status: 'done'
    }
  ])

  useEffect(() => {
    fetchOverview()
  }, [])

  const fetchOverview = async () => {
    setLoading(true)
    try {
      const data = await getStatisticsOverview()
      setOverview(data)
    } catch (error) {
      message.error('获取统计数据失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'red'
      case 'medium':
        return 'orange'
      case 'low':
        return 'green'
      default:
        return 'default'
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return '高'
      case 'medium':
        return '中'
      case 'low':
        return '低'
      default:
        return ''
    }
  }

  return (
    <div style={{ padding: '24px' }}>
      <Spin spinning={loading}>
        <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="工地总数"
                value={overview?.totalSites || 0}
                prefix={<HomeOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff' }}
              />
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>
                <Tag color="blue">待开工 {overview?.pendingSites || 0}</Tag>
                <Tag color="processing">进行中 {overview?.inProgressSites || 0}</Tag>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="待确认排程"
                value={overview?.toBeConfirmedSites || 0}
                prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14' }}
              />
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>
                已确认 {overview?.confirmedSites || 0} 个
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="资料完整率"
                value={overview?.overallCompleteRate || 0}
                suffix="%"
                precision={1}
                prefix={<FileTextOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
              <div style={{ marginTop: '8px' }}>
                <Progress
                  percent={Math.round(overview?.overallCompleteRate || 0)}
                  size="small"
                  status="active"
                />
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="待处理通知"
                value={overview?.pendingNotifications || 0}
                prefix={<BellOutlined style={{ color: '#f5222d' }} />}
                valueStyle={{ color: '#f5222d' }}
              />
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>
                今日新增 {overview?.todayNotifications || 0} 条
              </div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={14}>
            <Card
              title="资料完整率概览"
              extra={
                <Button type="link" onClick={() => navigate('/review')}>
                  查看详情 <ArrowRightOutlined />
                </Button>
              }
            >
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <div style={{ textAlign: 'center', padding: '16px' }}>
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>应提交材料</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1890ff' }}>
                      {overview?.totalMaterials || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999' }}>份</div>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ textAlign: 'center', padding: '16px' }}>
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>已通过审核</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#52c41a' }}>
                      {overview?.approvedMaterials || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999' }}>份</div>
                  </div>
                </Col>
              </Row>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <div style={{ textAlign: 'center', padding: '16px' }}>
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>已提交</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>
                      {overview?.submittedMaterials || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999' }}>份</div>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ textAlign: 'center', padding: '16px' }}>
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>缺失/待提交</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f5222d' }}>
                      {overview?.missingMaterials || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999' }}>份</div>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>

          <Col xs={24} md={10}>
            <Card
              title="待办事项"
              extra={
                <Button type="link" onClick={() => navigate('/notifications')}>
                  全部 <ArrowRightOutlined />
                </Button>
              }
            >
              <List
                dataSource={todos}
                renderItem={(item) => (
                  <List.Item
                    style={{
                      padding: '12px 0',
                      borderBottom: '1px solid #f0f0f0',
                      opacity: item.status === 'done' ? 0.6 : 1
                    }}
                  >
                    <List.Item.Meta
                      avatar={
                        item.status === 'done' ? (
                          <CheckCircleOutlined style={{ fontSize: '20px', color: '#52c41a' }} />
                        ) : item.priority === 'high' ? (
                          <ExclamationCircleOutlined style={{ fontSize: '20px', color: '#f5222d' }} />
                        ) : (
                          <ClockCircleOutlined style={{ fontSize: '20px', color: '#faad14' }} />
                        )
                      }
                      title={
                        <Space>
                          <span style={{ fontWeight: 500 }}>{item.title}</span>
                          <Tag color={getPriorityColor(item.priority)}>
                            {getPriorityText(item.priority)}
                          </Tag>
                        </Space>
                      }
                      description={
                        <div>
                          <div>{item.description}</div>
                          {item.deadline && (
                            <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                              截止日期：{formatDate(item.deadline)}
                            </div>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
          <Col xs={24} md={12}>
            <Card
              title="快速入口"
            >
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '16px',
                      borderRadius: '8px',
                      backgroundColor: '#e6f7ff',
                      cursor: 'pointer'
                    }}
                    onClick={() => navigate('/sites')}
                  >
                    <HomeOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
                    <div style={{ marginTop: '8px', fontSize: '14px' }}>工地管理</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '16px',
                      borderRadius: '8px',
                      backgroundColor: '#f6ffed',
                      cursor: 'pointer'
                    }}
                    onClick={() => navigate('/customers')}
                  >
                    <TeamOutlined style={{ fontSize: '32px', color: '#52c41a' }} />
                    <div style={{ marginTop: '8px', fontSize: '14px' }}>客户档案</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '16px',
                      borderRadius: '8px',
                      backgroundColor: '#fff7e6',
                      cursor: 'pointer'
                    }}
                    onClick={() => navigate('/materials')}
                  >
                    <FileTextOutlined style={{ fontSize: '32px', color: '#faad14' }} />
                    <div style={{ marginTop: '8px', fontSize: '14px' }}>材料字典</div>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card title="状态分布">
              <Row gutter={[8, 8]}>
                <Col span={12}>
                  <Progress
                    type="dashboard"
                    percent={Math.round(((overview?.pendingSites || 0) / (overview?.totalSites || 1)) * 100)}
                    format={() => `待开工 ${overview?.pendingSites || 0}`}
                    size="small"
                  />
                </Col>
                <Col span={12}>
                  <Progress
                    type="dashboard"
                    percent={Math.round(((overview?.inProgressSites || 0) / (overview?.totalSites || 1)) * 100)}
                    format={() => `进行中 ${overview?.inProgressSites || 0}`}
                    size="small"
                    status="active"
                  />
                </Col>
                <Col span={12}>
                  <Progress
                    type="dashboard"
                    percent={Math.round(((overview?.toBeConfirmedSites || 0) / (overview?.totalSites || 1)) * 100)}
                    format={() => `待确认 ${overview?.toBeConfirmedSites || 0}`}
                    size="small"
                    strokeColor="#faad14"
                  />
                </Col>
                <Col span={12}>
                  <Progress
                    type="dashboard"
                    percent={Math.round(((overview?.completedSites || 0) / (overview?.totalSites || 1)) * 100)}
                    format={() => `已完成 ${overview?.completedSites || 0}`}
                    size="small"
                    strokeColor="#52c41a"
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  )
}

export default Dashboard
