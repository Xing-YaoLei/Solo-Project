import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  Card,
  Row,
  Col,
  Statistic,
  DatePicker,
  Button,
  Table,
  Modal,
  Tag,
  Form,
  InputNumber,
  message,
  Space,
} from 'antd'
import { ReloadOutlined, FileTextOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import type { Quote } from '../../types'
import { statisticsApi, quotesApi } from '../../api'
import {
  formatCurrency,
  formatDate,
  getQuoteStatusLabel,
  quoteStatusOptions,
} from '../../utils/format'
import dayjs from 'dayjs'

export const Route = createFileRoute('/_layout/statistics')({
  component: StatisticsPage,
})

interface OverviewData {
  total_quotes: number
  total_amount: number
  total_paid: number
  pending_count: number
  exception_count: number
  unpaid_amount: number
}

interface CycleRecord {
  quote_id: string
  quote_no: string
  title: string
  client_name: string
  amount: number
  created_at: string
  actual_payment_date: string
  cycle_days: number
}

function StatisticsPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [overview, setOverview] = useState<OverviewData>({
    total_quotes: 0,
    total_amount: 0,
    total_paid: 0,
    pending_count: 0,
    exception_count: 0,
    unpaid_amount: 0,
  })
  const [dateRange, setDateRange] = useState<[any, any] | null>(null)
  const [statusData, setStatusData] = useState<any[]>([])
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([])
  const [cycleData, setCycleData] = useState<{
    avg_cycle_days: number
    total_records: number
    records: CycleRecord[]
  }>({ avg_cycle_days: 0, total_records: 0, records: [] })
  const [exceptionTypes, setExceptionTypes] = useState<any[]>([])
  const [cycleFilterVisible, setCycleFilterVisible] = useState(false)
  const [cycleFilterForm] = Form.useForm()
  const [drillDownQuotes, setDrillDownQuotes] = useState<Quote[]>([])
  const [drillDownVisible, setDrillDownVisible] = useState(false)
  const [drillDownTitle, setDrillDownTitle] = useState('')

  const loadAllData = async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (dateRange?.[0]) params.start_date = dateRange[0].format('YYYY-MM-DD')
      if (dateRange?.[1]) params.end_date = dateRange[1].format('YYYY-MM-DD')

      const [ov, status, monthly, cycle, excTypes] = await Promise.all([
        statisticsApi.getOverview(params),
        statisticsApi.getStatusDistribution(params),
        statisticsApi.getMonthlyRevenue({ months: 12 }),
        statisticsApi.getCollectionCycle(params),
        statisticsApi.getExceptionTypes(),
      ])

      setOverview(ov as OverviewData)
      setStatusData(status as any[])
      setMonthlyRevenue(monthly as any[])
      setCycleData(cycle as any)
      setExceptionTypes(excTypes as any[])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllData()
  }, [dateRange])

  const statusPieOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, type: 'scroll' },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold' },
        },
        data: statusData.map((d) => ({ value: d.count, name: d.label })),
      },
    ],
    color: ['#1677ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16', '#2f54eb', '#a0d911'],
  }

  const monthlyBarOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 60, right: 20, top: 30, bottom: 40 },
    xAxis: {
      type: 'category',
      data: monthlyRevenue.map((d) => d.month),
      axisLabel: { rotate: 30 },
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: (v: number) => `¥${(v / 10000).toFixed(0)}万` },
    },
    series: [
      {
        type: 'bar',
        data: monthlyRevenue.map((d) => d.amount),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#1677ff' },
              { offset: 1, color: '#69c0ff' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
        barWidth: '50%',
      },
    ],
  }

  const cycleBarOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 60, right: 20, top: 30, bottom: 40 },
    xAxis: {
      type: 'category',
      data: cycleData.records.slice(0, 15).map((r) => r.quote_no),
      axisLabel: { rotate: 45, fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      name: '天数',
    },
    series: [
      {
        type: 'bar',
        data: cycleData.records.slice(0, 15).map((r) => ({
          value: r.cycle_days,
          itemStyle: {
            color:
              r.cycle_days > 60
                ? '#ff4d4f'
                : r.cycle_days > 30
                ? '#faad14'
                : '#52c41a',
          },
        })),
        label: { show: true, position: 'top', formatter: '{c}天' },
        barWidth: '50%',
      },
    ],
  }

  const exceptionPieOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0 },
    series: [
      {
        type: 'pie',
        radius: '65%',
        data: exceptionTypes.map((d) => ({ value: d.count, name: d.label })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
    color: ['#ff4d4f', '#faad14', '#1677ff', '#722ed1', '#13c2c2', '#8c8c8c'],
  }

  const handleCycleFilter = async () => {
    try {
      const values = await cycleFilterForm.validateFields()
      const quotes = await statisticsApi.getQuotesByCycle({
        min_days: values.min_days,
        max_days: values.max_days,
      })
      setDrillDownQuotes(quotes)
      setDrillDownTitle(`回款周期 ${values.min_days || 0} - ${values.max_days || '∞'} 天的报价单`)
      setDrillDownVisible(true)
      setCycleFilterVisible(false)
    } catch (error: any) {
      message.error(error?.response?.data?.detail || '查询失败')
    }
  }

  const drillDownColumns = [
    {
      title: '报价单号',
      dataIndex: 'quote_no',
      render: (v: string, record: Quote) => (
        <Button
          type="link"
          onClick={() => navigate({ to: '/quotes/$id', params: { id: record.id } })}
        >
          {v}
        </Button>
      ),
    },
    { title: '标题', dataIndex: 'title' },
    { title: '客户名称', dataIndex: 'client_name' },
    {
      title: '金额',
      dataIndex: 'discounted_amount',
      render: (v: number) => formatCurrency(v),
    },
    {
      title: '已付款',
      dataIndex: 'paid_amount',
      render: (v: number) => formatCurrency(v),
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (v: string) => {
        const opt = quoteStatusOptions.find((o) => o.value === v)
        return <Tag color={opt?.color as any}>{getQuoteStatusLabel(v)}</Tag>
      },
    },
    {
      title: '创建日期',
      dataIndex: 'created_at',
      render: (v: string) => formatDate(v),
    },
  ]

  const cycleColumns = [
    {
      title: '报价单号',
      dataIndex: 'quote_no',
      render: (v: string, record: CycleRecord) => (
        <Button
          type="link"
          icon={<FileTextOutlined />}
          onClick={() => navigate({ to: '/quotes/$id', params: { id: record.quote_id } })}
        >
          {v}
        </Button>
      ),
    },
    { title: '标题', dataIndex: 'title' },
    { title: '客户名称', dataIndex: 'client_name' },
    {
      title: '金额',
      dataIndex: 'amount',
      render: (v: number) => formatCurrency(v),
    },
    {
      title: '回款周期',
      dataIndex: 'cycle_days',
      render: (v: number) => (
        <Tag color={v > 60 ? 'red' : v > 30 ? 'orange' : 'green'}>{v} 天</Tag>
      ),
      sorter: (a: CycleRecord, b: CycleRecord) => a.cycle_days - b.cycle_days,
    },
    {
      title: '创建日期',
      dataIndex: 'created_at',
      render: (v: string) => formatDate(v),
    },
    {
      title: '到账日期',
      dataIndex: 'actual_payment_date',
      render: (v: string) => formatDate(v),
    },
  ]

  const collectionRate =
    overview.total_amount > 0
      ? ((overview.total_paid / overview.total_amount) * 100).toFixed(1)
      : '0.0'

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">统计分析</h2>
        <Space>
          <DatePicker.RangePicker
            value={dateRange}
            onChange={setDateRange as any}
            allowClear
          />
          <Button icon={<ReloadOutlined />} onClick={loadAllData} loading={loading}>
            刷新
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card className="stat-card">
            <Statistic title="报价单总数" value={overview.total_quotes} valueStyle={{ fontSize: 22 }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card className="stat-card">
            <Statistic
              title="报价总金额"
              value={overview.total_amount}
              precision={2}
              prefix="¥"
              valueStyle={{ fontSize: 22, color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card className="stat-card">
            <Statistic
              title="已回款金额"
              value={overview.total_paid}
              precision={2}
              prefix="¥"
              valueStyle={{ fontSize: 22, color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card className="stat-card">
            <Statistic
              title="回款率"
              value={parseFloat(collectionRate)}
              precision={1}
              suffix="%"
              valueStyle={{ fontSize: 22, color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card className="stat-card">
            <Statistic
              title="未回款金额"
              value={overview.unpaid_amount}
              precision={2}
              prefix="¥"
              valueStyle={{ fontSize: 22, color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card className="stat-card">
            <Statistic
              title="平均回款周期"
              value={cycleData.avg_cycle_days}
              suffix="天"
              valueStyle={{ fontSize: 22, color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="月度回款趋势" className="stat-card">
            <ReactECharts option={monthlyBarOption} style={{ height: 320 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="报价单状态分布" className="stat-card">
            <ReactECharts option={statusPieOption} style={{ height: 320 }} />
          </Card>
        </Col>
      </Row>

      <Card
        title="回款周期分析（点击钻取到具体单据）"
        className="stat-card"
        style={{ marginBottom: 16 }}
        extra={
          <Button type="primary" onClick={() => setCycleFilterVisible(true)}>
            按周期范围筛选
          </Button>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={10}>
            <ReactECharts option={cycleBarOption} style={{ height: 360 }} />
          </Col>
          <Col xs={24} lg={14}>
            <div style={{ marginBottom: 8, color: '#8c8c8c' }}>
              共 {cycleData.total_records} 份已回款报价单，平均周期 {cycleData.avg_cycle_days} 天
            </div>
            <Table
              rowKey="quote_id"
              size="small"
              columns={cycleColumns}
              dataSource={cycleData.records}
              pagination={{ pageSize: 6, showSizeChanger: false }}
              scroll={{ x: 800 }}
            />
          </Col>
        </Row>
      </Card>

      <Card title="异常类型分布" className="stat-card">
        <ReactECharts option={exceptionPieOption} style={{ height: 300, maxWidth: 600 }} />
      </Card>

      <Modal
        title="按回款周期筛选"
        open={cycleFilterVisible}
        onOk={handleCycleFilter}
        onCancel={() => {
          setCycleFilterVisible(false)
          cycleFilterForm.resetFields()
        }}
      >
        <Form form={cycleFilterForm} layout="vertical">
          <Form.Item label="最小天数" name="min_days">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="回款周期大于等于" />
          </Form.Item>
          <Form.Item label="最大天数" name="max_days">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="回款周期小于等于，留空表示不限" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={drillDownTitle}
        open={drillDownVisible}
        onCancel={() => setDrillDownVisible(false)}
        footer={null}
        width={900}
      >
        <Table
          rowKey="id"
          size="small"
          columns={drillDownColumns}
          dataSource={drillDownQuotes}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
        />
      </Modal>
    </div>
  )
}
