import { useQuery } from '@tanstack/react-query'
import { Row, Col, Card, Table, Tag, Button, Space } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined, WarningOutlined, InboxOutlined, QrcodeOutlined, FileTextOutlined } from '@ant-design/icons'
import { useNavigate } from '@tanstack/react-router'
import { reportApi, groupBatchApi, exceptionOrderApi } from '../api'
import { GroupBatchStatusMap, ExceptionOrderStatusMap, StatusColorMap } from '../types'
import dayjs from 'dayjs'

export default function Dashboard() {
  const navigate = useNavigate()

  const { data: performance } = useQuery({
    queryKey: ['delivery-performance'],
    queryFn: () => reportApi.getDeliveryPerformance(),
  })

  const { data: recentBatches } = useQuery({
    queryKey: ['recent-batches'],
    queryFn: () => groupBatchApi.list({ page_size: 5 }),
  })

  const { data: pendingExceptions } = useQuery({
    queryKey: ['pending-exceptions'],
    queryFn: () => exceptionOrderApi.list({ status: 'pending', page_size: 5 }),
  })

  const statCards = performance ? [
    {
      title: '履约准时率',
      value: `${performance.summary.on_time_rate}%`,
      trend: performance.summary.on_time_rate >= 95 ? 'up' : 'down',
      trendValue: `${performance.summary.on_time_rate >= 95 ? '优秀' : '需关注'}`,
      color: performance.summary.on_time_rate >= 95 ? '#52c41a' : '#fa8c16',
      icon: <InboxOutlined />,
    },
    {
      title: '到货短少率',
      value: `${performance.summary.shortage_rate}%`,
      trend: performance.summary.shortage_rate <= 2 ? 'down' : 'up',
      trendValue: `${performance.summary.shortage_rate <= 2 ? '正常' : '偏高'}`,
      color: performance.summary.shortage_rate <= 2 ? '#52c41a' : '#fa8c16',
      icon: <WarningOutlined />,
    },
    {
      title: '异常处理率',
      value: `${performance.summary.exception_resolve_rate}%`,
      trend: performance.summary.exception_resolve_rate >= 90 ? 'up' : 'down',
      trendValue: `${performance.summary.exception_resolve_rate >= 90 ? '良好' : '待提升'}`,
      color: performance.summary.exception_resolve_rate >= 90 ? '#52c41a' : '#fa8c16',
      icon: <FileTextOutlined />,
    },
    {
      title: '待处理异常',
      value: performance.summary.total_exceptions - performance.summary.closed_exceptions,
      trend: 'down',
      trendValue: '需要关注',
      color: '#ff4d4f',
      icon: <WarningOutlined />,
    },
  ] : []

  const batchColumns = [
    {
      title: '团单号',
      dataIndex: 'batch_no',
      key: 'batch_no',
      render: (text: string) => <a onClick={() => navigate({ to: `/group-batches`, search: {} })}>{text}</a>,
    },
    {
      title: '团单名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={StatusColorMap[status] as any}>{GroupBatchStatusMap[status]}</Tag>
      ),
    },
    {
      title: '预计到货',
      dataIndex: 'expected_arrival_time',
      key: 'expected_arrival_time',
      render: (time: string) => time ? dayjs(time).format('MM-DD HH:mm') : '-',
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      key: 'operator',
    },
  ]

  const exceptionColumns = [
    {
      title: '异常单号',
      dataIndex: 'exception_no',
      key: 'exception_no',
      render: (text: string) => <a onClick={() => navigate({ to: `/exception-orders`, search: {} })}>{text}</a>,
    },
    {
      title: '异常标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={StatusColorMap[status] as any}>{ExceptionOrderStatusMap[status]}</Tag>
      ),
    },
    {
      title: '责任方',
      dataIndex: 'responsibility_party',
      key: 'responsibility_party',
      render: (party: string) => ({
        supplier: '供应商',
        warehouse: '仓库',
        logistics: '物流',
        platform: '平台',
        customer: '客户',
        unknown: '待确认',
      }[party] || party),
    },
    {
      title: '上报人',
      dataIndex: 'reported_by',
      key: 'reported_by',
    },
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">工作台</h1>
        <Space>
          <Button type="primary" onClick={() => navigate({ to: '/group-batches', search: {} })}>
            团购批次管理
          </Button>
          <Button onClick={() => navigate({ to: '/exception-orders', search: {} })}>
            处理异常单
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map((card, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card className="stat-card" bordered={false}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="stat-card-title">{card.title}</div>
                  <div className="stat-card-value" style={{ color: card.color }}>
                    {card.value}
                  </div>
                  <div className="stat-card-trend">
                    {card.trend === 'up' ? (
                      <span style={{ color: '#52c41a' }}>
                        <ArrowUpOutlined /> {card.trendValue}
                      </span>
                    ) : (
                      <span style={{ color: '#ff4d4f' }}>
                        <ArrowDownOutlined /> {card.trendValue}
                      </span>
                    )}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 24,
                    color: card.color,
                    opacity: 0.3,
                  }}
                >
                  {card.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title="最近团购批次"
            extra={<a onClick={() => navigate({ to: '/group-batches', search: {} })}>查看全部</a>}
          >
            <Table
              columns={batchColumns}
              dataSource={recentBatches?.list || []}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title="待处理异常单"
            extra={<a onClick={() => navigate({ to: '/exception-orders', search: {} })}>查看全部</a>}
          >
            <Table
              columns={exceptionColumns}
              dataSource={pendingExceptions?.list || []}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {performance && (
        <Card
          title="统计口径说明"
          style={{ marginTop: 16 }}
          size="small"
        >
          <pre style={{
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            background: '#fafafa',
            padding: 16,
            borderRadius: 4,
            margin: 0,
            fontSize: 12,
            color: '#666',
          }}>
            {performance.caliber}
          </pre>
        </Card>
      )}
    </div>
  )
}
