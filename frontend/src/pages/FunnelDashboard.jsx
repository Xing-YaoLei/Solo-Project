import React, { useState, useEffect } from 'react'
import { Row, Col, Card, DatePicker, Select, Button, Table, Tag, Space, Modal, Form, Input, message, Tooltip } from 'antd'
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  PlusOutlined,
  EyeOutlined,
  MessageOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { useNavigate } from 'react-router-dom'
import { analyticsAPI, renewalNoteAPI } from '../services/api'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const { Option } = Select
const { TextArea } = Input

function FunnelDashboard() {
  const navigate = useNavigate()
  const [funnelData, setFunnelData] = useState([])
  const [trendData, setTrendData] = useState([])
  const [coachRanking, setCoachRanking] = useState([])
  const [expiringMembers, setExpiringMembers] = useState({ total: 0, items: [] })
  const [selectedStage, setSelectedStage] = useState(null)
  const [stageDetail, setStageDetail] = useState(null)
  const [stageMembers, setStageMembers] = useState({ total: 0, items: [] })
  const [notes, setNotes] = useState([])
  const [noteModalVisible, setNoteModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(90, 'day'),
    dayjs()
  ])

  useEffect(() => {
    loadFunnelData()
    loadTrendData()
    loadCoachRanking()
    loadExpiringMembers()
  }, [])

  const loadFunnelData = async () => {
    try {
      const data = await analyticsAPI.getFunnel({
        start_date: dateRange[0]?.format('YYYY-MM-DD'),
        end_date: dateRange[1]?.format('YYYY-MM-DD'),
      })
      setFunnelData(data)
    } catch (e) {
      console.error('加载漏斗数据失败:', e)
      loadMockFunnelData()
    }
  }

  const loadMockFunnelData = () => {
    const mockData = [
      { stage: 'total_members', name: '总会员数', value: 30, conversion_rate: 100.0 },
      { stage: 'active_members', name: '活跃会员', value: 25, conversion_rate: 83.33 },
      { stage: 'expiring_members', name: '即将到期', value: 18, conversion_rate: 72.0 },
      { stage: 'contacted_members', name: '已触达会员', value: 15, conversion_rate: 83.33 },
      { stage: 'renewed_members', name: '已续费会员', value: 10, conversion_rate: 66.67 },
    ]
    setFunnelData(mockData)
  }

  const loadTrendData = async () => {
    try {
      const data = await analyticsAPI.getRenewalRateTrend(30)
      setTrendData(data)
    } catch (e) {
      console.error('加载趋势数据失败:', e)
      loadMockTrendData()
    }
  }

  const loadMockTrendData = () => {
    const data = []
    for (let i = 29; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD')
      data.push({
        date,
        renewed_count: Math.floor(Math.random() * 5) + 2,
        total_count: Math.floor(Math.random() * 8) + 5,
        renewal_rate: Math.round((Math.random() * 30 + 50) * 100) / 100,
      })
    }
    setTrendData(data)
  }

  const loadCoachRanking = async () => {
    try {
      const data = await analyticsAPI.getCoachRanking()
      setCoachRanking(data)
    } catch (e) {
      console.error('加载教练排行失败:', e)
      loadMockCoachRanking()
    }
  }

  const loadMockCoachRanking = () => {
    const mockData = [
      { coach_id: 1, coach_name: '张教练', total_members: 8, renewed_members: 5, renewal_rate: 62.5, renewal_amount: 45000 },
      { coach_id: 2, coach_name: '李教练', total_members: 7, renewed_members: 4, renewal_rate: 57.14, renewal_amount: 38000 },
      { coach_id: 3, coach_name: '王教练', total_members: 6, renewed_members: 3, renewal_rate: 50.0, renewal_amount: 32000 },
      { coach_id: 4, coach_name: '陈教练', total_members: 5, renewed_members: 2, renewal_rate: 40.0, renewal_amount: 25000 },
      { coach_id: 5, coach_name: '刘教练', total_members: 4, renewed_members: 1, renewal_rate: 25.0, renewal_amount: 12000 },
    ]
    setCoachRanking(mockData)
  }

  const loadExpiringMembers = async () => {
    try {
      const data = await analyticsAPI.getExpiringMembers({ days: 30, page: 1, page_size: 5 })
      setExpiringMembers(data)
    } catch (e) {
      console.error('加载到期会员失败:', e)
      loadMockExpiringMembers()
    }
  }

  const loadMockExpiringMembers = () => {
    const mockData = {
      total: 18,
      page: 1,
      page_size: 5,
      items: [
        { member_id: 1, member_no: 'M2024001', name: '张伟', phone: '13812345678', level: 'gold', coach_name: '张教练', membership_no: 'MS20240001', membership_name: '私教50节课', remaining_sessions: 5, end_date: dayjs().add(5, 'day').format('YYYY-MM-DD'), days_remaining: 5 },
        { member_id: 2, member_no: 'M2024002', name: '王芳', phone: '13887654321', level: 'silver', coach_name: '李教练', membership_no: 'MS20240002', membership_name: '私教30节课', remaining_sessions: 3, end_date: dayjs().add(8, 'day').format('YYYY-MM-DD'), days_remaining: 8 },
        { member_id: 3, member_no: 'M2024003', name: '李娜', phone: '13811112222', level: 'platinum', coach_name: '张教练', membership_no: 'MS20240003', membership_name: 'VIP私教套餐', remaining_sessions: 12, end_date: dayjs().add(12, 'day').format('YYYY-MM-DD'), days_remaining: 12 },
        { member_id: 4, member_no: 'M2024004', name: '刘洋', phone: '13833334444', level: 'normal', coach_name: '王教练', membership_no: 'MS20240004', membership_name: '私教24节课', remaining_sessions: 2, end_date: dayjs().add(15, 'day').format('YYYY-MM-DD'), days_remaining: 15 },
        { member_id: 5, member_no: 'M2024005', name: '陈静', phone: '13855556666', level: 'gold', coach_name: '陈教练', membership_no: 'MS20240005', membership_name: '私教36节课', remaining_sessions: 8, end_date: dayjs().add(20, 'day').format('YYYY-MM-DD'), days_remaining: 20 },
      ]
    }
    setExpiringMembers(mockData)
  }

  const loadStageNotes = async (stage) => {
    try {
      const data = await renewalNoteAPI.list({
        related_funnel_stage: stage,
        page_size: 10,
      })
      setNotes(Array.isArray(data) ? data : (data.items || []))
    } catch (e) {
      console.error('加载备注失败:', e)
      loadMockNotes(stage)
    }
  }

  const loadStageMembers = async (stage) => {
    try {
      const data = await analyticsAPI.getFunnelStageMembers({
        stage,
        start_date: dateRange[0]?.format('YYYY-MM-DD'),
        end_date: dateRange[1]?.format('YYYY-MM-DD'),
        days: 30,
        page_size: 10,
      })
      setStageMembers(data.items ? data : { total: data.total || 0, items: data || [] })
    } catch (e) {
      console.error('加载阶段会员失败:', e)
      setStageMembers({ total: 0, items: [] })
    }
  }

  const loadMockNotes = (stage) => {
    const mockNotes = [
      { id: 1, note_no: 'NOTE20240001', title: '即将到期会员跟进', content: '已联系5位即将到期会员，3位表示考虑续费', status: 'in_progress', priority: 'high', source: 'expiry_warning', created_by_name: '张经理', created_at: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm') },
      { id: 2, note_no: 'NOTE20240002', title: '低续费率原因分析', content: '本月续费率下降，主要原因是教练变动', conclusion: '已安排新教练对接', status: 'resolved', priority: 'urgent', source: 'analysis', created_by_name: '李主管', created_at: dayjs().subtract(5, 'day').format('YYYY-MM-DD HH:mm') },
    ]
    setNotes(mockNotes)
  }

  const nameToStageMap = {
    '总会员数': 'total_members',
    '活跃会员': 'active_members',
    '即将到期': 'expiring_members',
    '已触达会员': 'contacted_members',
    '已续费会员': 'renewed_members',
  }

  const handleStageClick = (stageOrEchartsEvent) => {
    let stage = stageOrEchartsEvent
    if (typeof stageOrEchartsEvent === 'object' && stageOrEchartsEvent.name) {
      stage = nameToStageMap[stageOrEchartsEvent.name] || stageOrEchartsEvent.data?.stage || 'expiring_members'
    }
    setSelectedStage(stage)
    setStageDetail(funnelData.find(f => f.stage === stage))
    loadStageNotes(stage)
    loadStageMembers(stage)
  }

  const funnelOnEvents = {
    click: (params) => handleStageClick(params),
  }

  const handleAddNote = () => {
    form.resetFields()
    setNoteModalVisible(true)
  }

  const handleSubmitNote = async (values) => {
    try {
      if (!values.member_id) {
        message.error('请选择关联会员')
        return
      }
      await renewalNoteAPI.create({
        title: values.title,
        content: values.content,
        priority: values.priority,
        assignee_name: values.assignee_name,
        related_funnel_stage: selectedStage,
        member_id: parseInt(values.member_id),
        source: 'manual',
        created_by_name: values.operator_name || '未命名操作员',
      })
      message.success('复盘备注创建成功，已持久化到 DuckDB')
      setNoteModalVisible(false)
      loadStageNotes(selectedStage)
    } catch (e) {
      console.error('创建备注失败:', e)
      message.error('复盘备注创建失败：' + (e.response?.data?.detail || e.message || '未知错误'))
    }
  }

  const getFunnelOption = () => {
    return {
      title: {
        text: '会员续费转化漏斗',
        left: 'center',
        textStyle: { fontSize: 16, fontWeight: 'normal' },
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
      },
      legend: {
        bottom: 10,
        data: funnelData.map(d => d.name),
      },
      series: [
        {
          name: '续费漏斗',
          type: 'funnel',
          left: '10%',
          top: 60,
          bottom: 60,
          width: '80%',
          min: 0,
          max: funnelData[0]?.value || 100,
          minSize: '0%',
          maxSize: '100%',
          sort: 'descending',
          gap: 2,
          label: {
            show: true,
            position: 'inside',
            formatter: '{b}\n{c}人',
          },
          labelLine: {
            length: 10,
            lineStyle: { width: 1, type: 'solid' },
          },
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 1,
          },
          emphasis: {
            label: { fontSize: 16 },
          },
          data: funnelData.map((d, i) => ({
            value: d.value,
            name: d.name,
            stage: d.stage,
            itemStyle: {
              color: ['#1890ff', '#52c41a', '#faad14', '#722ed1', '#13c2c2'][i % 5],
            },
          })),
        },
      ],
    }
  }

  const getTrendOption = () => {
    return {
      title: {
        text: '续费率趋势（近30天）',
        left: 'center',
        textStyle: { fontSize: 16, fontWeight: 'normal' },
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          const date = params[0].axisValue
          const rate = params[0]?.data || 0
          const renewed = params[1]?.data || 0
          return `${date}<br/>续费率: ${rate}%<br/>续费人数: ${renewed}人`
        },
      },
      legend: {
        bottom: 10,
        data: ['续费率', '续费人数'],
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: 60,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: trendData.map(d => d.date.slice(5)),
      },
      yAxis: [
        {
          type: 'value',
          name: '续费率(%)',
          position: 'left',
          axisLabel: { formatter: '{value}%' },
        },
        {
          type: 'value',
          name: '人数',
          position: 'right',
        },
      ],
      series: [
        {
          name: '续费率',
          type: 'line',
          smooth: true,
          yAxisIndex: 0,
          data: trendData.map(d => d.renewal_rate),
          itemStyle: { color: '#1890ff' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
                { offset: 1, color: 'rgba(24, 144, 255, 0.05)' },
              ],
            },
          },
        },
        {
          name: '续费人数',
          type: 'bar',
          yAxisIndex: 1,
          data: trendData.map(d => d.renewed_count),
          itemStyle: { color: '#52c41a' },
        },
      ],
    }
  }

  const coachColumns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 60,
      render: (_, __, index) => index + 1,
    },
    { title: '教练', dataIndex: 'coach_name', key: 'coach_name' },
    { title: '会员数', dataIndex: 'total_members', key: 'total_members' },
    { title: '已续费', dataIndex: 'renewed_members', key: 'renewed_members' },
    {
      title: '续费率',
      dataIndex: 'renewal_rate',
      key: 'renewal_rate',
      render: (rate) => (
        <span style={{ color: rate >= 50 ? '#52c41a' : '#ff4d4f' }}>
          {rate}%
        </span>
      ),
    },
    {
      title: '续费金额',
      dataIndex: 'renewal_amount',
      key: 'renewal_amount',
      render: (val) => `¥${val.toLocaleString()}`,
    },
  ]

  const memberColumns = [
    { title: '会员号', dataIndex: 'member_no', key: 'member_no' },
    { title: '姓名', dataIndex: 'name', key: 'name' },
    {
      title: '等级',
      dataIndex: 'level',
      key: 'level',
      render: (level) => {
        const colorMap = { normal: 'default', silver: 'blue', gold: 'gold', platinum: 'purple' }
        const nameMap = { normal: '普通', silver: '银卡', gold: '金卡', platinum: '钻石' }
        return <Tag color={colorMap[level]}>{nameMap[level]}</Tag>
      },
    },
    { title: '教练', dataIndex: 'coach_name', key: 'coach_name' },
    { title: '剩余课时', dataIndex: 'remaining_sessions', key: 'remaining_sessions' },
    {
      title: '剩余天数',
      dataIndex: 'days_remaining',
      key: 'days_remaining',
      render: (days) => (
        <Tag color={days <= 7 ? 'red' : days <= 15 ? 'orange' : 'green'}>
          {days}天
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/members/${record.member_id}`)}>
            详情
          </Button>
        </Space>
      ),
    },
  ]

  const noteColumns = [
    { title: '标题', dataIndex: 'title', key: 'title' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const map = { pending: '待处理', in_progress: '处理中', resolved: '已解决', closed: '已关闭' }
        const color = { pending: 'default', in_progress: 'processing', resolved: 'success', closed: 'default' }
        return <Tag color={color[status]}>{map[status]}</Tag>
      },
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (p) => {
        const map = { low: '低', medium: '中', high: '高', urgent: '紧急' }
        const color = { low: 'green', medium: 'blue', high: 'orange', urgent: 'red' }
        return <Tag color={color[p]}>{map[p]}</Tag>
      },
    },
    { title: '创建人', dataIndex: 'created_by_name', key: 'created_by_name' },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at' },
    {
      title: '处理结论',
      dataIndex: 'conclusion',
      key: 'conclusion',
      render: (val) => val ? (
        <Tooltip title={val}>
          <span style={{ color: '#52c41a', fontWeight: 500 }}>
            {String(val).slice(0, 15)}...
          </span>
        </Tooltip>
      ) : <Tag color="default">待处理</Tag>,
    },
  ]

  const overallRenewalRate = funnelData.length >= 5
    ? Math.round(funnelData[4].value / funnelData[0].value * 10000) / 100
    : 0

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">会员续费漏斗看板</h1>
        <p className="page-desc">从总会员到最终续费的全链路转化分析，支持逐层钻取和复盘备注</p>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <div className="stat-card">
            <div className="stat-card-title">总会员数</div>
            <div className="stat-card-value">{funnelData[0]?.value || 0}</div>
            <div className="stat-card-trend trend-up">
              <ArrowUpOutlined /> 较上月 +5.2%
            </div>
          </div>
        </Col>
        <Col span={6}>
          <div className="stat-card">
            <div className="stat-card-title">活跃会员数</div>
            <div className="stat-card-value">{funnelData[1]?.value || 0}</div>
            <div className="stat-card-trend trend-up">
              <ArrowUpOutlined /> 活跃率 {funnelData[1]?.conversion_rate || 0}%
            </div>
          </div>
        </Col>
        <Col span={6}>
          <div className="stat-card">
            <div className="stat-card-title">本期续费率</div>
            <div className="stat-card-value" style={{ color: overallRenewalRate >= 50 ? '#52c41a' : '#ff4d4f' }}>
              {overallRenewalRate}%
            </div>
            <div className={`stat-card-trend ${overallRenewalRate >= 50 ? 'trend-up' : 'trend-down'}`}>
              {overallRenewalRate >= 50 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              目标值 60%
            </div>
          </div>
        </Col>
        <Col span={6}>
          <div className="stat-card">
            <div className="stat-card-title">即将到期（30天内）</div>
            <div className="stat-card-value" style={{ color: '#faad14' }}>
              {expiringMembers.total}
            </div>
            <div className="stat-card-trend">
              <WarningOutlined style={{ color: '#faad14' }} /> 需重点跟进
            </div>
          </div>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={16}>
          <div className="chart-card">
            <div className="chart-card-header">
              <div className="chart-card-title">续费转化漏斗</div>
              <Space>
                <RangePicker value={dateRange} onChange={setDateRange} />
                <Select defaultValue="all" style={{ width: 120 }}>
                  <Option value="all">全部教练</Option>
                  <Option value="1">张教练</Option>
                  <Option value="2">李教练</Option>
                </Select>
              </Space>
            </div>
            <div style={{ cursor: 'pointer' }}>
              <ReactECharts
                option={getFunnelOption()}
                style={{ height: 400 }}
                onEvents={funnelOnEvents}
              />
            </div>

            {selectedStage && stageDetail && (
              <div className="drilldown-panel">
                <div className="drilldown-title">
                  <MessageOutlined style={{ color: '#1890ff' }} />
                  {stageDetail.name} - 下钻会员列表 & 复盘备注
                  <Button
                    type="primary"
                    size="small"
                    icon={<PlusOutlined />}
                    style={{ marginLeft: 'auto' }}
                    onClick={handleAddNote}
                  >
                    添加复盘备注
                  </Button>
                </div>

                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={6}>
                    <div className="detail-item">
                      <span className="detail-label">数量</span>
                      <span className="detail-value">{stageDetail.value} 人</span>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div className="detail-item">
                      <span className="detail-label">转化率</span>
                      <span className="detail-value">{stageDetail.conversion_rate}%</span>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div className="detail-item">
                      <span className="detail-label">漏斗阶段</span>
                      <span className="detail-value">{stageDetail.name}</span>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div className="detail-item">
                      <span className="detail-label">下钻会员数</span>
                      <span className="detail-value" style={{ color: '#1890ff' }}>
                        {stageMembers.total} 人
                      </span>
                    </div>
                  </Col>
                </Row>

                <div style={{ marginBottom: 16 }}>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#262626',
                    marginBottom: 8,
                    paddingLeft: 4,
                    borderLeft: '3px solid #1890ff',
                  }}>
                    ① 该阶段会员（点击查看档案）
                  </div>
                  <Table
                    size="small"
                    columns={memberColumns}
                    dataSource={stageMembers.items || []}
                    rowKey={(r) => `${r.member_id}-${r.membership_no || ''}`}
                    pagination={{ pageSize: 5, size: 'small' }}
                    scroll={{ x: 900 }}
                  />
                </div>

                <div>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#262626',
                    marginBottom: 8,
                    paddingLeft: 4,
                    borderLeft: '3px solid #52c41a',
                  }}>
                    ② 复盘备注 & 处理结论
                  </div>
                  <Table
                    size="small"
                    columns={noteColumns}
                    dataSource={notes}
                    rowKey={(r) => r.note_id || r.id || Math.random()}
                    pagination={{ pageSize: 5, size: 'small' }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="chart-card">
            <div className="chart-card-header">
              <div className="chart-card-title">续费率趋势</div>
            </div>
            <ReactECharts option={getTrendOption()} style={{ height: 300 }} />
          </div>
        </Col>

        <Col span={8}>
          <div className="chart-card">
            <div className="chart-card-header">
              <div className="chart-card-title">教练续费率排行</div>
            </div>
            <Table
              size="small"
              columns={coachColumns}
              dataSource={coachRanking}
              rowKey="coach_id"
              pagination={false}
            />
          </div>

          <div className="chart-card">
            <div className="chart-card-header">
              <div className="chart-card-title">即将到期会员（30天内）</div>
              <Button type="link" onClick={() => navigate('/members')}>查看全部</Button>
            </div>
            <Table
              size="small"
              columns={memberColumns}
              dataSource={expiringMembers.items}
              rowKey="member_id"
              pagination={false}
            />
          </div>
        </Col>
      </Row>

      <Modal
        title="添加复盘备注"
        open={noteModalVisible}
        onOk={() => form.submit()}
        onCancel={() => setNoteModalVisible(false)}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmitNote}>
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入备注标题" />
          </Form.Item>
          <Form.Item
            name="content"
            label="内容"
            rules={[{ required: true, message: '请输入内容' }]}
          >
            <TextArea rows={4} placeholder="请输入详细备注内容" />
          </Form.Item>
          <Form.Item name="priority" label="优先级">
            <Select defaultValue="medium">
              <Option value="low">低</Option>
              <Option value="medium">中</Option>
              <Option value="high">高</Option>
              <Option value="urgent">紧急</Option>
            </Select>
          </Form.Item>
          <Form.Item name="assignee_name" label="指派给">
            <Input placeholder="负责人姓名" />
          </Form.Item>
          <Form.Item
            name="member_id"
            label="关联会员"
            rules={[{ required: true, message: '请选择关联的会员' }]}
            tooltip="该复盘备注关联到哪个具体会员的续费跟进"
          >
            <Select
              showSearch
              placeholder="选择关联会员（从当前漏斗阶段会员中选）"
              optionFilterProp="label"
              options={(stageMembers.items || []).map((m) => ({
                value: m.member_id || m.id,
                label: `${m.member_no || ''} ${m.name} ${m.phone ? '(' + m.phone + ')' : ''}`,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="operator_name"
            label="操作人姓名"
            rules={[{ required: true, message: '请输入您的姓名用于审计追溯' }]}
          >
            <Input placeholder="例如：运营经理-张三" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default FunnelDashboard
