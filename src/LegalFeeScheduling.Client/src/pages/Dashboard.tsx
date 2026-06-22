import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Table, Tag, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  FileTextOutlined,
  DollarOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { statisticsApi } from '../api/statistics'
import { paymentApi } from '../api/payments'
import { reconciliationApi } from '../api/reconciliation'
import {
  StatisticsSummary,
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
}

const paymentStatusLabels: Record<PaymentStatus, string> = {
  [PaymentStatus.Pending]: '待确认',
  [PaymentStatus.Paid]: '已到账',
  [PaymentStatus.Partial]: '部分到账',
  [PaymentStatus.Overdue]: '逾期',
}

const paymentStatusColors: Record<PaymentStatus, string> = {
  [PaymentStatus.Pending]: 'gold',
  [PaymentStatus.Paid]: 'green',
  [PaymentStatus.Partial]: 'blue',
  [PaymentStatus.Overdue]: 'red',
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
  const [summary, setSummary] = useState<StatisticsSummary | null>(null)
  const [unbalanced, setUnbalanced] = useState<AmountCheckResult[]>([])
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [reconciliations, setReconciliations] = useState<ReconciliationRecord[]>([])
  const [loading, setLoading] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [summaryData, unbalancedData, paymentsData, reconData] = await Promise.all([
        statisticsApi.getSummary(),
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
    { title: '报价单号', dataIndex: 'quoteNo', key: 'quoteNo' },
    {
      title: '应收金额',
      dataIndex: 'expectedAmount',
      key: 'expectedAmount',
      render: (v: number) => `¥${v.toLocaleString()}`,
    },
    {
      title: '实收金额',
      dataIndex: 'totalPaid',
      key: 'totalPaid',
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
    { title: '报价单号', dataIndex: 'quoteNo', key: 'quoteNo' },
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
    { title: '报价单号', dataIndex: 'quoteNo', key: 'quoteNo' },
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
              title="报价单总数"
              value={summary?.totalQuotes || 0}
              prefix={<FileTextOutlined />}
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
              title="已收款金额"
              value={summary?.totalPaid || 0}
              precision={2}
              prefix={<DollarOutlined style={{ color: '#3f8600' }} />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待收款金额"
              value={summary?.pendingAmount || 0}
              precision={2}
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
              rowKey="quoteId"
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
