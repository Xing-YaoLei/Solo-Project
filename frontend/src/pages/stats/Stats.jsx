import { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Select,
  DatePicker,
  Space,
  Table,
  Tag,
  Form,
} from 'antd'
import {
  WarningOutlined,
  RiseOutlined,
  PercentageOutlined,
  DollarOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { statsAPI, addressDictAPI } from '../../api'

const { RangePicker } = DatePicker
const { Option } = Select

export default function Stats() {
  const [overview, setOverview] = useState({})
  const [areaStats, setAreaStats] = useState([])
  const [handlerStats, setHandlerStats] = useState([])
  const [trendData, setTrendData] = useState([])
  const [areas, setAreas] = useState([])
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadAreas()
    loadData()
  }, [])

  const loadAreas = async () => {
    try {
      const res = await addressDictAPI.getAreas()
      setAreas(res.data || [])
    } catch (e) {
      console.error(e)
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const values = form.getFieldsValue()
      const params = {}
      if (values.area) {
        params.area = values.area
      }
      if (values.dateRange && values.dateRange.length === 2) {
        params.start_date = values.dateRange[0].format('YYYY-MM-DD')
        params.end_date = values.dateRange[1].format('YYYY-MM-DD')
      }

      const [overviewRes, areaRes, handlerRes, trendRes] = await Promise.all([
        statsAPI.getCompensateOverview(params),
        statsAPI.getCompensateByArea(params),
        statsAPI.getCompensateByHandler(params),
        statsAPI.getCompensateTrend({ days: 7, area: values.area }),
      ])

      setOverview(overviewRes.data || {})
      setAreaStats(areaRes.data || [])
      setHandlerStats(handlerRes.data || [])
      setTrendData(trendRes.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadData()
  }

  const trendOption = {
    title: {
      text: '赔付趋势',
      left: 'center',
      textStyle: { fontSize: 14 },
    },
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['申诉数', '赔付金额'],
      bottom: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: trendData.map((d) => d.date),
    },
    yAxis: [
      {
        type: 'value',
        name: '申诉数',
        position: 'left',
      },
      {
        type: 'value',
        name: '赔付金额(元)',
        position: 'right',
      },
    ],
    series: [
      {
        name: '申诉数',
        type: 'bar',
        data: trendData.map((d) => d.appeal_count),
        itemStyle: { color: '#1890ff' },
      },
      {
        name: '赔付金额',
        type: 'line',
        yAxisIndex: 1,
        data: trendData.map((d) => d.compensate_amount),
        itemStyle: { color: '#f5222d' },
        smooth: true,
      },
    ],
  }

  const typeOption = {
    title: {
      text: '申诉类型分布',
      left: 'center',
      textStyle: { fontSize: 14 },
    },
    tooltip: {
      trigger: 'item',
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
    },
    series: [
      {
        name: '赔付金额',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data: [
          { value: overview.type_distribution?.late?.compensate || 0, name: '超时赔付' },
          { value: overview.type_distribution?.damage?.compensate || 0, name: '损坏赔付' },
          { value: overview.type_distribution?.lost?.compensate || 0, name: '丢失赔付' },
          { value: overview.type_distribution?.other?.compensate || 0, name: '其他赔付' },
        ],
      },
    ],
  }

  const areaColumns = [
    {
      title: '区域',
      dataIndex: 'area',
      key: 'area',
    },
    {
      title: '申诉数',
      dataIndex: 'appeal_count',
      key: 'appeal_count',
      sorter: (a, b) => a.appeal_count - b.appeal_count,
    },
    {
      title: '赔付金额(元)',
      dataIndex: 'compensate_amount',
      key: 'compensate_amount',
      sorter: (a, b) => a.compensate_amount - b.compensate_amount,
      render: (val) => <span style={{ color: '#f5222d' }}>¥{val}</span>,
    },
  ]

  const handlerColumns = [
    {
      title: '处理人',
      dataIndex: 'handler',
      key: 'handler',
    },
    {
      title: '处理数',
      dataIndex: 'handle_count',
      key: 'handle_count',
      sorter: (a, b) => a.handle_count - b.handle_count,
    },
    {
      title: '赔付金额(元)',
      dataIndex: 'compensate_amount',
      key: 'compensate_amount',
      sorter: (a, b) => a.compensate_amount - b.compensate_amount,
      render: (val) => <span style={{ color: '#f5222d' }}>¥{val}</span>,
    },
    {
      title: '平均赔付(元)',
      dataIndex: 'avg_compensate',
      key: 'avg_compensate',
      sorter: (a, b) => a.avg_compensate - b.avg_compensate,
      render: (val) => `¥${val}`,
    },
  ]

  return (
    <div>
      <div className="page-title">复盘分析</div>

      <div className="filter-form">
        <Form form={form} layout="inline">
          <Space size="large">
            <Form.Item name="area" label="区域">
              <Select placeholder="全部区域" style={{ width: 140 }} allowClear>
                {areas.map((area) => (
                  <Option key={area} value={area}>
                    {area}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="dateRange" label="日期范围">
              <RangePicker style={{ width: 260 }} />
            </Form.Item>
            <Space>
              <a onClick={handleSearch} style={{ cursor: 'pointer' }}>
                查询
              </a>
            </Space>
          </Space>
        </Form>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="订单总数"
              value={overview.total_orders || 0}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="申诉总数"
              value={overview.total_appeals || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="申诉率"
              value={overview.appeal_rate || 0}
              suffix="%"
              prefix={<PercentageOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="赔付总金额"
              value={overview.total_compensate || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card loading={loading}>
            <ReactECharts option={trendOption} style={{ height: 350 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card loading={loading}>
            <ReactECharts option={typeOption} style={{ height: 350 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="区域赔付排行" loading={loading}>
            <Table
              columns={areaColumns}
              dataSource={areaStats}
              rowKey="area"
              size="small"
              pagination={false}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="处理人赔付统计" loading={loading}>
            <Table
              columns={handlerColumns}
              dataSource={handlerStats}
              rowKey="handler"
              size="small"
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
