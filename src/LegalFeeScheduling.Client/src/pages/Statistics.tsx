import { useState, useEffect } from 'react'
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  message,
  Tabs,
  DatePicker,
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
  StatisticsSummary,
  ChannelStatistics,
  OwnerStatistics,
  PeriodSummaryDto,
  StatusChangeSummaryDto,
  PaymentCollectionDto,
  Channel,
  QuoteStatus,
} from '../types'
import { channelLabels, statusLabels, statusColors } from '../components/quotes/QuoteList'
import type { Dayjs } from 'dayjs'

const { RangePicker } = DatePicker

function Statistics() {
  const [summary, setSummary] = useState<StatisticsSummary | null>(null)
  const [channelStats, setChannelStats] = useState<ChannelStatistics[]>([])
  const [ownerStats, setOwnerStats] = useState<OwnerStatistics[]>([])
  const [periodSummary, setPeriodSummary] = useState<PeriodSummaryDto[]>([])
  const [statusChangeSummary, setStatusChangeSummary] = useState<StatusChangeSummaryDto[]>([])
  const [paymentCollection, setPaymentCollection] = useState<PaymentCollectionDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)
  const [periodType, setPeriodType] = useState<'day' | 'week' | 'month' | 'quarter' | 'year'>('month')

  const loadAllData = async () => {
    setLoading(true)
    try {
      const params = {
        startDate: dateRange?.[0]?.format('YYYY-MM-DD'),
        endDate: dateRange?.[1]?.format('YYYY-MM-DD'),
      }

      const [
        summaryData,
        channelData,
        ownerData,
        periodData,
        statusData,
        collectionData,
      ] = await Promise.all([
        statisticsApi.getSummary(),
        statisticsApi.getByChannel(),
        statisticsApi.getByOwner(),
        statisticsApi.getPeriodSummary({ ...params, period: periodType }),
        statisticsApi.getStatusChangeSummary(params),
        statisticsApi.getPaymentCollectionAnalysis(params),
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
  }, [dateRange, periodType])

  const channelColumns: ColumnsType<ChannelStatistics> = [
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
  ]

  const ownerColumns: ColumnsType<OwnerStatistics> = [
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
      dataIndex: 'totalPaid',
      key: 'totalPaid',
      render: (v: number) => `¥${(v || 0).toLocaleString()}`,
    },
    {
      title: '回款率',
      key: 'rate',
      render: (_: any, record: OwnerStatistics) => {
        const rate = record.totalAmount > 0 ? (record.totalPaid / record.totalAmount) * 100 : 0
        return (
          <Progress
            percent={Math.round(rate)}
            size="small"
            status={rate >= 80 ? 'success' : rate >= 50 ? 'active' : 'exception'}
          />
        )
      },
    },
  ]

  const periodColumns: ColumnsType<PeriodSummaryDto> = [
    { title: '周期', dataIndex: 'period', key: 'period', width: 160 },
    { title: '报价单数量', dataIndex: 'quoteCount', key: 'quoteCount', width: 120 },
    {
      title: '报价总金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (v: number) => `¥${(v || 0).toLocaleString()}`,
    },
    {
      title: '已收款金额',
      dataIndex: 'totalPaid',
      key: 'totalPaid',
      render: (v: number) => `¥${(v || 0).toLocaleString()}`,
    },
    {
      title: '待收款金额',
      dataIndex: 'pendingAmount',
      key: 'pendingAmount',
      render: (v: number) => (
        <span style={{ color: v > 0 ? '#cf1322' : '#3f8600' }}>
          ¥{(v || 0).toLocaleString()}
        </span>
      ),
    },
  ]

  const statusColumns: ColumnsType<StatusChangeSummaryDto> = [
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
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (v: number) => `¥${(v || 0).toLocaleString()}`,
    },
  ]

  const renderPeriodSummary = () => (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space wrap>
          <RangePicker
            value={dateRange as any}
            onChange={(dates) =>
              setDateRange(dates as [Dayjs | null, Dayjs | null] | null)
            }
          />
          <Select
            value={periodType}
            onChange={setPeriodType}
            style={{ width: 140 }}
            options={[
              { value: 'day', label: '按日' },
              { value: 'week', label: '按周' },
              { value: 'month', label: '按月' },
              { value: 'quarter', label: '按季度' },
              { value: 'year', label: '按年' },
            ]}
          />
        </Space>
      </div>
      <Table
        rowKey="period"
        columns={periodColumns}
        dataSource={periodSummary}
        loading={loading}
        pagination={false}
      />
    </div>
  )

  const renderPaymentCollection = () => (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="平均回款天数"
              value={paymentCollection?.averageCollectionDays || 0}
              suffix="天"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="按时回款数"
              value={paymentCollection?.onTimeCount || 0}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a', fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="逾期回款数"
              value={paymentCollection?.overdueCount || 0}
              prefix={<WarningOutlined style={{ color: '#cf1322' }} />}
              valueStyle={{ color: '#cf1322', fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="逾期比例"
              value={paymentCollection?.overdueRate || 0}
              precision={2}
              suffix="%"
              valueStyle={{
                color: (paymentCollection?.overdueRate || 0) > 20 ? '#cf1322' : '#52c41a',
                fontSize: 24,
              }}
            />
          </Card>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Card title="按时回款率" loading={loading}>
            <Progress
              type="dashboard"
              percent={Math.round((paymentCollection?.onTimeRate || 0) * 100)}
              size={200}
              status="success"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="逾期回款率" loading={loading}>
            <Progress
              type="dashboard"
              percent={Math.round((paymentCollection?.overdueRate || 0) * 100)}
              size={200}
              status="exception"
            />
          </Card>
        </Col>
      </Row>
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
      children: (
        <Table
          rowKey="status"
          columns={statusColumns}
          dataSource={statusChangeSummary}
          loading={loading}
          pagination={false}
        />
      ),
    },
    {
      key: 'collection',
      label: (
        <span>
          <DollarOutlined /> 回款周期分析
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
              value={summary?.totalQuotes || 0}
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
              title="已收款金额"
              value={summary?.totalPaid || 0}
              precision={2}
              prefix={<DollarOutlined style={{ color: '#3f8600' }} />}
              valueStyle={{ color: '#3f8600', fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="待收款金额"
              value={summary?.pendingAmount || 0}
              precision={2}
              prefix={<SwapOutlined style={{ color: '#cf1322' }} />}
              valueStyle={{ color: '#cf1322', fontSize: 20 }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card loading={loading}>
            <Statistic
              title="已对账数量"
              value={summary?.reconciledCount || 0}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a', fontSize: 18 }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card loading={loading}>
            <Statistic
              title="未对账数量"
              value={summary?.unreconciledCount || 0}
              prefix={<SwapOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14', fontSize: 18 }}
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
