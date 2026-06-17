import { useState } from 'react'
import {
  Card,
  Typography,
  Tabs,
  Table,
  DatePicker,
  Select,
  Space,
  Row,
  Col,
  Statistic,
  Progress,
  Tag,
  Button,
  Alert,
  Spin,
  Descriptions,
  List,
  Empty,
} from 'antd'
import { useQuery } from '@tanstack/react-query'
import {
  BarChartOutlined,
  MoneyCollectOutlined,
  WarningOutlined,
  ProjectOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { statisticsApi } from '@/api'
import {
  formatCurrency,
  documentStatusColors,
  documentStatusLabels,
  documentTypeLabels,
  amountConsistencyColors,
  amountConsistencyLabels,
} from '@/config/status'
import { AmountConsistencyStatus, type PaymentCycle, type ProjectPerformance, type AmountInconsistency } from '@/types'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

const StatisticsPage: React.FC = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  const [inconsistencyStatus, setInconsistencyStatus] = useState<AmountConsistencyStatus | undefined>()

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['statistics', 'overview'],
    queryFn: () => statisticsApi.getOverview(),
  })

  const { data: paymentCycles, isLoading: cyclesLoading } = useQuery({
    queryKey: ['statistics', 'payment-cycles', dateRange],
    queryFn: () =>
      statisticsApi.getPaymentCycles({
        startDate: dateRange?.[0]?.toISOString(),
        endDate: dateRange?.[1]?.toISOString(),
      }),
  })

  const { data: projectPerformance, isLoading: performanceLoading } = useQuery({
    queryKey: ['statistics', 'project-performance', dateRange],
    queryFn: () =>
      statisticsApi.getProjectPerformance({
        startDate: dateRange?.[0]?.toISOString(),
        endDate: dateRange?.[1]?.toISOString(),
      }),
  })

  const { data: amountInconsistencies, isLoading: inconsistenciesLoading } = useQuery({
    queryKey: ['statistics', 'amount-inconsistencies', dateRange, inconsistencyStatus],
    queryFn: () =>
      statisticsApi.getAmountInconsistencies({
        status: inconsistencyStatus,
        startDate: dateRange?.[0]?.toISOString(),
        endDate: dateRange?.[1]?.toISOString(),
      }),
  })

  const cycleColumns: ColumnsType<PaymentCycle> = [
    {
      title: '周期',
      dataIndex: 'period',
      key: 'period',
      width: 120,
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: '关联项目',
      dataIndex: 'projectCount',
      key: 'projectCount',
      width: 110,
      render: (value) => (
        <Space>
          <Tag color="blue">{value} 个</Tag>
          {value > 0 && (
            <Text type="secondary">(展开查看)</Text>
          )}
        </Space>
      ),
    },
    {
      title: '关联单据',
      key: 'documentCount',
      width: 110,
      render: (_, record) => (
        <Space>
          <Tag color="geekblue">{record.documents?.length || 0} 张</Tag>
          {record.documents && record.documents.length > 0 && (
            <Text type="secondary">(展开查看)</Text>
          )}
        </Space>
      ),
    },
    {
      title: '预期金额',
      dataIndex: 'expectedAmount',
      key: 'expectedAmount',
      width: 140,
      render: (value) => formatCurrency(value),
    },
    {
      title: '实际到账',
      dataIndex: 'actualPaid',
      key: 'actualPaid',
      width: 140,
      render: (value, record) => (
        <div>
          <Text strong style={{ color: value >= record.expectedAmount * 0.9 ? '#52c41a' : '#faad14' }}>
            {formatCurrency(value)}
          </Text>
        </div>
      ),
    },
    {
      title: '到账率',
      key: 'paymentRate',
      width: 180,
      render: (_, record) => {
        const rate = record.expectedAmount > 0 ? (record.actualPaid / record.expectedAmount) * 100 : 0
        return (
          <Progress
            percent={Math.min(rate, 100)}
            format={(percent) => `${percent?.toFixed(1)}%`}
            size="small"
            strokeColor={
              rate >= 90 ? '#52c41a' :
              rate >= 70 ? '#faad14' :
              '#ff4d4f'
            }
          />
        )
      },
    },
    {
      title: '平均回款天数',
      dataIndex: 'averagePaymentDays',
      key: 'averagePaymentDays',
      width: 120,
      render: (value) => (
        <span style={{ color: value > 30 ? '#ff4d4f' : value > 15 ? '#faad14' : '#52c41a' }}>
          <ClockCircleOutlined /> {value} 天
        </span>
      ),
    },
  ]

  const expandedCycleRowRender = (record: PaymentCycle) => (
    <Space direction="vertical" size="large" style={{ width: '100%', padding: '8px 16px' }}>
      {record.projects && record.projects.length > 0 && (
        <Card size="small" title={`关联项目 (${record.projects.length})`}>
          <List
            dataSource={record.projects}
            size="small"
            grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
            renderItem={(project) => (
              <List.Item key={project.projectId}>
                <Card hoverable size="small">
                  <List.Item.Meta
                    title={
                      <Button type="link" onClick={() => navigate(`/projects/${project.projectId}`)}>
                        {project.projectName}
                      </Button>
                    }
                    description={
                      <Tag color="blue">{project.projectNumber}</Tag>
                    }
                  />
                </Card>
              </List.Item>
            )}
          />
        </Card>
      )}

      {record.documents && record.documents.length > 0 && (
        <Card size="small" title={`关联单据 (${record.documents.length})`}>
          <List
            dataSource={record.documents}
            size="small"
            renderItem={(doc) => (
              <List.Item
                key={doc.documentId}
                actions={[
                  <Button
                    key="view"
                    type="link"
                    size="small"
                    onClick={() => navigate(`/documents/${doc.documentId}`)}
                  >
                    查看详情
                  </Button>,
                  <Button
                    key="project"
                    type="link"
                    size="small"
                    onClick={() => navigate(`/projects/${doc.projectId}`)}
                  >
                    所属项目
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Button type="link" onClick={() => navigate(`/documents/${doc.documentId}`)}>
                        <FileTextOutlined /> {doc.documentNumber}
                      </Button>
                      <Text strong>{doc.title}</Text>
                      <Tag color="geekblue">
                        {documentTypeLabels[doc.type]}
                      </Tag>
                    </Space>
                  }
                  description={
                    <Space>
                      <Text type="secondary">所属项目:</Text>
                      <Button type="link" size="small" onClick={() => navigate(`/projects/${doc.projectId}`)}>
                        {doc.projectName}
                      </Button>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      {(!record.projects || record.projects.length === 0) && (!record.documents || record.documents.length === 0) && (
        <Empty description="该周期暂无关联的项目和单据数据" />
      )}
    </Space>
  )

  const performanceColumns: ColumnsType<ProjectPerformance> = [
    {
      title: '项目编号',
      dataIndex: 'projectNumber',
      key: 'projectNumber',
      width: 120,
      render: (text, record) => (
        <Button type="link" onClick={() => navigate(`/projects/${record.projectId}`)}>
          {text}
        </Button>
      ),
    },
    {
      title: '项目名称',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 180,
      ellipsis: true,
    },
    {
      title: '业主',
      dataIndex: 'ownerName',
      key: 'ownerName',
      width: 100,
    },
    {
      title: '总预算',
      dataIndex: 'totalBudget',
      key: 'totalBudget',
      width: 130,
      render: (value) => <Text strong>{formatCurrency(value)}</Text>,
    },
    {
      title: '已支付',
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      width: 130,
      render: (value) => <Text style={{ color: '#52c41a' }}>{formatCurrency(value)}</Text>,
    },
    {
      title: '待支付',
      dataIndex: 'remainingAmount',
      key: 'remainingAmount',
      width: 130,
      render: (value) => <Text style={{ color: '#faad14' }}>{formatCurrency(value)}</Text>,
    },
    {
      title: '支付进度',
      key: 'paymentProgress',
      width: 180,
      render: (_, record) => {
        const progress = record.totalBudget > 0 ? (record.paidAmount / record.totalBudget) * 100 : 0
        return (
          <Progress
            percent={progress}
            format={(percent) => `${percent?.toFixed(1)}%`}
            size="small"
          />
        )
      },
    },
    {
      title: '付款次数',
      dataIndex: 'paymentCount',
      key: 'paymentCount',
      width: 100,
      render: (value) => <Tag color="blue">{value} 次</Tag>,
    },
    {
      title: '平均延迟',
      dataIndex: 'paymentDelayDays',
      key: 'paymentDelayDays',
      width: 110,
      render: (value) => (
        <span style={{ color: value > 0 ? '#ff4d4f' : '#52c41a' }}>
          {value > 0 ? <ArrowDownOutlined /> : <ArrowUpOutlined />} {Math.abs(value)} 天
        </span>
      ),
    },
  ]

  const inconsistencyColumns: ColumnsType<AmountInconsistency> = [
    {
      title: '单据编号',
      dataIndex: 'documentNumber',
      key: 'documentNumber',
      width: 130,
      render: (text, record) => (
        <Button type="link" onClick={() => navigate(`/documents/${record.documentId}`)}>
          {text}
        </Button>
      ),
    },
    {
      title: '单据标题',
      dataIndex: 'title',
      key: 'title',
      width: 180,
      ellipsis: true,
    },
    {
      title: '所属项目',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 160,
      ellipsis: true,
    },
    {
      title: '预期金额',
      dataIndex: 'expectedAmount',
      key: 'expectedAmount',
      width: 130,
      render: (value) => <Text delete type="secondary">{formatCurrency(value)}</Text>,
    },
    {
      title: '实际金额',
      dataIndex: 'actualAmount',
      key: 'actualAmount',
      width: 130,
      render: (value) => value ? <Text strong>{formatCurrency(value)}</Text> : '-',
    },
    {
      title: '差额',
      dataIndex: 'difference',
      key: 'difference',
      width: 140,
      render: (value) => (
        <Text strong className="amount-difference">
          <ExclamationCircleOutlined /> {formatCurrency(Math.abs(value))}
        </Text>
      ),
      sorter: (a, b) => Math.abs(a.difference) - Math.abs(b.difference),
    },
    {
      title: '差异比例',
      dataIndex: 'differencePercentage',
      key: 'differencePercentage',
      width: 110,
      render: (value) => (
        <Tag color="red">
          <WarningOutlined /> {value}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={amountConsistencyColors[status as AmountConsistencyStatus]}>
          {amountConsistencyLabels[status as AmountConsistencyStatus]}
        </Tag>
      ),
      filters: Object.values(AmountConsistencyStatus).map((s) => ({
        text: amountConsistencyLabels[s],
        value: s,
      })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '创建人',
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: 100,
    },
    {
      title: '创建日期',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      render: (date) => dayjs(date).format('YYYY-MM-DD'),
    },
  ]

  const tabItems = [
    {
      key: 'overview',
      label: (
        <span>
          <BarChartOutlined /> 数据概览
        </span>
      ),
      children: overviewLoading ? (
        <div style={{ textAlign: 'center', padding: 100 }}>
          <Spin size="large" />
        </div>
      ) : overview ? (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card className="stat-card" hoverable>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 12,
                      background: '#1890ff15',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ProjectOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                  </div>
                  <div>
                    <Statistic
                      title={<span style={{ color: '#8c8c8c', fontSize: 13 }}>总项目数</span>}
                      value={overview.totalProjects}
                      valueStyle={{ fontSize: 24, fontWeight: 600, color: '#1890ff' }}
                    />
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="stat-card" hoverable>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 12,
                      background: '#52c41a15',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ProjectOutlined style={{ fontSize: 32, color: '#52c41a' }} />
                  </div>
                  <div>
                    <Statistic
                      title={<span style={{ color: '#8c8c8c', fontSize: 13 }}>进行中项目</span>}
                      value={overview.activeProjects}
                      valueStyle={{ fontSize: 24, fontWeight: 600, color: '#52c41a' }}
                    />
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="stat-card" hoverable>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 12,
                      background: '#faad1415',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FileTextOutlined style={{ fontSize: 32, color: '#faad14' }} />
                  </div>
                  <div>
                    <Statistic
                      title={<span style={{ color: '#8c8c8c', fontSize: 13 }}>待审批单据</span>}
                      value={overview.pendingApprovals}
                      valueStyle={{ fontSize: 24, fontWeight: 600, color: '#faad14' }}
                    />
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="stat-card" hoverable>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 12,
                      background: '#ff4d4f15',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ExclamationCircleOutlined style={{ fontSize: 32, color: '#ff4d4f' }} />
                  </div>
                  <div>
                    <Statistic
                      title={<span style={{ color: '#8c8c8c', fontSize: 13 }}>金额不一致</span>}
                      value={overview.inconsistentDocuments}
                      valueStyle={{ fontSize: 24, fontWeight: 600, color: '#ff4d4f' }}
                    />
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Card className="stat-card" hoverable>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 12,
                      background: '#722ed115',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MoneyCollectOutlined style={{ fontSize: 32, color: '#722ed1' }} />
                  </div>
                  <div>
                    <Statistic
                      title={<span style={{ color: '#8c8c8c', fontSize: 13 }}>总预算</span>}
                      value={overview.totalBudget}
                      precision={2}
                      prefix="¥"
                      valueStyle={{ fontSize: 20, fontWeight: 600, color: '#722ed1' }}
                    />
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card className="stat-card" hoverable>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 12,
                      background: '#13c2c215',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ArrowUpOutlined style={{ fontSize: 32, color: '#13c2c2' }} />
                  </div>
                  <div>
                    <Statistic
                      title={<span style={{ color: '#8c8c8c', fontSize: 13 }}>已收款</span>}
                      value={overview.totalPaid}
                      precision={2}
                      prefix="¥"
                      valueStyle={{ fontSize: 20, fontWeight: 600, color: '#13c2c2' }}
                    />
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card className="stat-card" hoverable>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 12,
                      background: '#eb2f9615',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ArrowDownOutlined style={{ fontSize: 32, color: '#eb2f96' }} />
                  </div>
                  <div>
                    <Statistic
                      title={<span style={{ color: '#8c8c8c', fontSize: 13 }}>待收款</span>}
                      value={overview.totalReceivable}
                      precision={2}
                      prefix="¥"
                      valueStyle={{ fontSize: 20, fontWeight: 600, color: '#eb2f96' }}
                    />
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          <Card title="收款进度总览">
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} md={18}>
                <Progress
                  percent={
                    overview.totalBudget > 0
                      ? (overview.totalPaid / overview.totalBudget) * 100
                      : 0
                  }
                  format={(percent) =>
                    `${percent?.toFixed(1)}% (${formatCurrency(overview.totalPaid)} / ${formatCurrency(overview.totalBudget)})`
                  }
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                  size={20}
                />
              </Col>
              <Col xs={24} md={6}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="收款率">
                    <Text strong style={{ color: '#52c41a', fontSize: 18 }}>
                      {overview.totalBudget > 0
                        ? ((overview.totalPaid / overview.totalBudget) * 100).toFixed(1)
                        : 0}
                      %
                    </Text>
                  </Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>
          </Card>

          {overview.inconsistentDocuments > 0 && (
            <Alert
              message={`有 ${overview.inconsistentDocuments} 张单据存在金额不一致`}
              description="请及时核查并处理金额不一致的单据，确保财务数据准确"
              type="warning"
              showIcon
              action={
                <Button size="small" type="primary" onClick={() => setActiveTab('inconsistencies')}>
                  立即处理
                </Button>
              }
            />
          )}

          {overview.pendingApprovals > 0 && (
            <Alert
              message={`有 ${overview.pendingApprovals} 张单据待审批`}
              description="请及时审批待处理的单据，确保项目进度不受影响"
              type="info"
              showIcon
              action={
                <Button size="small" type="primary" onClick={() => navigate('/documents?status=PendingApproval')}>
                  去审批
                </Button>
              }
            />
          )}
        </Space>
      ) : null,
    },
    {
      key: 'payment-cycles',
      label: (
        <span>
          <MoneyCollectOutlined /> 款项周期
        </span>
      ),
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card
            extra={
              <Space>
                <RangePicker
                  value={dateRange}
                  onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
                />
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => setDateRange(null)}
                >
                  重置
                </Button>
              </Space>
            }
          >
            <Table
              columns={cycleColumns}
              dataSource={paymentCycles || []}
              rowKey="period"
              loading={cyclesLoading}
              pagination={false}
              expandable={{
                expandedRowRender: expandedCycleRowRender,
                rowExpandable: (record) => 
                  (record.projects && record.projects.length > 0) || 
                  (record.documents && record.documents.length > 0),
              }}
            />
          </Card>
        </Space>
      ),
    },
    {
      key: 'project-performance',
      label: (
        <span>
          <ProjectOutlined /> 项目绩效
        </span>
      ),
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card
            extra={
              <Space>
                <RangePicker
                  value={dateRange}
                  onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
                />
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => setDateRange(null)}
                >
                  重置
                </Button>
              </Space>
            }
          >
            <Table
              columns={performanceColumns}
              dataSource={projectPerformance || []}
              rowKey="projectId"
              loading={performanceLoading}
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
              }}
              scroll={{ x: 1300 }}
              expandable={{
                expandedRowRender: (record) => (
                  <Card size="small" title={`相关单据 (${record.documents.length})`}>
                    <List
                      dataSource={record.documents}
                      size="small"
                      renderItem={(doc) => (
                        <List.Item key={doc.documentId}>
                          <List.Item.Meta
                            title={
                              <Space>
                                <Button
                                  type="link"
                                  size="small"
                                  onClick={() => navigate(`/documents/${doc.documentId}`)}
                                >
                                  {doc.documentNumber}
                                </Button>
                                <Text>{doc.title}</Text>
                                <Tag color={amountConsistencyColors[doc.amountConsistency]}>
                                  {amountConsistencyLabels[doc.amountConsistency]}
                                </Tag>
                              </Space>
                            }
                            description={
                              <Space>
                                <Text type="secondary">{documentTypeLabels[doc.type]}</Text>
                                <Text>预期: {formatCurrency(doc.expectedAmount)}</Text>
                                {doc.actualAmount && (
                                  <Text>实际: {formatCurrency(doc.actualAmount)}</Text>
                                )}
                                <Tag color={documentStatusColors[doc.status]}>
                                  {documentStatusLabels[doc.status]}
                                </Tag>
                                <Text type="secondary">
                                  {dayjs(doc.createdAt).format('YYYY-MM-DD')}
                                </Text>
                              </Space>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  </Card>
                ),
              }}
            />
          </Card>
        </Space>
      ),
    },
    {
      key: 'inconsistencies',
      label: (
        <span>
          <WarningOutlined /> 金额不一致
        </span>
      ),
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card
            extra={
              <Space>
                <Select
                  placeholder="筛选状态"
                  value={inconsistencyStatus}
                  onChange={setInconsistencyStatus}
                  style={{ width: 160 }}
                  allowClear
                  options={Object.values(AmountConsistencyStatus).map((s) => ({
                    value: s,
                    label: amountConsistencyLabels[s],
                  }))}
                />
                <RangePicker
                  value={dateRange}
                  onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
                />
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    setDateRange(null)
                    setInconsistencyStatus(undefined)
                  }}
                >
                  重置
                </Button>
              </Space>
            }
          >
            <Table
              columns={inconsistencyColumns}
              dataSource={amountInconsistencies || []}
              rowKey="documentId"
              loading={inconsistenciesLoading}
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
              }}
              scroll={{ x: 1400 }}
              rowClassName={() => 'inconsistent-row'}
            />
          </Card>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <Title level={3} style={{ marginBottom: 8 }}>
          统计分析
        </Title>
        <Text type="secondary">多维度数据分析，助力业务决策</Text>
      </div>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>
    </div>
  )
}

export default StatisticsPage
