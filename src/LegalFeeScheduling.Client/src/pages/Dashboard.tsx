import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Table, Tag, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  FileTextOutlined,
  DollarOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import { statisticsApi } from '../api/statistics'
import { paymentApi } from '../api/payments'
import { reconciliationApi } from '../api/reconciliation'
import {
  DashboardSummaryDto,
  PaymentRecord,
  ReconciliationRecord,
  AmountCheckResult,
  PaymentStatus,
  PaymentMethod,
  ReconciliationStatus,
} from '../types'
import dayjs from 'dayjs'

const paymentMethodLabels: Record<PaymentMethod, string> = {
  [PaymentMethod.BankTransfer]: '银行转账',
  [PaymentMethod.Alipay]: '支付宝',
  [PaymentMethod.WeChatPay]: '微信支付',
  [PaymentMethod.Cash]: '现金',
  [PaymentMethod.Check]: '支票',
  [PaymentMethod.Other]: '其他',
}

const paymentStatusLabels: Record<PaymentStatus, string> = {
  [PaymentStatus.Pending]: '待付款',
  [PaymentStatus.Partial]: '部分付款',
  [PaymentStatus.Paid]: '已付清',
  [PaymentStatus.Overdue]: '逾期',
  [PaymentStatus.Cancelled]: '已取消',
}

const paymentStatusColors: Record<PaymentStatus, string> = {
  [PaymentStatus.Pending]: 'gold',
  [PaymentStatus.Partial]: 'blue',
  [PaymentStatus.Paid]: 'green',
  [PaymentStatus.Overdue]: 'red',
  [PaymentStatus.Cancelled]: 'default',
}

const reconciliationStatusLabels: Record<ReconciliationStatus, string> = {
  [ReconciliationStatus.Pending]: '待对账',
  [ReconciliationStatus.Matched]: '金额匹配',
  [ReconciliationStatus.Mismatched]: '金额不符',
  [ReconciliationStatus.Resolved]: '已处理',
}

const reconciliationStatusColors: Record<ReconciliationStatus, string> = {
  [ReconciliationStatus.Pending]: 'gold',
  [ReconciliationStatus.Matched]: 'green',
  [ReconciliationStatus.Mismatched]: 'red',
  [ReconciliationStatus.Resolved]: 'blue',
}

function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummaryDto | null>(null)
  const [unbalanced, setUnbalanced] = useState<AmountCheckResult[]>([])
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [reconciliations, setReconciliations] = useState<ReconciliationRecord[]>([])
  const [loading, setLoading] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [summaryData, unbalancedData, paymentsData, reconData] = await Promise.all([
        statisticsApi.getDashboard(),
        statisticsApi.getUnbalancedQuotes(),
        paymentApi.getByQuoteId(''),
        reconciliationApi.getByQuoteId(''),
      ])
      setSummary(summaryData)
      setUnbalanced(unbalancedData)
      setPayments(paymentsData.slice(0, 10))
      setReconciliations(reconData.slice(0, 10))
    } catch {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const unbalancedColumns: ColumnsType<AmountCheckResult> = [
    { title: '报价单号', dataIndex: 'quoteId', key: 'quoteId' },
    {
      title: '校验类型',
      dataIndex: 'checkType',
      key: 'checkType',
    },
    {
      title: '预期金额',
      dataIndex: 'expectedAmount',
      key: 'expectedAmount',
      render: (v: number) => `¥${v.toLocaleString()}`,
    },
    {
      title: '实际金额',
      dataIndex: 'actualAmount',
      key: 'actualAmount',
      render: (v: number) => `¥${v.toLocaleString()}`,
    },
    {
      title: '差额',
      dataIndex: 'difference',
      key: 'difference',
      render: (v: number) => (
        <span style={{ color: 'red' }}>
          {v > 0 ? '+' : ''}¥{v.toLocaleString()}
        </span>
      ),
    },
  ]

  const paymentColumns: ColumnsType<PaymentRecord> = [
    { title: '支付单号', dataIndex: 'paymentNo', key: 'paymentNo' },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (v: number) => `¥${v.toLocaleString()}`,
    },
    {
      title: '支付日期',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      render: (v: string) => dayjs(v).format('YYYY-MM-DD'),
    },
    {
      title: '支付方式',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (v: PaymentMethod) => paymentMethodLabels[v],
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: PaymentStatus) => (
        <Tag color={paymentStatusColors[v]}>{paymentStatusLabels[v]}</Tag>
      ),
    },
  ]

  const reconciliationColumns: ColumnsType<ReconciliationRecord> = [
    {
      title: '对账日期',
      dataIndex: 'reconcileDate',
      key: 'reconcileDate',
      render: (v: string) => dayjs(v).format('YYYY-MM-DD'),
    },
    {
      title: '应收',
      dataIndex: 'expectedAmount',
      key: 'expectedAmount',
      render: (v: number) => `¥${v.toLocaleString()}`,
    },
    {
      title: '实收',
      dataIndex: 'actualAmount',
      key: 'actualAmount',
      render: (v: number) => `¥${v.toLocaleString()}`,
    },
    {
      title: '差额',
      dataIndex: 'difference',
      key: 'difference',
      render: (v: number) => (
        <span style={{ color: v !== 0 ? 'red' : 'green' }}>
          {v > 0 ? '+' : ''}¥{v.toLocaleString()}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: ReconciliationStatus) => (
        <Tag color={reconciliationStatusColors[v]}>
          {reconciliationStatusLabels[v]}
        </Tag>
      ),
    },
  ]

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="待处理报价单"
              value={summary?.pendingCount || 0}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="异常报价单"
              value={summary?.exceptionCount || 0}
              prefix={<WarningOutlined style={{ color: '#cf1322' }} />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="本月收款金额"
              value={summary?.monthlyCollectedAmount || 0}
              precision={2}
              prefix={<DollarOutlined style={{ color: '#3f8600' }} />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="对账差异数"
              value={summary?.reconciliationDifferenceCount || 0}
              prefix={<WarningOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="报价单总数"
              value={summary?.totalQuoteCount || 0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已完成报价单"
              value={summary?.completedQuoteCount || 0}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="报价总金额"
              value={summary?.totalAmount || 0}
              precision={2}
              prefix="¥"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="逾期单数"
              value={summary?.overdueCount || 0}
              prefix={<WarningOutlined style={{ color: '#cf1322' }} />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24} style={{ marginBottom: 16 }}>
          <Card
            title={
              <span>
                <WarningOutlined style={{ color: '#faad14', marginRight: 8 }} />
                金额异常报价单
              </span>
            }
          >
            <Table
              rowKey="id"
              columns={unbalancedColumns}
              dataSource={unbalanced}
              loading={loading}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="最近支付流水">
            <Table
              rowKey="id"
              columns={paymentColumns}
              dataSource={payments}
              loading={loading}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="最近对账记录">
            <Table
              rowKey="id"
              columns={reconciliationColumns}
              dataSource={reconciliations}
              loading={loading}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
