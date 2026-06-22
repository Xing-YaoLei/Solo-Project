import { useState, useEffect } from 'react'
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  message,
  Tabs,
  Select,
  Space,
  Progress,
  Tag,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { TabsProps } from 'antd'
import {
  FileTextOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  SwapOutlined,
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { statisticsApi } from '../api/statistics'
import {
  DashboardSummaryDto,
  ChannelStatisticsDto,
  OwnerStatisticsDto,
  PeriodSummaryDto,
  StatusChangeSummaryDto,
  PaymentCollectionDto,
  Channel,
  QuoteStatus,
} from '../types'
import { channelLabels, statusLabels, statusColors } from '../components/quotes/QuoteList'

function Statistics() {
  const [summary, setSummary] = useState<DashboardSummaryDto | null>(null)
  const [channelStats, setChannelStats] = useState<ChannelStatisticsDto[]>([])
  const [ownerStats, setOwnerStats] = useState<OwnerStatisticsDto[]>([])
  const [periodSummary, setPeriodSummary] = useState<PeriodSummaryDto | null>(null)
  const [statusChangeSummary, setStatusChangeSummary] = useState<StatusChangeSummaryDto | null>(null)
  const [paymentCollection, setPaymentCollection] = useState<PaymentCollectionDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [periodType, setPeriodType] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly')

  const loadAllData = async () => {
    setLoading(true)
    try {
      const [
        summaryData,
        channelData,
        ownerData,
        periodData,
        statusData,
        collectionData,
      ] = await Promise.all([
        statisticsApi.getDashboard(),
        statisticsApi.getByChannel(),
        statisticsApi.getByOwner(),
        statisticsApi.getPeriodSummary(periodType),
        statisticsApi.getStatusChanges(),
        statisticsApi.getPaymentCollection(),
      ])

      setSummary(summaryData)
      setChannelStats(channelData)
      setOwnerStats(ownerData)
      setPeriodSummary(periodData)
      setStatusChangeSummary(statusData)
      setPaymentCollection(collectionData)
    } catch {
      message.error('加载统计数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllData()
  }, [periodType])

  const channelColumns: ColumnsType<ChannelStatisticsDto> = [
    {
      title: '渠道',
      dataIndex: 'channel',
      key: 'channel',
      width: 120,
      render: (v: Channel) => channelLabels[v],
    },
    { title: '报价单数量', dataIndex: 'quoteCount', key: 'quoteCount', width: 140 },
    {
      title: '报价总金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (v: number) => `¥${(v || 0).toLocaleString()}`,
    },
    {
      title: '已收款金额',
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      render: (v: number) => `¥${(v || 0).toLocaleString()}`,
    },
    {
      title: '待收款金额',
      dataIndex: 'outstandingAmount',
      key: 'outstandingAmount',
      render: (v: number) => `¥${(v || 0).toLocaleString()}`,
    },
    {
      title: '回款率',
      dataIndex: 'collectionRate',
      key: 'collectionRate',
      render: (v: number) => (
        <Progress
          percent={Math.round((v || 0) * 100)}
          size="small"
          status={v >= 0.8 ? 'success' : v >= 0.5 ? 'active' : 'exception'}
        />
      ),
    },
  ]

  const ownerColumns: ColumnsType<OwnerStatisticsDto> = [
    {
      title: '责任人',
      dataIndex: 'owner',
      key: 'owner',
      width: 120,
      render: (v?: string) => v || '-',
    },
    { title: '报价单数量', dataIndex: 'quoteCount', key: 'quoteCount', width: 140 },
    {
      title: '报价总金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (v: number) => `¥${(v || 0).toLocaleString()}`,
    },
    {
      title: '已收款金额',
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      render: (v: number) => `¥${(v || 0).toLocaleString()}`,
    },
    {
      title: '待收款金额',
      dataIndex: 'outstandingAmount',
      key: 'outstandingAmount',
      render: (v: number) => `¥${(v || 0).toLocaleString()}`,
    },
    {
      title: '逾期单数',
      dataIndex: 'overdueCount',
      key: 'overdueCount',
      render: (v: number) => (
        <span style={{ color: v > 0 ? '#cf1322' : '#3f8600' }}>{v || 0}</span>
      ),
    },
  ]

  const periodColumns: ColumnsType<{ status: QuoteStatus; count: number; amount: number }> = [
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (v: QuoteStatus) => (
        <Tag color={statusColors[v]}>{statusLabels[v]}</Tag>
      ),
    },
    { title: '数量', dataIndex: 'count', key: 'count', width: 120 },
    {
      title: '涉及金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (v: number) => `¥${(v || 0).toLocaleString()}`,
    },
  ]

  const statusChangeColumns: ColumnsType<{ fromStatus: QuoteStatus; toStatus: QuoteStatus; count: number }> = [
    {
      title: '原状态',
      dataIndex: 'fromStatus',
      key: 'fromStatus',
      width: 140,
      render: (v: QuoteStatus) => (
        <Tag color={statusColors[v]}>{statusLabels[v]}</Tag>
      ),
    },
    {
      title: '目标状态',
      dataIndex: 'toStatus',
      key: 'toStatus',
      width: 140,
      render: (v: QuoteStatus) => (
        <Tag color={statusColors[v]}>{statusLabels[v]}</Tag>
      ),
    },
    { title: '次数', dataIndex: 'count', key: 'count', width: 120 },
  ]

  const collectionDetailColumns: ColumnsType<{ quoteId: string; quoteNo: string; totalAmount: number; paidAmount: number; outstandingAmount: number; fullyPaid: boolean; collectionDays?: number }> = [
    { title: '报价单号', dataIndex: 'quoteNo', key: 'quoteNo', width: 160 },
    {
      title: '总金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (v: number) => `¥${(v || 0).toLocaleString()}`,
    },
    {
      title: '已收金额',
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      render: (v: number) => `¥${(v || 0).toLocaleString()}`,
    },
    {
      title: '待收金额',
      dataIndex: 'outstandingAmount',
      key: 'outstandingAmount',
      render: (v: number) => (
        <span style={{ color: v > 0 ? '#cf1322' : '#3f8600' }}>
          ¥{(v || 0).toLocaleString()}
        </span>
      ),
    },
    {
      title: '是否结清',
      dataIndex: 'fullyPaid',
      key: 'fullyPaid',
      render: (v: boolean) => (
        <Tag color={v ? 'green' : 'orange'}>{v ? '已结清' : '未结清'}</Tag>
      ),
    },
    {
      title: '回款天数',
      dataIndex: 'collectionDays',
      key: 'collectionDays',
      render: (v?: number) => (v ? `${v} 天` : '-'),
    },
  ]

  const renderPeriodSummary = () => (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            value={periodType}
            onChange={setPeriodType}
            style={{ width: 140 }}
            options={[
              { value: 'monthly', label: '按月' },
              { value: 'quarterly', label: '按季度' },
              { value: 'yearly', label: '按年' },
            ]}
          />
        </Space>
      </div>
      {periodSummary && (
        <>
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title="周期"
                  value={periodSummary.period}
                  valueStyle={{ fontSize: 16 }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="报价单数量"
                  value={periodSummary.totalQuotes}
                  valueStyle={{ fontSize: 16 }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="报价总金额"
                  value={periodSummary.totalAmount}
                  precision={2}
                  prefix="¥"
                  valueStyle={{ fontSize: 16 }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="已收款金额"
                  value={periodSummary.totalPaid}
                  precision={2}
                  prefix="¥"
                  valueStyle={{ color: '#3f8600', fontSize: 16 }}
                />
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={6}>
                <Statistic
                  title="已完成单数"
                  value={periodSummary.completedCount}
                  prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ color: '#52c41a', fontSize: 16 }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="异常单数"
                  value={periodSummary.exceptionCount}
                  prefix={<WarningOutlined style={{ color: '#cf1322' }} />}
                  valueStyle={{ color: '#cf1322', fontSize: 16 }}
                />
              </Col>
            </Row>
          </Card>
          <Table
            rowKey="status"
            columns={periodColumns}
            dataSource={periodSummary.statusBreakdown}
            loading={loading}
            pagination={false}
          />
        </>
      )}
    </div>
  )

  const renderStatusChanges = () => (
    <div>
      {statusChangeSummary && (
        <>
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="统计周期"
                  value={`${statusChangeSummary.periodDays} 天`}
                  valueStyle={{ fontSize: 16 }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="状态变更总数"
                  value={statusChangeSummary.totalChanges}
                  valueStyle={{ fontSize: 16 }}
                />
              </Col>
            </Row>
          </Card>
          <Table
            rowKey={(record) => `${record.fromStatus}-${record.toStatus}`}
            columns={statusChangeColumns}
            dataSource={statusChangeSummary.transitions}
            loading={loading}
            pagination={false}
          />
        </>
      )}
    </div>
  )

  const renderPaymentCollection = () => (
    <div>
      {paymentCollection && (
        <>
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card loading={loading}>
                <Statistic
                  title="报价单总数"
                  value={paymentCollection.totalQuotes}
                  valueStyle={{ fontSize: 20 }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card loading={loading}>
                <Statistic
                  title="已结清"
                  value={paymentCollection.fullyPaidCount}
                  prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ color: '#52c41a', fontSize: 20 }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card loading={loading}>
                <Statistic
                  title="部分支付"
                  value={paymentCollection.partiallyPaidCount}
                  valueStyle={{ color: '#faad14', fontSize: 20 }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card loading={loading}>
                <Statistic
                  title="未支付"
                  value={paymentCollection.notPaidCount}
                  valueStyle={{ color: '#cf1322', fontSize: 20 }}
                />
              </Card>
            </Col>
          </Row>
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={8}>
              <Card loading={loading}>
                <Statistic
                  title="平均回款天数"
                  value={paymentCollection.averageCollectionDays || 0}
                  suffix="天"
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ fontSize: 24 }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card loading={loading}>
                <Progress
                  type="dashboard"
                  percent={paymentCollection.totalQuotes > 0 ? Math.round((paymentCollection.fullyPaidCount / paymentCollection.totalQuotes) * 100) : 0}
                  size={120}
                  status="success"
                />
                <div style={{ textAlign: 'center', marginTop: 8 }}>结清率</div>
              </Card>
            </Col>
            <Col span={8}>
              <Card loading={loading}>
                <Progress
                  type="dashboard"
                  percent={paymentCollection.totalQuotes > 0 ? Math.round((paymentCollection.partiallyPaidCount / paymentCollection.totalQuotes) * 100) : 0}
                  size={120}
                  status="active"
                />
                <div style={{ textAlign: 'center', marginTop: 8 }}>部分支付率</div>
              </Card>
            </Col>
          </Row>
          <Card title="回款明细">
            <Table
              rowKey="quoteId"
              columns={collectionDetailColumns}
              dataSource={paymentCollection.details}
              loading={loading}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 900 }}
            />
          </Card>
        </>
      )}
    </div>
  )

  const tabItems: TabsProps['items'] = [
    {
      key: 'period',
      label: (
        <span>
          <CalendarOutlined /> 周期汇总
        </span>
      ),
      children: renderPeriodSummary(),
    },
    {
      key: 'channel',
      label: (
        <span>
          <SwapOutlined /> 按渠道统计
        </span>
      ),
      children: (
        <Table
          rowKey="channel"
          columns={channelColumns}
          dataSource={channelStats}
          loading={loading}
          pagination={false}
          scroll={{ x: 900 }}
        />
      ),
    },
    {
      key: 'owner',
      label: (
        <span>
          <UserOutlined /> 按责任人统计
        </span>
      ),
      children: (
        <Table
          rowKey="owner"
          columns={ownerColumns}
          dataSource={ownerStats}
          loading={loading}
          pagination={false}
          scroll={{ x: 900 }}
        />
      ),
    },
    {
      key: 'status',
      label: (
        <span>
          <FileTextOutlined /> 状态变化
        </span>
      ),
      children: renderStatusChanges(),
    },
    {
      key: 'collection',
      label: (
        <span>
          <DollarOutlined /> 回款分析
        </span>
      ),
      children: renderPaymentCollection(),
    },
  ]

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="报价单总数"
              value={summary?.totalQuoteCount || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="报价总金额"
              value={summary?.totalAmount || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="已完成报价单"
              value={summary?.completedQuoteCount || 0}
              prefix={<CheckCircleOutlined style={{ color: '#3f8600' }} />}
              valueStyle={{ color: '#3f8600', fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="本月收款金额"
              value={summary?.monthlyCollectedAmount || 0}
              precision={2}
              prefix={<DollarOutlined style={{ color: '#3f8600' }} />}
              valueStyle={{ color: '#3f8600', fontSize: 20 }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="待处理"
              value={summary?.pendingCount || 0}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14', fontSize: 18 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="异常单数"
              value={summary?.exceptionCount || 0}
              prefix={<WarningOutlined style={{ color: '#cf1322' }} />}
              valueStyle={{ color: '#cf1322', fontSize: 18 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="对账差异数"
              value={summary?.reconciliationDifferenceCount || 0}
              prefix={<SwapOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14', fontSize: 18 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="逾期单数"
              value={summary?.overdueCount || 0}
              prefix={<WarningOutlined style={{ color: '#cf1322' }} />}
              valueStyle={{ color: '#cf1322', fontSize: 18 }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs defaultActiveKey="period" items={tabItems} type="card" />
      </Card>
    </div>
  )
}

export default Statistics
