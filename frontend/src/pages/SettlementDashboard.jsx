import React, { useState, useEffect } from 'react'
import { Layout, Tabs, Card, Row, Col, DatePicker, Select, Spin, Alert } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

import DashboardSummary from '../components/DashboardSummary'
import SettlementTrendChart from '../components/SettlementTrendChart'
import OrderDetailTable from '../components/OrderDetailTable'
import ApprovalTimeline from '../components/ApprovalTimeline'
import AmountCheckTable from '../components/AmountCheckTable'
import CaliberDiffTable from '../components/CaliberDiffTable'
import DownloadPanel from '../components/DownloadPanel'

import { settlementApi } from '../utils/api'

const { Header, Content } = Layout
const { RangePicker } = DatePicker
const { Option } = Select

const SettlementDashboard = () => {
  const [loading, setLoading] = useState(false)
  const [summaryData, setSummaryData] = useState(null)
  const [trendData, setTrendData] = useState(null)
  const [orders, setOrders] = useState(null)
  const [approvalNodes, setApprovalNodes] = useState([])
  const [amountChecks, setAmountChecks] = useState([])
  const [caliberDiffs, setCaliberDiffs] = useState(null)
  const [selectedMerchant, setSelectedMerchant] = useState(1)
  const [dateRange, setDateRange] = useState([dayjs().subtract(30, 'day'), dayjs()])
  const [orderPagination, setOrderPagination] = useState({ current: 1, pageSize: 20 })
  const [diffPagination, setDiffPagination] = useState({ current: 1, pageSize: 20 })
  const [activeTab, setActiveTab] = useState('orders')
  const [refreshTime, setRefreshTime] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [summary, trend, ordersData, checks, diffs] = await Promise.all([
        settlementApi.getDashboardSummary(),
        settlementApi.getTrend({
          merchant_id: selectedMerchant,
          start_date: dateRange[0]?.format('YYYY-MM-DD'),
          end_date: dateRange[1]?.format('YYYY-MM-DD'),
        }),
        settlementApi.getOrders({
          merchant_id: selectedMerchant,
          page: orderPagination.current,
          page_size: orderPagination.pageSize,
        }),
        settlementApi.getAmountChecks(1),
        settlementApi.getCaliberDiffs({
          page: diffPagination.current,
          page_size: diffPagination.pageSize,
        }),
      ])

      setSummaryData(summary)
      setTrendData(trend)
      setOrders(ordersData)
      setAmountChecks(checks)
      setCaliberDiffs(diffs)
      setRefreshTime(new Date())
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchApprovalNodes = async (settlementId) => {
    try {
      const nodes = await settlementApi.getApprovalNodes(settlementId)
      setApprovalNodes(nodes)
    } catch (error) {
      console.error('Failed to fetch approval nodes:', error)
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedMerchant, dateRange])

  useEffect(() => {
    fetchApprovalNodes(1)
  }, [])

  const handleOrderPageChange = async (pagination) => {
    const newPagination = { current: pagination.current, pageSize: pagination.pageSize }
    setOrderPagination(newPagination)
    try {
      const ordersData = await settlementApi.getOrders({
        merchant_id: selectedMerchant,
        page: newPagination.current,
        page_size: newPagination.pageSize,
      })
      setOrders(ordersData)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    }
  }

  const handleDiffPageChange = async (pagination) => {
    const newPagination = { current: pagination.current, pageSize: pagination.pageSize }
    setDiffPagination(newPagination)
    try {
      const diffs = await settlementApi.getCaliberDiffs({
        page: newPagination.current,
        page_size: newPagination.pageSize,
      })
      setCaliberDiffs(diffs)
    } catch (error) {
      console.error('Failed to fetch diffs:', error)
    }
  }

  const handleRefresh = () => {
    fetchData()
  }

  const handleTabChange = (key) => {
    setActiveTab(key)
  }

  const tabItems = [
    {
      key: 'orders',
      label: '单据明细',
      children: (
        <OrderDetailTable
          data={orders}
          loading={loading}
          pagination={orderPagination}
          onChange={handleOrderPageChange}
        />
      ),
    },
    {
      key: 'approvals',
      label: '审批节点',
      children: <ApprovalTimeline nodes={approvalNodes} />,
    },
    {
      key: 'amount_check',
      label: '金额校验',
      children: <AmountCheckTable data={amountChecks} loading={loading} />,
    },
    {
      key: 'caliber_diff',
      label: '口径差异表',
      children: (
        <CaliberDiffTable
          data={caliberDiffs}
          loading={loading}
          pagination={diffPagination}
          onChange={handleDiffPageChange}
        />
      ),
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header
        style={{
          background: '#fff',
          padding: '0 24px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h1 style={{ fontSize: 20, margin: 0, fontWeight: 600 }}>商户结算趋势看板</h1>
          <span style={{ color: '#6b7280', fontSize: 13 }}>本地跑腿商户版</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>
            {refreshTime && `最后刷新: ${dayjs(refreshTime).format('HH:mm:ss')}`}
          </span>
          <DownloadPanel merchantId={selectedMerchant} />
        </div>
      </Header>

      <Content style={{ padding: 24 }}>
        <Card style={{ marginBottom: 24 }}>
          <Row gutter={16} align="middle">
            <Col>
              <span style={{ marginRight: 8 }}>商户:</span>
              <Select
                value={selectedMerchant}
                onChange={setSelectedMerchant}
                style={{ width: 200 }}
                size="middle"
              >
                <Option value={1}>快跑腿便利超市</Option>
                <Option value={2}>美食速递餐饮</Option>
                <Option value={3}>鲜果优选水果店</Option>
              </Select>
            </Col>
            <Col>
              <span style={{ marginRight: 8 }}>时间范围:</span>
              <RangePicker
                value={dateRange}
                onChange={(dates) => setDateRange(dates)}
                size="middle"
              />
            </Col>
            <Col flex="auto" style={{ textAlign: 'right' }}>
              <a onClick={handleRefresh} style={{ display: 'inline-flex', alignItems: 'center' }}>
                <ReloadOutlined style={{ marginRight: 4 }} />
                刷新数据
              </a>
            </Col>
          </Row>
        </Card>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            <DashboardSummary summary={summaryData} />

            <Alert
              message="数据异常说明"
              description={
                <div>
                  <div>
                    <strong style={{ color: '#d97706' }}>订单系统延迟:</strong>{' '}
                    订单系统同步延迟超过24小时的，相关订单顺延至下一结算周期
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <strong style={{ color: '#dc2626' }}>客服记录缺失:</strong>{' '}
                    客服退款/补录记录缺失时，暂按支付流水计算，待补录后进行差额调整
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <strong style={{ color: '#2563eb' }}>支付流水口径变化:</strong>{' '}
                    口径变更过渡期内，保留完整差异表，不直接覆盖原有数据
                  </div>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <SettlementTrendChart
              trendData={trendData?.trend_data}
              affectedRanges={trendData?.affected_ranges}
              anomalySummary={trendData?.anomaly_summary}
            />

            <Card className="tab-section" style={{ marginBottom: 24 }}>
              <Tabs items={tabItems} activeKey={activeTab} onChange={handleTabChange} />
            </Card>

            <Card title="复盘说明" size="small">
              <div style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.8 }}>
                <p>
                  <strong>1. 关于异常点：</strong>
                  看板中所有异常点均保留原始数据痕迹，复盘说明与异常点一一对应，不做分离处理。
                  点击异常点可查看详细说明和处理进展。
                </p>
                <p>
                  <strong>2. 关于金额不一致：</strong>
                  当金额不一致导致趋势发生变化时，系统自动标注受影响区间，区间内的数据采用不同底色高亮显示，
                  便于快速定位问题范围和影响金额。
                </p>
                <p>
                  <strong>3. 关于口径差异：</strong>
                  客服记录与支付流水口径冲突时，系统保留完整差异表，双方数据均不覆盖，由人工确认后再做调整。
                  差异处理状态实时同步更新。
                </p>
                <p>
                  <strong>4. 关于回款周期：</strong>
                  所有下载结果均附带完整的回款周期计算规则说明，确保结算依据清晰可追溯。
                  计算规则的任何变更都会在看板公告栏进行公示。
                </p>
              </div>
            </Card>
          </>
        )}
      </Content>
    </Layout>
  )
}

export default SettlementDashboard
