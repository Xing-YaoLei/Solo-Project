import React, { useState, useEffect, useCallback } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  DatePicker,
  Select,
  Form,
  Button,
  Space,
  Table,
  Tag,
  Progress,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  ReloadOutlined,
  SearchOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  DollarOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { analysisApi } from '@/api'
import { useAppStore } from '@/store'
import type { RepairDurationAnalysisDto, RepairRecordDto, ResponsibilityParty } from '@/types'
import {
  formatCurrency,
  formatHours,
  formatDateTime,
  formatResponsibilityParty,
} from '@/utils/format'

const { RangePicker } = DatePicker
const { Option } = Select

const Analysis: React.FC = () => {
  const { setLoading } = useAppStore()
  const [form] = Form.useForm()
  const [durationData, setDurationData] = useState<RepairDurationAnalysisDto[]>([])
  const [repairRecords, setRepairRecords] = useState<RepairRecordDto[]>([])
  const [orderStats, setOrderStats] = useState<{
    totalOrders: number
    pendingOrders: number
    completedOrders: number
    averageDurationHours: number
    totalDeduction: number
    totalRefund: number
  } | null>(null)
  const [todoStats, setTodoStats] = useState<{
    totalTodos: number
    pendingTodos: number
    inProgressTodos: number
    completedTodos: number
    overdueTodos: number
    averageCompletionHours: number
  } | null>(null)
  const [monthlyTrend, setMonthlyTrend] = useState<
    { month: string; orderCount: number; completedCount: number }[]
  >([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const values = form.getFieldsValue()
      const params: {
        startDate?: string
        endDate?: string
        category?: string
      } = {}
      if (values.dateRange && values.dateRange.length === 2) {
        params.startDate = values.dateRange[0].format('YYYY-MM-DD')
        params.endDate = values.dateRange[1].format('YYYY-MM-DD')
      }
      if (values.category) {
        params.category = values.category
      }

      const [
        durationResult,
        recordsResult,
        orderStatsResult,
        todoStatsResult,
        trendResult,
      ] = await Promise.all([
        analysisApi.getRepairDuration(params),
        analysisApi.getRepairRecords(params),
        analysisApi.getOrderStats(params),
        analysisApi.getTodoStats(params),
        analysisApi.getMonthlyTrend(params),
      ])

      setDurationData(durationResult)
      setRepairRecords(recordsResult)
      setOrderStats(orderStatsResult)
      setTodoStats(todoStatsResult)
      setMonthlyTrend(trendResult)
    } catch (error) {
      console.error('获取分析数据失败:', error)
    } finally {
      setLoading(false)
    }
  }, [form, setLoading])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearch = () => {
    fetchData()
  }

  const handleReset = () => {
    form.resetFields()
    setTimeout(fetchData, 0)
  }

  const getBarChartOption = () => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const data = params[0]
        const item = durationData.find((d) => d.category === data.name)
        if (!item) return ''
        return `
          <div style="padding: 8px;">
            <div><strong>${item.category}</strong></div>
            <div>维修数量: ${item.totalRepairs}</div>
            <div>平均时长: ${formatHours(item.averageDurationHours)}</div>
            <div>最短时长: ${formatHours(item.minDurationHours)}</div>
            <div>最长时长: ${formatHours(item.maxDurationHours)}</div>
            <div>总费用: ${formatCurrency(item.totalActualCost)}</div>
            <div>平均费用: ${formatCurrency(item.averageActualCost)}</div>
          </div>
        `
      },
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: durationData.map((d) => d.category),
      axisLabel: { rotate: 30 },
    },
    yAxis: [
      { type: 'value', name: '平均时长(小时)' },
      { type: 'value', name: '维修数量' },
    ],
    series: [
      {
        name: '平均时长',
        type: 'bar',
        data: durationData.map((d) => d.averageDurationHours.toFixed(1)),
        itemStyle: { color: '#1677ff' },
        label: { show: true, position: 'top', formatter: '{c}h' },
      },
      {
        name: '维修数量',
        type: 'line',
        yAxisIndex: 1,
        data: durationData.map((d) => d.totalRepairs),
        itemStyle: { color: '#52c41a' },
        symbol: 'circle',
        symbolSize: 8,
      },
    ],
    legend: { data: ['平均时长', '维修数量'] },
  })

  const getTrendChartOption = () => ({
    tooltip: { trigger: 'axis' },
    legend: { data: ['创建数量', '完成数量'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: monthlyTrend.map((d) => d.month),
      boundaryGap: false,
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '创建数量',
        type: 'line',
        stack: 'Total',
        data: monthlyTrend.map((d) => d.orderCount),
        itemStyle: { color: '#1677ff' },
        areaStyle: { opacity: 0.3 },
      },
      {
        name: '完成数量',
        type: 'line',
        stack: 'Total',
        data: monthlyTrend.map((d) => d.completedCount),
        itemStyle: { color: '#52c41a' },
        areaStyle: { opacity: 0.3 },
      },
    ],
  })

  const getPieChartOption = () => {
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { orient: 'vertical', left: 'left' },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
          label: { show: false, position: 'center' },
          emphasis: {
            label: { show: true, fontSize: 16, fontWeight: 'bold' },
          },
          labelLine: { show: false },
          data: durationData.map((d) => ({
            value: d.totalRepairs,
            name: d.category,
          })),
        },
      ],
    }
  }

  const repairColumns: ColumnsType<RepairRecordDto> = [
    {
      title: '维修项目',
      dataIndex: 'repairItem',
      key: 'repairItem',
      width: 150,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '关联单号',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 130,
    },
    {
      title: '房屋',
      dataIndex: 'apartmentNumber',
      key: 'apartmentNumber',
      width: 100,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '预估费用',
      dataIndex: 'estimatedCost',
      key: 'estimatedCost',
      width: 100,
      render: (v: number) => formatCurrency(v),
    },
    {
      title: '实际费用',
      dataIndex: 'actualCost',
      key: 'actualCost',
      width: 100,
      render: (v: number) => formatCurrency(v),
    },
    {
      title: '耗时',
      dataIndex: 'durationHours',
      key: 'durationHours',
      width: 100,
      render: (v: number | null) => formatHours(v),
    },
    {
      title: '责任方',
      dataIndex: 'responsibility',
      key: 'responsibility',
      width: 90,
      render: (v: ResponsibilityParty) => formatResponsibilityParty(v),
    },
    {
      title: '处理人',
      dataIndex: 'assignedToName',
      key: 'assignedToName',
      width: 90,
    },
    {
      title: '完成时间',
      dataIndex: 'completedAt',
      key: 'completedAt',
      width: 150,
      render: (v: string | null) => formatDateTime(v),
    },
  ]

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline">
          <Form.Item name="dateRange" label="日期范围">
            <RangePicker />
          </Form.Item>
          <Form.Item name="category" label="维修分类">
            <Select placeholder="全部分类" allowClear style={{ width: 150 }}>
              {Array.from(new Set(durationData.map((d) => d.category))).map((cat) => (
                <Option key={cat} value={cat}>
                  {cat}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                查询
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {orderStats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="退租单总数"
                value={orderStats.totalOrders}
                prefix={<BarChartOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="待处理"
                value={orderStats.pendingOrders}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="平均处理时长"
                value={orderStats.averageDurationHours}
                precision={1}
                suffix="小时"
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="扣款总额"
                value={orderStats.totalDeduction}
                precision={2}
                prefix={<DollarOutlined />}
                formatter={(v) => `¥${v}`}
              />
            </Card>
          </Col>
        </Row>
      )}

      {todoStats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={4}>
            <Card>
              <Statistic title="待办总数" value={todoStats.totalTodos} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Card>
              <Statistic
                title="待处理"
                value={todoStats.pendingTodos}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Card>
              <Statistic
                title="进行中"
                value={todoStats.inProgressTodos}
                valueStyle={{ color: '#1677ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Card>
              <Statistic
                title="已完成"
                value={todoStats.completedTodos}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Card>
              <Statistic
                title="已逾期"
                value={todoStats.overdueTodos}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col xs={24} md={4}>
            <Card>
              <Statistic
                title="完成率"
                value={todoStats.totalTodos > 0 ? (todoStats.completedTodos / todoStats.totalTodos) * 100 : 0}
                precision={1}
                suffix="%"
                formatter={(v) => (
                  <Progress percent={Number(v)} showInfo={false} size="small" />
                )}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={16}>
          <Card title="各分类维修时长统计">
            <ReactECharts option={getBarChartOption()} style={{ height: 350 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="各分类维修数量分布">
            <ReactECharts option={getPieChartOption()} style={{ height: 350 }} />
          </Card>
        </Col>
      </Row>

      <Card title="月度趋势" style={{ marginBottom: 16 }}>
        <ReactECharts option={getTrendChartOption()} style={{ height: 300 }} />
      </Card>

      <Card title="维修记录明细">
        <Table
          rowKey="id"
          columns={repairColumns}
          dataSource={repairRecords}
          pagination={{
            pageSize: 10,
            showTotal: (t) => `共 ${t} 条`,
          }}
          scroll={{ x: 1400 }}
        />
      </Card>
    </div>
  )
}

export default Analysis
