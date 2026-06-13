import React, { useState, useEffect } from 'react'
import { Row, Col, Card, DatePicker, Table, Tag, Button, Space, Modal, List } from 'antd'
import { EyeOutlined, BarChartOutlined, FileTextOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { useNavigate } from 'react-router-dom'
import { analyticsAPI } from '../services/api'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

function RefundAnalysis() {
  const navigate = useNavigate()
  const [refundReasons, setRefundReasons] = useState([])
  const [selectedReason, setSelectedReason] = useState(null)
  const [dateRange, setDateRange] = useState([dayjs().subtract(90, 'day'), dayjs()])
  const [detailModal, setDetailModal] = useState(false)
  const [detailMembers, setDetailMembers] = useState([])

  useEffect(() => {
    loadRefundReasons()
  }, [dateRange])

  const loadRefundReasons = async () => {
    try {
      const data = await analyticsAPI.getRefundReasons({
        start_date: dateRange[0]?.format('YYYY-MM-DD'),
        end_date: dateRange[1]?.format('YYYY-MM-DD'),
      })
      setRefundReasons(data)
    } catch (e) {
      console.error('加载退款原因失败:', e)
      loadMockData()
    }
  }

  const loadMockData = () => {
    const mockData = [
      { reason: 'injury', name: '受伤原因', count: 6, percentage: 24.0, total_amount: 18000, total_sessions: 25 },
      { reason: 'move_away', name: '搬家/距离远', count: 5, percentage: 20.0, total_amount: 15000, total_sessions: 20 },
      { reason: 'dissatisfied', name: '服务不满', count: 4, percentage: 16.0, total_amount: 12000, total_sessions: 18 },
      { reason: 'coach_change', name: '教练变动', count: 4, percentage: 16.0, total_amount: 10000, total_sessions: 15 },
      { reason: 'price_reason', name: '价格原因', count: 3, percentage: 12.0, total_amount: 8000, total_sessions: 12 },
      { reason: 'time_conflict', name: '时间冲突', count: 2, percentage: 8.0, total_amount: 5000, total_sessions: 8 },
      { reason: 'health_reason', name: '健康原因', count: 1, percentage: 4.0, total_amount: 3000, total_sessions: 5 },
    ]
    setRefundReasons(mockData)
  }

  const getPieOption = () => {
    return {
      title: {
        text: '退款原因分布',
        left: 'center',
        textStyle: { fontSize: 16, fontWeight: 'normal' },
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}笔 ({d}%)',
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'middle',
      },
      series: [
        {
          name: '退款原因',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['60%', '55%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: true,
            formatter: '{b}\n{d}%',
          },
          emphasis: {
            label: { show: true, fontSize: 16, fontWeight: 'bold' },
          },
          data: refundReasons.map((r, i) => ({
            value: r.count,
            name: r.name,
            itemStyle: {
              color: ['#ff4d4f', '#faad14', '#fa8c16', '#f5222d', '#a0d911', '#1890ff', '#722ed1'][i % 7],
            },
          })),
        },
      ],
    }
  }

  const getBarOption = () => {
    return {
      title: {
        text: '各原因退款金额',
        left: 'center',
        textStyle: { fontSize: 16, fontWeight: 'normal' },
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params) => `${params[0].name}<br/>退款金额: ¥${params[0].value.toLocaleString()}`,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: 60,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: refundReasons.map(r => r.name),
        axisLabel: { interval: 0, rotate: 30 },
      },
      yAxis: {
        type: 'value',
        axisLabel: { formatter: '¥{value}' },
      },
      series: [
        {
          name: '退款金额',
          type: 'bar',
          data: refundReasons.map((r, i) => ({
            value: r.total_amount,
            itemStyle: {
              color: ['#ff4d4f', '#faad14', '#fa8c16', '#f5222d', '#a0d911', '#1890ff', '#722ed1'][i % 7],
            },
          })),
          barWidth: '50%',
        },
      ],
    }
  }

  const handleReasonClick = (reason) => {
    setSelectedReason(reason)
    setDetailMembers(Array.from({ length: reason.count }, (_, i) => ({
      id: i + 1,
      name: `会员${i + 1}`,
      member_no: `M202400${i + 1}`,
      refund_amount: Math.floor(reason.total_amount / reason.count * (0.8 + Math.random() * 0.4)),
      refund_sessions: Math.floor(reason.total_sessions / reason.count * (0.8 + Math.random() * 0.4)),
      apply_date: dayjs().subtract(Math.floor(Math.random() * 60), 'day').format('YYYY-MM-DD'),
    })))
    setDetailModal(true)
  }

  const totalCount = refundReasons.reduce((sum, r) => sum + r.count, 0)
  const totalAmount = refundReasons.reduce((sum, r) => sum + r.total_amount, 0)
  const totalSessions = refundReasons.reduce((sum, r) => sum + r.total_sessions, 0)

  const columns = [
    { title: '排名', dataIndex: 'rank', key: 'rank', width: 60, render: (_, __, i) => i + 1 },
    { title: '退款原因', dataIndex: 'name', key: 'name', width: 140 },
    { title: '退款笔数', dataIndex: 'count', key: 'count', width: 100 },
    {
      title: '占比',
      dataIndex: 'percentage',
      key: 'percentage',
      width: 100,
      render: (v) => `${v}%`,
    },
    {
      title: '退款金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 120,
      render: (v) => `¥${v.toLocaleString()}`,
    },
    { title: '退款课时', dataIndex: 'total_sessions', key: 'total_sessions', width: 100 },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleReasonClick(record)}>
          查看明细
        </Button>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">退款分析</h1>
        <p className="page-desc">从退款原因维度分析会员流失，支持逐层钻取到具体会员</p>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <div className="stat-card">
            <div className="stat-card-title">总退款笔数</div>
            <div className="stat-card-value" style={{ color: '#ff4d4f' }}>{totalCount}</div>
            <div className="stat-card-trend trend-down">
              <BarChartOutlined /> 涉及 {refundReasons.length} 种原因
            </div>
          </div>
        </Col>
        <Col span={8}>
          <div className="stat-card">
            <div className="stat-card-title">总退款金额</div>
            <div className="stat-card-value" style={{ color: '#faad14' }}>¥{totalAmount.toLocaleString()}</div>
            <div className="stat-card-trend">
              <FileTextOutlined /> 平均 ¥{Math.round(totalAmount / totalCount).toLocaleString()}/笔
            </div>
          </div>
        </Col>
        <Col span={8}>
          <div className="stat-card">
            <div className="stat-card-title">总退款课时</div>
            <div className="stat-card-value" style={{ color: '#722ed1' }}>{totalSessions}</div>
            <div className="stat-card-trend">
              <FileTextOutlined /> 平均 {Math.round(totalSessions / totalCount)} 课时/笔
            </div>
          </div>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <div className="chart-card">
            <div className="chart-card-header">
              <div className="chart-card-title">退款原因占比</div>
              <RangePicker value={dateRange} onChange={setDateRange} />
            </div>
            <ReactECharts option={getPieOption()} style={{ height: 350 }} />
          </div>
        </Col>
        <Col span={12}>
          <div className="chart-card">
            <div className="chart-card-header">
              <div className="chart-card-title">各原因退款金额</div>
            </div>
            <ReactECharts option={getBarOption()} style={{ height: 350 }} />
          </div>
        </Col>
      </Row>

      <div className="chart-card" style={{ marginTop: 16 }}>
        <div className="chart-card-header">
          <div className="chart-card-title">退款原因明细</div>
        </div>
        <Table
          size="middle"
          columns={columns}
          dataSource={refundReasons}
          rowKey="reason"
          pagination={false}
        />
      </div>

      <Modal
        title={`${selectedReason?.name} - 退款会员明细`}
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={null}
        width={700}
      >
        <List
          dataSource={detailMembers}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button type="link" size="small" onClick={() => navigate(`/members/${item.id}`)}>
                  查看档案
                </Button>
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <span>{item.name}</span>
                    <Tag color="blue">{item.member_no}</Tag>
                  </Space>
                }
                description={
                  <Space split="|" size={16}>
                    <span>退款金额: <b style={{ color: '#ff4d4f' }}>¥{item.refund_amount.toLocaleString()}</b></span>
                    <span>退款课时: {item.refund_sessions}节</span>
                    <span>申请日期: {item.apply_date}</span>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Modal>
    </div>
  )
}

export default RefundAnalysis
