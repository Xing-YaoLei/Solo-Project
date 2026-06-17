import React, { useState, useEffect, useCallback } from 'react'
import {
  Row,
  Col,
  Card,
  Select,
  Button,
  DatePicker,
  Space,
  Tag,
  Progress,
  Statistic,
  Table,
  App as AntApp,
  Modal,
} from 'antd'
import {
  ReloadOutlined,
  DownloadOutlined,
  ShoppingCartOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  RiseOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  MedicineBoxOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import { api, EXCEPTION_LABELS } from '../api/index.js'

const { RangePicker } = DatePicker

export default function Dashboard() {
  const { message, modal } = AntApp.useApp()
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [promotions, setPromotions] = useState([])
  const [stores, setStores] = useState([])
  const [funnelData, setFunnelData] = useState([])
  const [exceptions, setExceptions] = useState({ total: 0, summary: {}, details: {} })
  const [filters, setFilters] = useState({
    region: undefined,
    store_id: undefined,
    promotion_id: undefined,
    start_date: undefined,
    end_date: undefined,
  })
  const [selectedPromo, setSelectedPromo] = useState(null)
  const [detailModal, setDetailModal] = useState({ open: false, data: null })

  const regions = ['华东区', '华北区', '华南区', '西南区']

  const fetchPromotions = useCallback(async () => {
    try {
      const data = await api.getPromotions()
      setPromotions(data)
    } catch (e) {
      console.error(e)
    }
  }, [])

  const fetchStores = useCallback(async (region) => {
    try {
      const data = await api.getStores(region ? { region } : {})
      setStores(data)
    } catch (e) {
      console.error(e)
    }
  }, [])

  const fetchFunnel = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.promotion_id) params.promotion_id = filters.promotion_id
      if (filters.store_id) params.store_id = filters.store_id
      if (filters.region) params.region = filters.region
      if (filters.start_date) params.start_date = filters.start_date.format('YYYY-MM-DD')
      if (filters.end_date) params.end_date = filters.end_date.format('YYYY-MM-DD')
      const data = await api.getFunnel(params)
      setFunnelData(data)

      const ex = await api.scanExceptions(filters.promotion_id)
      setExceptions({
        total: ex.total_exceptions,
        summary: ex.summary,
        details: ex.details,
      })
    } catch (e) {
      message.error('加载漏斗数据失败')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [filters, message])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const res = await api.refresh('看板用户')
      if (res.status === 'success') {
        message.success(
          `数据刷新完成！处理 ${res.records_processed} 条记录，发现 ${res.total_exceptions || 0} 处异常`,
        )
      }
      await fetchFunnel()
    } catch (e) {
      message.error('刷新失败，请检查后端服务')
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchPromotions()
    fetchStores()
  }, [fetchPromotions, fetchStores])

  useEffect(() => {
    fetchFunnel()
  }, [fetchFunnel])

  const handleDownload = () => {
    const params = {}
    if (filters.promotion_id) params.promotion_id = filters.promotion_id
    if (filters.region) params.region = filters.region
    if (filters.start_date) params.start_date = filters.start_date.format('YYYY-MM-DD')
    if (filters.end_date) params.end_date = filters.end_date.format('YYYY-MM-DD')
    api.downloadFunnelReport(params)
    message.success('报表下载已开始，附带促销达成计算规则')
  }

  const totalTarget = funnelData.reduce((s, d) => s + (d.target_sales || 0), 0)
  const totalActual = funnelData.reduce((s, d) => s + (d.actual_sales || 0), 0)
  const avgRate =
    funnelData.length > 0
      ? funnelData.reduce((s, d) => s + (d.target_achievement_rate || 0), 0) / funnelData.length
      : 0

  const getFunnelChartOption = () => {
    if (!funnelData.length) {
      return { title: { text: '暂无数据', left: 'center', top: 'center' } }
    }
    const stagesMap = {}
    funnelData.forEach((promo) => {
      promo.stages.forEach((s) => {
        if (!stagesMap[s.stage_code]) {
          stagesMap[s.stage_code] = { name: s.stage, value: 0, count: 0 }
        }
        stagesMap[s.stage_code].value += s.rate
        stagesMap[s.stage_code].count += 1
      })
    })
    const data = Object.values(stagesMap).map((s) => ({
      name: s.name,
      value: Number((s.value / (s.count || 1)).toFixed(2)),
    }))
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
      legend: { top: 10 },
      series: [
        {
          name: '平均漏斗转化率',
          type: 'funnel',
          left: '10%',
          top: 60,
          width: '80%',
          min: 0,
          max: 100,
          label: { show: true, position: 'inside', formatter: '{b}\n{c}%' },
          itemStyle: { borderColor: '#fff', borderWidth: 2 },
          emphasis: {
            label: { fontSize: 16, fontWeight: 'bold' },
          },
          data,
          color: ['#1677ff', '#36cfc9', '#73d13d', '#ffc53d', '#ff7a45'],
        },
      ],
    }
  }

  const columns = [
    {
      title: '促销编码',
      dataIndex: 'promo_code',
      width: 120,
      fixed: 'left',
      render: (v, row) => (
        <a
          className="review-link"
          onClick={() => {
            setSelectedPromo(row.promotion_id)
            setDetailModal({ open: true, data: row })
          }}
        >
          {v}
        </a>
      ),
    },
    { title: '促销名称', dataIndex: 'promo_name', width: 180, ellipsis: true },
    { title: '门店', dataIndex: 'store_name', width: 180 },
    {
      title: '目标销售额(元)',
      dataIndex: 'target_sales',
      width: 130,
      sorter: (a, b) => a.target_sales - b.target_sales,
      render: (v) => v?.toLocaleString() || 0,
    },
    {
      title: '实际销售额(元)',
      dataIndex: 'actual_sales',
      width: 130,
      sorter: (a, b) => a.actual_sales - b.actual_sales,
      render: (v) => v?.toLocaleString() || 0,
    },
    {
      title: '销售达成率',
      dataIndex: 'target_achievement_rate',
      width: 200,
      sorter: (a, b) => a.target_achievement_rate - b.target_achievement_rate,
      render: (v) => (
        <Progress
          percent={Number(v?.toFixed(1))}
          status={v >= 100 ? 'success' : v >= 70 ? 'normal' : 'exception'}
          size="small"
        />
      ),
    },
    {
      title: '漏斗阶段',
      width: 420,
      render: (_, row) => (
        <Space size={[4, 4]} wrap>
          {row.stages.map((s) => (
            <Tag
              key={s.stage_code}
              color={
                s.stage_code === 'achievement'
                  ? s.rate >= 100
                    ? 'green'
                    : s.rate >= 70
                    ? 'blue'
                    : 'red'
                  : s.rate >= 80
                  ? 'green'
                  : s.rate >= 60
                  ? 'orange'
                  : 'red'
              }
              style={{ margin: 0 }}
            >
              {s.stage} {s.rate.toFixed(0)}%
            </Tag>
          ))}
        </Space>
      ),
    },
  ]

  return (
    <div>
      {exceptions.total > 0 && (
        <div className="exception-banner">
          <span style={{ fontSize: 15, fontWeight: 600, color: '#cf1322' }}>
            <WarningOutlined /> 本次刷新检测到 {exceptions.total} 处数据异常：
          </span>
          {Object.keys(EXCEPTION_LABELS).map((key) => {
            const count = exceptions.summary[key] || 0
            if (count === 0) return null
            const info = EXCEPTION_LABELS[key]
            return (
              <div
                key={key}
                className="exception-item"
                onClick={() =>
                  modal.info({
                    title: `${info.icon} ${info.label}明细`,
                    content: (
                      <div>
                        {exceptions.details[key]?.length ? (
                          <Table
                            size="small"
                            dataSource={exceptions.details[key]}
                            columns={[
                              { title: '日期', dataIndex: 'date' },
                              { title: '促销ID', dataIndex: 'promotion_id' },
                              ...(key === 'cashier_delay'
                                ? [{ title: '延迟(分钟)', dataIndex: 'delay_minutes' }]
                                : []),
                              ...(key === 'member_missing'
                                ? [{ title: '缺失(条)', dataIndex: 'missing_count' }]
                                : []),
                              ...(key === 'mi_caliber_change'
                                ? [{ title: '数据版本', dataIndex: 'data_version' }]
                                : []),
                              ...(key !== 'mi_caliber_change'
                                ? [{ title: '阈值', dataIndex: 'threshold' }]
                                : []),
                            ]}
                            pagination={{ pageSize: 5 }}
                            rowKey={(r, i) => i}
                          />
                        ) : (
                          <span>暂无明细</span>
                        )}
                      </div>
                    ),
                  })
                }
                style={{ cursor: 'pointer' }}
              >
                <span>{info.icon}</span>
                <span>{info.label}</span>
                <span className="exception-count">{count}</span>
              </div>
            )
          })}
        </div>
      )}

      <div className="card-section">
        <Row gutter={[16, 16]} align="middle">
          <Col span={24}>
            <Space size="middle" wrap>
              <Select
                allowClear
                placeholder="选择区域"
                style={{ width: 160 }}
                options={regions.map((r) => ({ value: r, label: r }))}
                value={filters.region}
                onChange={(v) => {
                  setFilters((f) => ({ ...f, region: v, store_id: undefined }))
                  fetchStores(v)
                }}
              />
              <Select
                allowClear
                showSearch
                placeholder="选择门店"
                style={{ width: 220 }}
                options={stores.map((s) => ({ value: s.id, label: `${s.store_code} - ${s.store_name}` }))}
                value={filters.store_id}
                onChange={(v) => setFilters((f) => ({ ...f, store_id: v }))}
              />
              <Select
                allowClear
                showSearch
                placeholder="选择促销活动"
                style={{ width: 280 }}
                options={promotions.map((p) => ({
                  value: p.id,
                  label: `${p.promo_code} - ${p.promo_name}`,
                }))}
                value={filters.promotion_id}
                onChange={(v) => setFilters((f) => ({ ...f, promotion_id: v }))}
              />
              <RangePicker
                value={[filters.start_date, filters.end_date]}
                onChange={(v) =>
                  setFilters((f) => ({
                    ...f,
                    start_date: v?.[0],
                    end_date: v?.[1],
                  }))
                }
              />
              <Button icon={<ReloadOutlined />} onClick={fetchFunnel}>
                查询
              </Button>
            </Space>
            <Space style={{ float: 'right' }}>
              <Button
                type="primary"
                icon={<ReloadOutlined spin={refreshing} />}
                loading={refreshing}
                onClick={handleRefresh}
              >
                刷新数据(标注异常)
              </Button>
              <Button icon={<DownloadOutlined />} type="default" onClick={handleDownload}>
                下载报表
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <div className="stat-card info">
            <div className="stat-label">促销活动数</div>
            <div className="stat-value">{funnelData.length}</div>
            <ShoppingCartOutlined className="stat-icon" />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="stat-card success">
            <div className="stat-label">累计销售额(元)</div>
            <div className="stat-value">{totalActual.toLocaleString()}</div>
            <RiseOutlined className="stat-icon" />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="stat-card">
            <div className="stat-label">累计目标额(元)</div>
            <div className="stat-value">{totalTarget.toLocaleString()}</div>
            <CheckCircleOutlined className="stat-icon" />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className={`stat-card ${avgRate >= 80 ? 'success' : avgRate >= 60 ? '' : 'warning'}`}>
            <div className="stat-label">平均达成率</div>
            <div className="stat-value">{avgRate.toFixed(1)}%</div>
            <ExclamationCircleOutlined className="stat-icon" />
          </div>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <div className="card-section">
            <div className="section-title">促销陈列漏斗（平均转化率）</div>
            <ReactECharts
              option={getFunnelChartOption()}
              style={{ height: 420 }}
              loading={loading}
            />
          </div>
        </Col>
        <Col xs={24} lg={14}>
          <div className="card-section">
            <div className="section-title">核心指标概览</div>
            <Row gutter={[16, 16]}>
              {[
                {
                  label: '收银系统延迟异常',
                  count: exceptions.summary.cashier_delay || 0,
                  icon: <ClockCircleOutlined />,
                  color: '#d46b08',
                },
                {
                  label: '会员记录缺失异常',
                  count: exceptions.summary.member_missing || 0,
                  icon: <TeamOutlined />,
                  color: '#531dab',
                },
                {
                  label: '医保口径变化异常',
                  count: exceptions.summary.mi_caliber_change || 0,
                  icon: <MedicineBoxOutlined />,
                  color: '#08979c',
                },
                {
                  label: '异常总计',
                  count: exceptions.total || 0,
                  icon: <WarningOutlined />,
                  color: '#cf1322',
                },
              ].map((s, i) => (
                <Col span={12} key={i}>
                  <Card size="small" style={{ borderRadius: 8 }}>
                    <Statistic
                      title={s.label}
                      value={s.count}
                      prefix={<span style={{ color: s.color }}>{s.icon}</span>}
                      valueStyle={{ color: s.color }}
                      suffix="条"
                    />
                  </Card>
                </Col>
              ))}
            </Row>
            {funnelData.slice(0, 3).map((p) => (
              <Card
                key={p.promotion_id}
                size="small"
                style={{ marginTop: 12, borderRadius: 8 }}
                title={
                  <span>
                    {p.promo_code} - {p.promo_name}
                    <Tag color="blue" style={{ marginLeft: 8 }}>
                      {p.store_name}
                    </Tag>
                  </span>
                }
                extra={
                  <Tag color={p.target_achievement_rate >= 100 ? 'green' : p.target_achievement_rate >= 70 ? 'orange' : 'red'}>
                    达成 {p.target_achievement_rate.toFixed(1)}%
                  </Tag>
                }
              >
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {p.stages.map((s) => (
                    <div
                      key={s.stage_code}
                      style={{
                        flex: 1,
                        minWidth: 100,
                        padding: '8px 12px',
                        background:
                          s.rate >= 80
                            ? '#f6ffed'
                            : s.rate >= 60
                            ? '#fffbe6'
                            : '#fff1f0',
                        borderRadius: 6,
                      }}
                    >
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{s.stage}</div>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color:
                            s.rate >= 80
                              ? '#389e0d'
                              : s.rate >= 60
                              ? '#d46b08'
                              : '#cf1322',
                        }}
                      >
                        {s.rate.toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </Col>
      </Row>

      <div className="card-section">
        <div className="section-title">促销陈列漏斗明细</div>
        <Table
          columns={columns}
          dataSource={funnelData}
          loading={loading}
          rowKey="promotion_id"
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </div>

      <Modal
        open={detailModal.open}
        title={detailModal.data ? `${detailModal.data.promo_code} - ${detailModal.data.promo_name}` : ''}
        width={720}
        onCancel={() => setDetailModal({ open: false, data: null })}
        footer={[
          <Button key="close" onClick={() => setDetailModal({ open: false, data: null })}>
            关闭
          </Button>,
          <Button
            key="download"
            type="primary"
            onClick={() => {
              api.downloadSalesTrendReport(selectedPromo)
              message.success('销售走势报表下载中，附带促销达成计算规则')
            }}
          >
            下载该促销详细报表
          </Button>,
        ]}
      >
        {detailModal.data && (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" style={{ marginBottom: 12 }}>
                  <Statistic
                    title="销售达成率"
                    value={detailModal.data.target_achievement_rate}
                    suffix="%"
                    precision={2}
                    valueStyle={{
                      color:
                        detailModal.data.target_achievement_rate >= 100
                          ? '#389e0d'
                          : '#cf1322',
                    }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" style={{ marginBottom: 12 }}>
                  <Statistic
                    title="实际/目标销售额"
                    value={detailModal.data.actual_sales}
                    suffix={`/ ${detailModal.data.target_sales} 元`}
                  />
                </Card>
              </Col>
            </Row>
            <div className="section-title" style={{ marginTop: 8 }}>
              漏斗各阶段转化率
            </div>
            <ReactECharts
              option={{
                tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
                xAxis: { type: 'category', data: detailModal.data.stages.map((s) => s.stage) },
                yAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
                series: [
                  {
                    name: '转化率',
                    type: 'bar',
                    data: detailModal.data.stages.map((s) => ({
                      value: s.rate,
                      itemStyle: {
                        color:
                          s.rate >= 80 ? '#52c41a' : s.rate >= 60 ? '#faad14' : '#ff4d4f',
                      },
                    })),
                    label: { show: true, position: 'top', formatter: '{c}%' },
                  },
                ],
              }}
              style={{ height: 280 }}
            />
          </div>
        )}
      </Modal>
    </div>
  )
}
