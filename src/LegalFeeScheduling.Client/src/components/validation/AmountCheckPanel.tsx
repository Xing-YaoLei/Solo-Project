import { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Tag,
  message,
  Button,
  Space,
  Statistic,
  Row,
  Col,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  ReloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { quoteApi } from '../../api/quotes'
import { useQuoteStore } from '../../store/useQuoteStore'
import {
  AmountCheckResult,
  AmountCheckType,
} from '../../types'
import dayjs from 'dayjs'

interface AmountCheckPanelProps {
  quoteId?: string
  readOnly?: boolean
}

const checkTypeLabels: Record<AmountCheckType, string> = {
  [AmountCheckType.QuoteItemsVsQuoteAmount]: '报价明细 vs 报价单金额',
  [AmountCheckType.PaymentsVsReconciliation]: '支付合计 vs 对账金额',
  [AmountCheckType.Other]: '其他校验',
}

function AmountCheckPanel({ quoteId, readOnly = false }: AmountCheckPanelProps) {
  const currentQuote = useQuoteStore((s) => s.currentQuote)
  const storeAmountChecks = useQuoteStore((s) => s.amountChecks)
  const setAmountChecks = useQuoteStore((s) => s.setAmountChecks)

  const [loading, setLoading] = useState(false)
  const effectiveQuoteId = quoteId || currentQuote?.id

  const loadData = async () => {
    if (!effectiveQuoteId) return
    setLoading(true)
    try {
      const results = await quoteApi.validateAmounts(effectiveQuoteId)
      setAmountChecks(results)
    } catch {
      message.error('加载金额校验结果失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (effectiveQuoteId) {
      loadData()
    }
  }, [effectiveQuoteId])

  const data = storeAmountChecks

  const matchedCount = data.filter((c) => c.isMatch).length
  const mismatchedCount = data.filter((c) => !c.isMatch).length
  const allMatched = data.length > 0 && mismatchedCount === 0

  const columns: ColumnsType<AmountCheckResult> = [
    {
      title: '校验类型',
      dataIndex: 'checkType',
      key: 'checkType',
      width: 200,
      render: (v: AmountCheckType) => checkTypeLabels[v],
    },
    {
      title: '预期金额',
      dataIndex: 'expectedAmount',
      key: 'expectedAmount',
      width: 140,
      render: (v: number) => `¥${(v || 0).toLocaleString()}`,
    },
    {
      title: '实际金额',
      dataIndex: 'actualAmount',
      key: 'actualAmount',
      width: 140,
      render: (v: number) => `¥${(v || 0).toLocaleString()}`,
    },
    {
      title: '差额',
      dataIndex: 'difference',
      key: 'difference',
      width: 140,
      render: (v: number) => (
        <span style={{ color: v !== 0 ? '#cf1322' : '#3f8600', fontWeight: 500 }}>
          {v > 0 ? '+' : ''}¥{(v || 0).toLocaleString()}
        </span>
      ),
    },
    {
      title: '是否匹配',
      dataIndex: 'isMatch',
      key: 'isMatch',
      width: 100,
      render: (v: boolean) => (
        <Tag color={v ? 'green' : 'red'}>
          {v ? (
            <>
              <CheckCircleOutlined style={{ marginRight: 4 }} />
              匹配
            </>
          ) : (
            <>
              <ExclamationCircleOutlined style={{ marginRight: 4 }} />
              不匹配
            </>
          )}
        </Tag>
      ),
    },
    {
      title: '校验时间',
      dataIndex: 'checkedAt',
      key: 'checkedAt',
      width: 160,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '校验人',
      dataIndex: 'checkedBy',
      key: 'checkedBy',
      width: 100,
      render: (v?: string) => v || '-',
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      render: (v?: string) => v || '-',
    },
  ]

  return (
    <Card title="金额校验">
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Statistic
            title="校验项数"
            value={data.length}
            valueStyle={{ fontSize: 16 }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="匹配项数"
            value={matchedCount}
            valueStyle={{ color: '#3f8600', fontSize: 16 }}
            prefix={<CheckCircleOutlined />}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="异常项数"
            value={mismatchedCount}
            valueStyle={{
              color: mismatchedCount > 0 ? '#cf1322' : '#3f8600',
              fontSize: 16,
            }}
            prefix={<ExclamationCircleOutlined />}
          />
        </Col>
      </Row>

      {data.length > 0 && (
        <div
          style={{
            padding: 12,
            background: allMatched ? '#f6ffed' : '#fff2f0',
            border: `1px solid ${allMatched ? '#b7eb8f' : '#ffccc7'}`,
            borderRadius: 4,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>
            {allMatched ? (
              <>
                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                所有金额校验通过
              </>
            ) : (
              <>
                <ExclamationCircleOutlined style={{ color: '#cf1322', marginRight: 8 }} />
                存在 {mismatchedCount} 项金额异常，请检查
              </>
            )}
          </span>
        </div>
      )}

      {!readOnly && (
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={loadData}
              loading={loading}
            >
              重新校验
            </Button>
          </Space>
        </div>
      )}

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={false}
        scroll={{ x: 1100 }}
      />
    </Card>
  )
}

export default AmountCheckPanel
