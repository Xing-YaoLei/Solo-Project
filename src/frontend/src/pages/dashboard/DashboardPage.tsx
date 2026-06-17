import { Card, Row, Col, Statistic, Typography, Spin, Alert, List, Tag, Button } from 'antd'
import { useQuery } from '@tanstack/react-query'
import {
  ProjectOutlined,
  FileTextOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  MoneyCollectOutlined,
  ClockCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons'
import { statisticsApi, documentApi, projectApi } from '@/api'
import { formatCurrency, documentStatusColors, documentStatusLabels } from '@/config/status'
import { AmountConsistencyStatus } from '@/types'
import { useNavigate } from 'react-router-dom'

const { Title, Text } = Typography

const DashboardPage: React.FC = () => {
  const navigate = useNavigate()

  const {
    data: overview,
    isLoading: overviewLoading,
    error: overviewError,
  } = useQuery({
    queryKey: ['statistics', 'overview'],
    queryFn: () => statisticsApi.getOverview(),
  })

  const { data: recentDocuments } = useQuery({
    queryKey: ['documents', 'recent'],
    queryFn: () => documentApi.getDocuments({ pageSize: 5 }),
  })

  const { data: recentProjects } = useQuery({
    queryKey: ['projects', 'recent'],
    queryFn: () => projectApi.getProjects({ pageSize: 5 }),
  })

  if (overviewLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (overviewError || !overview) {
    return <Alert type="error" message="加载数据失败，请稍后重试" />
  }

  const stats = [
    {
      title: '总项目数',
      value: overview.totalProjects,
      icon: <ProjectOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
      color: '#1890ff',
      link: '/projects',
    },
    {
      title: '进行中项目',
      value: overview.activeProjects,
      icon: <ClockCircleOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
      color: '#52c41a',
      link: '/projects',
    },
    {
      title: '待审批单据',
      value: overview.pendingApprovals,
      icon: <FileTextOutlined style={{ fontSize: 32, color: '#faad14' }} />,
      color: '#faad14',
      link: '/documents',
    },
    {
      title: '金额不一致',
      value: overview.inconsistentDocuments,
      icon: <WarningOutlined style={{ fontSize: 32, color: '#ff4d4f' }} />,
      color: '#ff4d4f',
      link: '/documents?amountConsistency=Inconsistent',
    },
    {
      title: '总预算',
      value: formatCurrency(overview.totalBudget),
      icon: <MoneyCollectOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
      color: '#722ed1',
      suffix: <ArrowUpOutlined style={{ fontSize: 14, color: '#52c41a' }} />,
    },
    {
      title: '已收款',
      value: formatCurrency(overview.totalPaid),
      icon: <CheckCircleOutlined style={{ fontSize: 32, color: '#13c2c2' }} />,
      color: '#13c2c2',
      suffix: <ArrowUpOutlined style={{ fontSize: 14, color: '#52c41a' }} />,
    },
    {
      title: '待收款',
      value: formatCurrency(overview.totalReceivable),
      icon: <ArrowDownOutlined style={{ fontSize: 32, color: '#eb2f96' }} />,
      color: '#eb2f96',
      link: '/payments',
    },
  ]

  return (
    <div>
      <div className="page-header">
        <Title level={3} style={{ marginBottom: 8 }}>
          仪表盘
        </Title>
        <Text type="secondary">欢迎回来，这是您的业务概览</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} md={8} lg={6} xl={6} key={index}>
            <Card
              className="stat-card"
              hoverable
              onClick={() => stat.link && navigate(stat.link)}
              style={{ cursor: stat.link ? 'pointer' : 'default' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    background: `${stat.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {stat.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <Statistic
                    title={<span style={{ color: '#8c8c8c', fontSize: 13 }}>{stat.title}</span>}
                    value={stat.value}
                    valueStyle={{ fontSize: 24, fontWeight: 600, color: stat.color }}
                    suffix={stat.suffix}
                  />
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title="最近项目"
            extra={
              <Button type="link" onClick={() => navigate('/projects')}>
                查看全部
              </Button>
            }
          >
            <List
              dataSource={recentProjects?.items || []}
              loading={!recentProjects}
              renderItem={(item) => (
                <List.Item
                  key={item.id}
                  actions={[
                    <Tag color={documentStatusColors[item.status]} key="status">
                      {documentStatusLabels[item.status]}
                    </Tag>,
                    <Button type="link" size="small" onClick={() => navigate(`/projects/${item.id}`)}>
                      详情
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={item.name}
                    description={
                      <div>
                        <Text type="secondary">{item.projectNumber}</Text>
                        <div style={{ marginTop: 4 }}>
                          <Text type="secondary">{item.address}</Text>
                        </div>
                        <div style={{ marginTop: 4 }}>
                          <Text strong>{formatCurrency(item.totalBudget)}</Text>
                          <Text type="secondary" style={{ marginLeft: 8 }}>
                            已付: {formatCurrency(item.paidAmount)}
                          </Text>
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title="最近单据"
            extra={
              <Button type="link" onClick={() => navigate('/documents')}>
                查看全部
              </Button>
            }
          >
            <List
              dataSource={recentDocuments?.items || []}
              loading={!recentDocuments}
              renderItem={(item) => (
                <List.Item
                  key={item.id}
                  style={{
                    background:
                      item.amountConsistency === AmountConsistencyStatus.Inconsistent
                        ? '#fff2f0'
                        : item.status === 'PendingApproval' || item.status === 'PendingReview'
                        ? '#fffbe6'
                        : 'transparent',
                  }}
                  actions={[
                    <Tag color={documentStatusColors[item.status]} key="status">
                      {documentStatusLabels[item.status]}
                    </Tag>,
                    item.amountConsistency === AmountConsistencyStatus.Inconsistent && (
                      <Tag color="red" key="inconsistent">
                        金额不一致
                      </Tag>
                    ),
                    <Button type="link" size="small" onClick={() => navigate(`/documents/${item.id}`)}>
                      详情
                    </Button>,
                  ].filter(Boolean)}
                >
                  <List.Item.Meta
                    title={item.title}
                    description={
                      <div>
                        <Text type="secondary">
                          {item.documentNumber} · {item.projectName}
                        </Text>
                        <div style={{ marginTop: 4 }}>
                          <span className={item.amountDifference !== 0 ? 'amount-difference' : 'amount-consistent'}>
                            预期: {formatCurrency(item.expectedAmount)}
                          </span>
                          {item.actualAmount && (
                            <span style={{ marginLeft: 8 }}>
                              实际: {formatCurrency(item.actualAmount)}
                            </span>
                          )}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default DashboardPage
