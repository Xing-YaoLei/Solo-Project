import React, { useState, useEffect, useCallback } from 'react'
import {
  Row,
  Col,
  Card,
  Select,
  Button,
  Tag,
  Space,
  App as AntApp,
  Descriptions,
  List,
  Tooltip,
  Alert,
  Divider,
  Input,
  DatePicker,
  Form,
  Table,
  Statistic,
} from 'antd'
import {
  FileExcelOutlined,
  DownloadOutlined,
  FilterOutlined,
  InfoCircleOutlined,
  LineChartOutlined,
  FunnelPlotOutlined,
  ToolOutlined,
  PictureOutlined,
  SettingOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { api } from '../api/index.js'

const { RangePicker } = DatePicker

const REPORT_TEMPLATES = [
  {
    key: 'funnel-report',
    name: '促销陈列漏斗报表',
    icon: <FunnelPlotOutlined style={{ fontSize: 28, color: '#1677ff' }} />,
    color: 'blue',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    description: '包含5阶段漏斗转化数据、异常点与复盘说明、促销达成计算规则',
    sheets: ['促销陈列漏斗', '异常点与复盘说明', '促销达成计算规则'],
    params: ['region', 'store_id', 'promotion_id', 'date_range'],
    handler: (params) => api.downloadFunnelReport(params),
  },
  {
    key: 'sales-trend-report',
    name: '销售变化走势报表',
    icon: <LineChartOutlined style={{ fontSize: 28, color: '#52c41a' }} />,
    color: 'green',
    gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    description: '包含促销汇总、每日销售走势（含异常复盘）、陈列不合格影响范围、计算规则',
    sheets: ['促销汇总', '每日销售走势(含异常复盘)', '陈列不合格影响范围', '促销达成计算规则'],
    params: ['promotion_id'],
    handler: (promoId) => api.downloadSalesTrendReport(promoId),
  },
  {
    key: 'rectification-report',
    name: '整改记录汇总报表',
    icon: <ToolOutlined style={{ fontSize: 28, color: '#faad14' }} />,
    color: 'orange',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    description: '包含整改进度统计、超期预警、整改明细、责任人汇总',
    sheets: ['整改进度总览', '整改明细列表', '超期预警清单', '责任人汇总'],
    params: ['status', 'date_range'],
    handler: (params) => {
      const q = new URLSearchParams({
        ...(params.status ? { status: params.status } : {}),
        ...(params.start_date ? { start_date: params.start_date } : {}),
        ...(params.end_date ? { end_date: params.end_date } : {}),
      }).toString()
      window.open(`/api/v1/download/rectification-report?${q}`, '_blank')
    },
  },
  {
    key: 'display-photo-report',
    name: '陈列照片巡检报表',
    icon: <PictureOutlined style={{ fontSize: 28, color: '#722ed1' }} />,
    color: 'purple',
    gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    description: '包含陈列合格统计、照片上传记录、巡检评分明细',
    sheets: ['陈列合格统计', '照片上传记录', '巡检评分明细'],
    params: ['store_id', 'promotion_id', 'date_range'],
    handler: (params) => {
      const q = new URLSearchParams({
        ...(params.store_id ? { store_id: params.store_id } : {}),
        ...(params.promotion_id ? { promotion_id: params.promotion_id } : {}),
        ...(params.start_date ? { start_date: params.start_date } : {}),
        ...(params.end_date ? { end_date: params.end_date } : {}),
      }).toString()
      window.open(`/api/v1/download/display-photo-report?${q}`, '_blank')
    },
  },
  {
    key: 'threshold-audit-report',
    name: '阈值调整审计报表',
    icon: <SettingOutlined style={{ fontSize: 28, color: '#eb2f96' }} />,
    color: 'magenta',
    gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    description: '包含当前阈值清单、历史变更记录、修改人统计',
    sheets: ['当前阈值配置', '阈值变更历史', '修改人统计'],
    params: [],
    handler: () => {
      window.open('/api/v1/download/threshold-audit-report', '_blank')
    },
  },
  {
    key: 'exception-digest-report',
    name: '异常数据摘要报表',
    icon: <WarningOutlined style={{ fontSize: 28, color: '#f5222d' }} />,
    color: 'red',
    gradient: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
    description: '包含3类异常（收银延迟/会员缺失/医保口径）统计、影响范围、处理状态',
    sheets: ['异常类型汇总', '收银延迟明细', '会员缺失明细', '医保口径变化明细', '异常处理状态'],
    params: ['exception_type', 'date_range'],
    handler: (params) => {
      const q = new URLSearchParams({
        ...(params.exception_type ? { exception_type: params.exception_type } : {}),
        ...(params.start_date ? { start_date: params.start_date } : {}),
        ...(params.end_date ? { end_date: params.end_date } : {}),
      }).toString()
      window.open(`/api/v1/download/exception-digest-report?${q}`, '_blank')
    },
  },
]

const CALC_RULES_PREVIEW = [
  {
    name: '活动覆盖率',
    formula: '活动创建门店数 ÷ 总门店数 × 100%',
    description: '衡量促销活动在所有连锁店中的覆盖广度',
  },
  {
    name: '巡检完成率',
    formula: '已完成巡检门店数 ÷ 活动覆盖门店数 × 100%',
    description: '评估各门店陈列巡检工作的执行情况',
  },
  {
    name: '陈列合格率',
    formula: '陈列评分≥合格线的门店数 ÷ 已完成巡检门店数 × 100%',
    description: '合格线默认80分，可在阈值配置中调整',
  },
  {
    name: '整改完成率',
    formula: '已完成整改数 ÷ 需整改总数 × 100%',
    description: '衡量陈列问题整改的闭环效率',
  },
  {
    name: '销售达成率',
    formula: '实际促销销售额 ÷ 目标销售额 × 100%',
    description: '评估促销活动的最终销售业绩',
  },
  {
    name: '陈列影响损失估算',
    formula: '日均目标销售额 × 影响天数 × 30%',
    description: '陈列不合格期间预计损失的销售额（保守估算系数30%）',
  },
]

export default function DownloadCenter() {
  const { message } = AntApp.useApp()
  const [loading, setLoading] = useState(false)
  const [stores, setStores] = useState([])
  const [promotions, setPromotions] = useState([])
  const [refreshLogs, setRefreshLogs] = useState([])
  const [selectedKey, setSelectedKey] = useState(null)
  const [form] = Form.useForm()
  const [downloadingKey, setDownloadingKey] = useState(null)

  const fetchMeta = useCallback(async () => {
    setLoading(true)
    try {
      const [s, p, logs] = await Promise.all([
        api.getStores(),
        api.getPromotions(),
        api.getRefreshLogs(10),
      ])
      setStores(s || [])
      setPromotions(p || [])
      setRefreshLogs(logs || [])
    } catch (e) {
      message.error('加载基础数据失败')
    } finally {
      setLoading(false)
    }
  }, [message])

  useEffect(() => {
    fetchMeta()
  }, [fetchMeta])

  const regions = [...new Set(stores.map((s) => s.region).filter(Boolean))]

  const handleDownload = async (tpl) => {
    try {
      setDownloadingKey(tpl.key)
      const values = await form.validateFields()

      let params = {}
      if (tpl.params.includes('region')) params.region = values.region
      if (tpl.params.includes('store_id')) params.store_id = values.store_id
      if (tpl.params.includes('promotion_id')) params.promotion_id = values.promotion_id
      if (tpl.params.includes('status')) params.status = values.status
      if (tpl.params.includes('exception_type')) params.exception_type = values.exception_type
      if (tpl.params.includes('date_range') && values.date_range?.length === 2) {
        params.start_date = values.date_range[0].format('YYYY-MM-DD')
        params.end_date = values.date_range[1].format('YYYY-MM-DD')
      }

      if (tpl.key === 'sales-trend-report') {
        if (!params.promotion_id) {
          message.warning('请选择促销活动')
          return
        }
        tpl.handler(params.promotion_id)
      } else {
        tpl.handler(params)
      }

      message.success(`报表正在生成中，稍后将自动下载...`)
    } catch (e) {
      if (e?.errorFields) return
      message.error('下载请求失败')
    } finally {
      setTimeout(() => setDownloadingKey(null), 1500)
    }
  }

  const logColumns = [
    {
      title: '刷新时间',
      dataIndex: 'refreshed_at',
      key: 'refreshed_at',
      width: 180,
      render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '触发方式',
      dataIndex: 'triggered_by',
      key: 'triggered_by',
      width: 140,
      render: (v) => {
        const map = {
          scheduled: { color: 'blue', text: '定时任务', icon: <ClockCircleOutlined /> },
          frontend_user: { color: 'cyan', text: '用户手动', icon: <CheckCircleOutlined /> },
          api: { color: 'purple', text: 'API调用', icon: <InfoCircleOutlined /> },
        }
        const cfg = map[v] || { color: 'default', text: v, icon: null }
        return (
          <Tag color={cfg.color}>
            {cfg.icon} {cfg.text}
          </Tag>
        )
      },
    },
    {
      title: '处理记录数',
      dataIndex: 'records_processed',
      key: 'records_processed',
      width: 120,
      align: 'center',
      render: (v) => <Statistic value={v} valueStyle={{ fontSize: 14, fontWeight: 600 }} />,
    },
    {
      title: '异常发现',
      dataIndex: 'exceptions_found',
      key: 'exceptions_found',
      render: (v) => {
        if (!v) return <span style={{ color: '#9ca3af' }}>无异常</span>
        try {
          const obj = typeof v === 'string' ? JSON.parse(v) : v
          return (
            <Space wrap size={6}>
              {obj.cashier_delay > 0 && (
                <Tag color="orange">⏱️ 收银延迟 {obj.cashier_delay}条</Tag>
              )}
              {obj.member_missing > 0 && (
                <Tag color="purple">👥 会员缺失 {obj.member_missing}条</Tag>
              )}
              {obj.mi_caliber_change > 0 && (
                <Tag color="cyan">🏥 医保口径 {obj.mi_caliber_change}条</Tag>
              )}
              {(!obj.cashier_delay && !obj.member_missing && !obj.mi_caliber_change) && (
                <Tag color="green">✅ 无异常</Tag>
              )}
            </Space>
          )
        } catch {
          return <Tag>{String(v)}</Tag>
        }
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center',
      render: (v) => {
        const map = {
          success: { color: 'green', text: '成功', icon: <CheckCircleOutlined /> },
          partial: { color: 'orange', text: '部分成功', icon: <WarningOutlined /> },
          failed: { color: 'red', text: '失败', icon: <WarningOutlined /> },
        }
        const cfg = map[v] || { color: 'default', text: v, icon: null }
        return (
          <Tag color={cfg.color}>
            {cfg.icon} {cfg.text}
          </Tag>
        )
      },
    },
  ]

  return (
    <div>
      <Alert
        type="success"
        showIcon
        icon={<FileTextOutlined />}
        message="所有下载报表均附带「促销达成计算规则」Sheet"
        description="报表中所有指标的计算公式、口径说明、参数取值都将在最后一个Sheet中详细列出，便于业务人员理解和复核。"
        style={{ marginBottom: 16 }}
      />

      <Row gutter={[16, 16]}>
        {REPORT_TEMPLATES.map((tpl) => (
          <Col xs={24} md={12} xl={8} key={tpl.key}>
            <Card
              hoverable
              onClick={() => setSelectedKey(tpl.key === selectedKey ? null : tpl.key)}
              style={{
                border: tpl.key === selectedKey ? `2px solid #1677ff` : '1px solid #f0f0f0',
                borderRadius: 12,
                transition: 'all 0.25s ease',
                transform: tpl.key === selectedKey ? 'translateY(-4px)' : 'none',
                boxShadow:
                  tpl.key === selectedKey
                    ? '0 8px 24px rgba(22,119,255,0.15)'
                    : '0 2px 8px rgba(0,0,0,0.04)',
              }}
              bodyStyle={{ padding: '20px 20px 16px' }}
            >
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 12,
                      background: tpl.gradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      flexShrink: 0,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  >
                    {tpl.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Space align="center" style={{ marginBottom: 4 }}>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: 16,
                          fontWeight: 700,
                          color: '#1f2937',
                        }}
                      >
                        {tpl.name}
                      </h3>
                      <Tag color={tpl.color} style={{ margin: 0 }}>
                        {tpl.sheets.length} 个Sheet
                      </Tag>
                    </Space>
                    <p
                      style={{
                        margin: 0,
                        color: '#6b7280',
                        fontSize: 13,
                        lineHeight: 1.6,
                      }}
                    >
                      {tpl.description}
                    </p>
                  </div>
                </div>

                <Divider style={{ margin: '4px 0 8px' }} />

                <div>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <div
                      style={{
                        fontSize: 12,
                        color: '#6b7280',
                        fontWeight: 500,
                      }}
                    >
                      <FileExcelOutlined style={{ marginRight: 4 }} />
                      包含的Sheet：
                    </div>
                    <Space wrap size={4}>
                      {tpl.sheets.map((s, i) => (
                        <Tag
                          key={i}
                          style={{
                            margin: 0,
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            color: '#475569',
                          }}
                        >
                          {i + 1}. {s}
                        </Tag>
                      ))}
                    </Space>
                  </Space>
                </div>

                {tpl.key === selectedKey && (
                  <div
                    style={{
                      marginTop: 4,
                      padding: '12px 12px 4px',
                      background: '#f0f7ff',
                      borderRadius: 8,
                      border: '1px solid #bae0ff',
                    }}
                  >
                    {tpl.params.length > 0 ? (
                      <Space wrap size={8} style={{ marginBottom: 8 }}>
                        {tpl.params.includes('region') && (
                          <Tag color="blue">筛选：区域</Tag>
                        )}
                        {tpl.params.includes('store_id') && (
                          <Tag color="cyan">筛选：门店</Tag>
                        )}
                        {tpl.params.includes('promotion_id') && (
                          <Tag color="purple">筛选：促销活动</Tag>
                        )}
                        {tpl.params.includes('status') && (
                          <Tag color="orange">筛选：状态</Tag>
                        )}
                        {tpl.params.includes('exception_type') && (
                          <Tag color="red">筛选：异常类型</Tag>
                        )}
                        {tpl.params.includes('date_range') && (
                          <Tag color="green">筛选：日期范围</Tag>
                        )}
                      </Space>
                    ) : (
                      <Tag color="default" style={{ marginBottom: 8 }}>
                        无需筛选条件，点击即可下载全量数据
                      </Tag>
                    )}
                  </div>
                )}
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      {selectedKey && (
        <Card
          title={
            <Space>
              <FilterOutlined style={{ color: '#1677ff' }} />
              <span style={{ fontSize: 16, fontWeight: 600 }}>
                配置下载条件：{REPORT_TEMPLATES.find((r) => r.key === selectedKey)?.name}
              </span>
            </Space>
          }
          style={{ marginTop: 20, borderRadius: 12 }}
          extra={
            <Button
              type="primary"
              size="large"
              icon={<DownloadOutlined />}
              loading={downloadingKey === selectedKey}
              onClick={() =>
                handleDownload(REPORT_TEMPLATES.find((r) => r.key === selectedKey))
              }
              style={{
                background: REPORT_TEMPLATES.find((r) => r.key === selectedKey)?.gradient,
                border: 'none',
                fontWeight: 600,
              }}
            >
              生成并下载报表
            </Button>
          }
        >
          <Form form={form} layout="inline" style={{ rowGap: 16 }}>
            {REPORT_TEMPLATES.find((r) => r.key === selectedKey)?.params.includes('region') && (
              <Form.Item label="区域" name="region">
                <Select
                  placeholder="全部区域"
                  style={{ width: 160 }}
                  allowClear
                  options={regions.map((r) => ({ value: r, label: r }))}
                />
              </Form.Item>
            )}
            {REPORT_TEMPLATES.find((r) => r.key === selectedKey)?.params.includes('store_id') && (
              <Form.Item label="门店" name="store_id">
                <Select
                  placeholder="全部门店"
                  style={{ width: 220 }}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={stores.map((s) => ({
                    value: s.id,
                    label: `${s.store_code} - ${s.store_name}`,
                  }))}
                />
              </Form.Item>
            )}
            {REPORT_TEMPLATES.find((r) => r.key === selectedKey)?.params.includes(
              'promotion_id',
            ) && (
              <Form.Item
                label="促销活动"
                name="promotion_id"
                rules={
                  selectedKey === 'sales-trend-report'
                    ? [{ required: true, message: '请选择促销活动' }]
                    : []
                }
              >
                <Select
                  placeholder="请选择促销活动"
                  style={{ width: 280 }}
                  allowClear={selectedKey !== 'sales-trend-report'}
                  showSearch
                  optionFilterProp="label"
                  options={promotions.map((p) => ({
                    value: p.id,
                    label: `${p.promo_code} | ${p.promo_name} (${dayjs(p.start_date).format(
                      'MM/DD',
                    )}-${dayjs(p.end_date).format('MM/DD')})`,
                  }))}
                />
              </Form.Item>
            )}
            {REPORT_TEMPLATES.find((r) => r.key === selectedKey)?.params.includes('status') && (
              <Form.Item label="整改状态" name="status">
                <Select
                  placeholder="全部状态"
                  style={{ width: 160 }}
                  allowClear
                  options={[
                    { value: 'pending', label: '待整改' },
                    { value: 'completed', label: '已完成' },
                    { value: 'overdue', label: '已超期' },
                  ]}
                />
              </Form.Item>
            )}
            {REPORT_TEMPLATES.find((r) => r.key === selectedKey)?.params.includes(
              'exception_type',
            ) && (
              <Form.Item label="异常类型" name="exception_type">
                <Select
                  placeholder="全部异常类型"
                  style={{ width: 180 }}
                  allowClear
                  options={[
                    { value: 'cashier_delay', label: '⏱️ 收银系统延迟' },
                    { value: 'member_missing', label: '👥 会员记录缺失' },
                    { value: 'mi_caliber_change', label: '🏥 医保接口口径变化' },
                  ]}
                />
              </Form.Item>
            )}
            {REPORT_TEMPLATES.find((r) => r.key === selectedKey)?.params.includes(
              'date_range',
            ) && (
              <Form.Item label="日期范围" name="date_range">
                <RangePicker
                  style={{ width: 260 }}
                  placeholder={['开始日期', '结束日期']}
                  allowClear
                />
              </Form.Item>
            )}
          </Form>
        </Card>
      )}

      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <FileTextOutlined style={{ color: '#52c41a' }} />
                <span style={{ fontSize: 16, fontWeight: 600 }}>促销达成计算规则预览</span>
                <Tag color="green">下载时自动附加</Tag>
              </Space>
            }
            style={{ borderRadius: 12 }}
          >
            <List
              dataSource={CALC_RULES_PREVIEW}
              renderItem={(item, idx) => (
                <List.Item key={idx}>
                  <List.Item.Meta
                    avatar={
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          background: '#f0f7ff',
                          color: '#1677ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: 14,
                        }}
                      >
                        {idx + 1}
                      </div>
                    }
                    title={
                      <Space>
                        <span style={{ fontWeight: 600, color: '#1f2937' }}>{item.name}</span>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={2} style={{ width: '100%' }}>
                        <code
                          style={{
                            background: '#fffbe6',
                            padding: '2px 8px',
                            borderRadius: 4,
                            color: '#d46b08',
                            fontSize: 12,
                            display: 'inline-block',
                          }}
                        >
                          {item.formula}
                        </code>
                        <span style={{ color: '#6b7280', fontSize: 12 }}>{item.description}</span>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <HistoryOutlined style={{ color: '#722ed1' }} />
                <span style={{ fontSize: 16, fontWeight: 600 }}>最近数据刷新记录</span>
              </Space>
            }
            extra={
              <Button size="small" icon={<DownloadOutlined />} type="link">
                下载刷新日志
              </Button>
            }
            style={{ borderRadius: 12 }}
          >
            <Table
              rowKey="id"
              size="small"
              loading={loading}
              columns={logColumns}
              dataSource={refreshLogs}
              pagination={{ pageSize: 5 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
