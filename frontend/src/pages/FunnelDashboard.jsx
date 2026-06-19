import { useState, useEffect } from 'react'
import { Row, Col, DatePicker, Card, Tag, Table, Modal, List, Progress, Button, Space } from 'antd'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import { ArrowRightOutlined, EyeOutlined } from '@ant-design/icons'
import { funnelApi, stockTaskApi } from '../api'

const { RangePicker } = DatePicker

const statusLabelMap = {
  draft: { label: '草稿', color: 'default' },
  submitted: { label: '已提交', color: 'processing' },
  approved: { label: '已确认', color: 'warning' },
  converted: { label: '已转单', color: 'success' },
  rejected: { label: '已拒绝', color: 'error' },
}

export default function FunnelDashboard() {
  const navigate = useNavigate()
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ])
  const [funnelData, setFunnelData] = useState(null)
  const [stockSummary, setStockSummary] = useState(null)
  const [rejectReasons, setRejectReasons] = useState([])
  const [salesRanking, setSalesRanking] = useState([])
  const [detailModal, setDetailModal] = useState({ open: false, stage: null, data: [] })

  useEffect(() => {
    loadData()
  }, [dateRange])

  const loadData = async () => {
    const params = {
      start_date: dateRange[0].format('YYYY-MM-DD'),
      end_date: dateRange[1].format('YYYY-MM-DD'),
    }
    const [funnel, stock, reasons, ranking] = await Promise.all([
      funnelApi.getOverview(params).catch(() => null),
      stockTaskApi.getSummary().catch(() => null),
      funnelApi.getRejectReasons(params).catch(() => ({ items: [] })),
      funnelApi.getSalespersonRanking(params).catch(() => ({ items: [] })),
    ])
    setFunnelData(funnel)
    setStockSummary(stock)
    setRejectReasons(reasons?.items || [])
    setSalesRanking(ranking?.items || [])
  }

  const getFunnelOption = () => {
    if (!funnelData) return {}
    return {
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          const data = funnelData.stages[params.dataIndex]
          return `${params.name}<br/>单数: ${data.count}<br/>金额: ¥${data.amount.toLocaleString()}<br/>转化率: ${data.conversion_rate}%`
        },
      },
      series: [
        {
          name: '报价漏斗',
          type: 'funnel',
          left: '10%',
          top: 60,
          bottom: 60,
          width: '80%',
          min: 0,
          max: funnelData?.stages[0]?.count || 100,
          minSize: '20%',
          maxSize: '100%',
          sort: 'descending',
          gap: 2,
          label: {
            show: true,
            position: 'inside',
            formatter: (params) => {
              const data = funnelData.stages[params.dataIndex]
              return `${params.name}\n${data.count}单\n¥${(data.amount / 10000).toFixed(1)}万`
            },
            fontSize: 12,
            color: '#fff',
          },
          labelLine: { length: 10, lineStyle: { width: 1, type: 'solid' } },
          itemStyle: { borderColor: '#fff', borderWidth: 1 },
          emphasis: {
            label: { fontSize: 14 },
          },
          data: funnelData.stages.map((s, i) => ({
            name: s.stage,
            value: s.count,
            itemStyle: {
              color: [
                '#1677ff',
                '#4096ff',
                '#69b1ff',
                '#91caff',
                '#bae0ff',
                '#e6f4ff',
              ][i],
            },
          })),
        },
      ],
    }
  }

  const handleFunnelClick = async (params) => {
    const stageKey = ['draft', 'submitted', 'approved', 'converted', '', ''][params.dataIndex]
    if (!stageKey) return
    const params2 = {
      stage: stageKey,
      start_date: dateRange[0].format('YYYY-MM-DD'),
      end_date: dateRange[1].format('YYYY-MM-DD'),
    }
    const result = await funnelApi.getQuotations(params2).catch(() => ({ items: [] }))
    setDetailModal({
      open: true,
      stage: params.name,
      data: result?.items || [],
    })
  }

  const getRejectOption = () => ({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, left: 'center' },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        avoidLabelOverlap: false,
        label: { show: false },
        labelLine: { show: false },
        data: rejectReasons.map((r) => ({ value: r.count, name: r.reason })),
      },
    ],
  })

  const getStockOption = () => {
    if (!stockSummary) return {}
    const pending = stockSummary.pending_count || stockSummary.open || 0
    return {
      tooltip: { trigger: 'item' },
      series: [
        {
          type: 'gauge',
          startAngle: 200,
          endAngle: -20,
          min: 0,
          max: stockSummary.total || 100,
          splitNumber: 5,
          progress: { show: true, width: 18 },
          axisLine: { lineStyle: { width: 18 } },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          pointer: { show: false },
          anchor: { show: false },
          title: { offsetCenter: [0, '-10%'], fontSize: 13, color: '#666' },
          detail: {
            offsetCenter: [0, '20%'],
            fontSize: 24,
            fontWeight: 'bolder',
            formatter: '{value}',
          },
          data: [{ value: pending, name: '待处理缺货任务' }],
        },
      ],
    }
  }

  const handleViewOrder = (record) => {
    if (record.repair_order_id) {
      setDetailModal({ ...detailModal, open: false })
      navigate(`/repair-order/${record.repair_order_id}`)
    }
  }

  const detailColumns = [
    { title: '报价单号', dataIndex: 'quotation_no', key: 'quotation_no' },
    { title: '车牌号', dataIndex: 'vehicle_plate', key: 'vehicle_plate' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s) => {
        const cfg = statusLabelMap[s] || { label: s, color: 'default' }
        return <Tag color={cfg.color}>{cfg.label}</Tag>
      },
    },
    { title: '金额', dataIndex: 'total_amount', key: 'total_amount', render: (v) => `¥${v.toLocaleString()}` },
    { title: '业务员', dataIndex: 'salesperson', key: 'salesperson' },
    {
      title: '保险',
      dataIndex: 'insurance_covered',
      key: 'insurance_covered',
      render: (v) => (v ? <Tag color="blue">保险</Tag> : <Tag>自费</Tag>),
    },
    {
      title: '关联工单',
      dataIndex: 'repair_order_no',
      key: 'repair_order_no',
      render: (v, record) => {
        if (v) {
          return (
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={(e) => {
                e.stopPropagation()
                handleViewOrder(record)
              }}
            >
              {v}
            </Button>
          )
        }
        return <span style={{ color: '#999' }}>—</span>
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
      width: 100,
      render: (_, record) => (
        <Space>
          {record.repair_order_id && (
            <Button
              type="primary"
              size="small"
              icon={<ArrowRightOutlined />}
              onClick={() => handleViewOrder(record)}
            >
              查单
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const rankingColumns = [
    { title: '排名', key: 'rank', render: (_, __, idx) => idx + 1, width: 60 },
    { title: '业务员', dataIndex: 'salesperson', key: 'salesperson' },
    { title: '报价数', dataIndex: 'total_count', key: 'total_count' },
    { title: '成交数', dataIndex: 'converted_count', key: 'converted_count' },
    {
      title: '转化率',
      dataIndex: 'conversion_rate',
      key: 'conversion_rate',
      render: (v) => <Progress percent={v} size="small" />,
    },
    { title: '成交金额', dataIndex: 'converted_amount', key: 'converted_amount', render: (v) => `¥${(v || 0).toLocaleString()}` },
    { title: '报价总金额', dataIndex: 'total_amount', key: 'total_amount', render: (v) => `¥${(v || 0).toLocaleString()}` },
  ]

  return (
    <div>
      <div className="page-header">
        <div className="page-title">报价漏斗看板</div>
        <div className="page-subtitle">
          监控从报价创建到收银结算的完整转化链路，识别瓶颈环节
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
            <div className="label">报价总数</div>
            <div className="value">{funnelData?.total_quotations || '--'}</div>
          </div>
        </Col>
        <Col span={6}>
          <div className="stat-card">
            <div className="label">转施工单数</div>
            <div className="value" style={{ color: '#1677ff' }}>
              {funnelData?.total_converted || '--'}
            </div>
          </div>
        </Col>
        <Col span={6}>
          <div className="stat-card">
            <div className="label">整体转化率</div>
            <div className="value" style={{ color: '#52c41a' }}>
              {funnelData?.overall_conversion_rate || '--'}%
            </div>
          </div>
        </Col>
        <Col span={6}>
          <div className="stat-card">
            <div className="label">待处理缺货任务</div>
            <div className="value" style={{ color: '#faad14' }}>
              {stockSummary?.open || '--'}
            </div>
          </div>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={16}>
          <div className="chart-card">
            <div className="chart-title">报价转化漏斗（点击可下钻）</div>
            <ReactECharts
              option={getFunnelOption()}
              style={{ height: 480 }}
              onEvents={{ click: handleFunnelClick }}
            />
          </div>
        </Col>
        <Col span={8}>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <div className="chart-card">
                <div className="chart-title">缺货任务概览</div>
                <ReactECharts option={getStockOption()} style={{ height: 200 }} />
                <Row style={{ marginTop: 8 }}>
                  <Col span={8} style={{ textAlign: 'center' }}>
                    <div style={{ color: '#666', fontSize: 12 }}>处理中</div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: '#1677ff' }}>
                      {stockSummary?.in_progress || 0}
                    </div>
                  </Col>
                  <Col span={8} style={{ textAlign: 'center' }}>
                    <div style={{ color: '#666', fontSize: 12 }}>已解决</div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: '#52c41a' }}>
                      {stockSummary?.resolved || 0}
                    </div>
                  </Col>
                  <Col span={8} style={{ textAlign: 'center' }}>
                    <div style={{ color: '#666', fontSize: 12 }}>紧急</div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: '#ff4d4f' }}>
                      {stockSummary?.urgent || 0}
                    </div>
                  </Col>
                </Row>
                <Row style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
                  <Col span={12} style={{ textAlign: 'center' }}>
                    <div style={{ color: '#666', fontSize: 12 }}>解决率</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#1677ff' }}>
                      {stockSummary?.resolution_rate || 0}%
                    </div>
                  </Col>
                  <Col span={12} style={{ textAlign: 'center' }}>
                    <div style={{ color: '#666', fontSize: 12 }}>平均解决天数</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#faad14' }}>
                      {stockSummary?.avg_resolution_days || 0}天
                    </div>
                  </Col>
                </Row>
              </div>
            </Col>
            <Col span={24}>
              <div className="chart-card">
                <div className="chart-title">报价拒绝原因分布</div>
                <ReactECharts option={getRejectOption()} style={{ height: 260 }} />
              </div>
            </Col>
          </Row>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <div className="chart-card">
            <div className="chart-title">业务员成交排行</div>
            <Table
              columns={rankingColumns}
              dataSource={salesRanking}
              rowKey="salesperson"
              pagination={false}
              size="small"
            />
          </div>
        </Col>
      </Row>

      <Modal
        title={`${detailModal.stage} - 报价单明细`}
        open={detailModal.open}
        onCancel={() => setDetailModal({ open: false, stage: null, data: [] })}
        footer={null}
        width={1000}
      >
        <Table
          columns={detailColumns}
          dataSource={detailModal.data}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          size="small"
          onRow={(record) => ({
            style: { cursor: 'pointer' },
          })}
        />
      </Modal>
    </div>
  )
}
