import { useState, useEffect } from 'react'
import { Row, Col, DatePicker, Table, Tag, Progress } from 'antd'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import { reworkApi } from '../api'

const { RangePicker } = DatePicker

export default function ReworkAnalysis() {
  const navigate = useNavigate()
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(90, 'day'),
    dayjs(),
  ])
  const [stats, setStats] = useState(null)
  const [orders, setOrders] = useState([])

  useEffect(() => {
    loadData()
  }, [dateRange])

  const loadData = async () => {
    const params = {
      start_date: dateRange[0].format('YYYY-MM-DD'),
      end_date: dateRange[1].format('YYYY-MM-DD'),
    }
    const [statsData, ordersData] = await Promise.all([
      reworkApi.getStats(params).catch(() => null),
      reworkApi.getOrders(params).catch(() => ({ items: [] })),
    ])
    setStats(statsData)
    setOrders(ordersData?.items || [])
  }

  const getTrendOption = () => {
    if (!stats) return {}
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: ['总工单数', '返修单数'] },
      grid: { left: 50, right: 20, top: 40, bottom: 30 },
      xAxis: { type: 'category', data: stats.by_month.map((m) => m.month) },
      yAxis: [
        { type: 'value', name: '单数' },
        { type: 'value', name: '返修率(%)', min: 0, max: 20 },
      ],
      series: [
        {
          name: '总工单数',
          type: 'bar',
          data: stats.by_month.map((m) => m.total_orders),
          itemStyle: { color: '#91caff' },
        },
        {
          name: '返修单数',
          type: 'bar',
          data: stats.by_month.map((m) => m.rework_count),
          itemStyle: { color: '#ff7875' },
        },
        {
          name: '返修率',
          type: 'line',
          yAxisIndex: 1,
          data: stats.by_month.map((m) => m.rework_rate),
          lineStyle: { color: '#faad14', width: 2 },
          itemStyle: { color: '#faad14' },
          symbol: 'circle',
          symbolSize: 8,
        },
      ],
    }
  }

  const getMechanicOption = () => {
    if (!stats) return {}
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: 80, right: 50, top: 20, bottom: 30 },
      xAxis: { type: 'value', name: '返修率(%)' },
      yAxis: {
        type: 'category',
        data: stats.by_mechanic.map((m) => m.mechanic).reverse(),
      },
      series: [
        {
          type: 'bar',
          data: stats.by_mechanic
            .map((m) => ({
              value: m.rework_rate,
              itemStyle: {
                color:
                  m.rework_rate >= 10
                    ? '#ff4d4f'
                    : m.rework_rate >= 5
                    ? '#faad14'
                    : '#52c41a',
              },
            }))
            .reverse(),
          label: {
            show: true,
            position: 'right',
            formatter: '{c}%',
          },
          barWidth: 20,
        },
      ],
    }
  }

  const getReasonOption = () => {
    if (!stats) return {}
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c}次 ({d}%)' },
      legend: { bottom: 0 },
      series: [
        {
          type: 'pie',
          radius: ['40%', '65%'],
          center: ['50%', '45%'],
          label: { show: true, formatter: '{b}\n{d}%' },
          data: stats.by_reason.map((r) => ({ value: r.count, name: r.reason })),
        },
      ],
    }
  }

  const columns = [
    { title: '工单号', dataIndex: 'order_no', key: 'order_no' },
    { title: '车牌号', dataIndex: 'vehicle_plate', key: 'vehicle_plate' },
    { title: '维修技师', dataIndex: 'mechanic', key: 'mechanic' },
    {
      title: '返修原因',
      dataIndex: 'rework_reason',
      key: 'rework_reason',
      ellipsis: true,
    },
    {
      title: '金额',
      dataIndex: 'actual_amount',
      key: 'actual_amount',
      render: (v) => `¥${(v || 0).toLocaleString()}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s) => {
        const map = {
          pending: { color: 'default', label: '待处理' },
          in_progress: { color: 'processing', label: '进行中' },
          quality_check: { color: 'warning', label: '质检中' },
          completed: { color: 'success', label: '已完成' },
          reworked: { color: 'error', label: '返修中' },
        }
        const cfg = map[s] || { color: 'default', label: s }
        return <Tag color={cfg.color}>{cfg.label}</Tag>
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <a onClick={() => navigate(`/repair-order/${record.id}`)}>查看详情</a>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <div className="page-title">返修率分析</div>
        <div className="page-subtitle">
          重点跟踪维修质量，按技师、原因、趋势多维度分析返修情况
        </div>
      </div>

      <div className="filter-bar">
        <span>日期范围：</span>
        <RangePicker
          value={dateRange}
          onChange={(val) => val && setDateRange(val)}
          allowClear={false}
        />
      </div>

      <Row gutter={[16, 16]}>
        <Col span={6}>
          <div className="stat-card">
            <div className="label">总工单数</div>
            <div className="value">{stats?.total_orders || '--'}</div>
          </div>
        </Col>
        <Col span={6}>
          <div className="stat-card">
            <div className="label">返修单数</div>
            <div className="value" style={{ color: '#ff4d4f' }}>
              {stats?.rework_orders || '--'}
            </div>
          </div>
        </Col>
        <Col span={6}>
          <div className="stat-card">
            <div className="label">整体返修率</div>
            <div className="value" style={{ color: '#faad14' }}>
              {stats?.rework_rate || '--'}%
            </div>
            <div style={{ marginTop: 8 }}>
              <Progress
                percent={stats?.rework_rate || 0}
                status={stats?.rework_rate > 5 ? 'exception' : 'normal'}
                showInfo={false}
              />
            </div>
          </div>
        </Col>
        <Col span={6}>
          <div className="stat-card">
            <div className="label">返修涉及金额</div>
            <div className="value" style={{ color: '#1677ff' }}>
              ¥{(stats?.rework_amount || 0).toLocaleString()}
            </div>
          </div>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={14}>
          <div className="chart-card">
            <div className="chart-title">返修率月度趋势</div>
            <ReactECharts option={getTrendOption()} style={{ height: 320 }} />
          </div>
        </Col>
        <Col span={10}>
          <div className="chart-card">
            <div className="chart-title">返修原因分布</div>
            <ReactECharts option={getReasonOption()} style={{ height: 320 }} />
          </div>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <div className="chart-card">
            <div className="chart-title">技师返修率排名</div>
            <ReactECharts option={getMechanicOption()} style={{ height: 300 }} />
          </div>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <div className="chart-card">
            <div className="chart-title">返修工单明细</div>
            <Table
              columns={columns}
              dataSource={orders}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              size="small"
            />
          </div>
        </Col>
      </Row>
    </div>
  )
}
