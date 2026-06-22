import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Tag,
  Modal,
  Input,
  message,
  Card,
  Statistic,
  Row,
  Col,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { SyncOutlined, CheckOutlined, WarningOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { reconciliationApi } from '../../api/reconciliation'
import { useQuoteStore } from '../../store/useQuoteStore'
import { ReconciliationRecord, ReconciliationStatus } from '../../types'

interface ReconciliationPanelProps {
  quoteId?: string
  readOnly?: boolean
}

const statusLabels: Record<ReconciliationStatus, string> = {
  [ReconciliationStatus.Pending]: '待对账',
  [ReconciliationStatus.Matched]: '金额匹配',
  [ReconciliationStatus.Mismatched]: '金额不符',
  [ReconciliationStatus.Resolved]: '已处理',
}

const statusColors: Record<ReconciliationStatus, string> = {
  [ReconciliationStatus.Pending]: 'gold',
  [ReconciliationStatus.Matched]: 'green',
  [ReconciliationStatus.Mismatched]: 'red',
  [ReconciliationStatus.Resolved]: 'blue',
}

function ReconciliationPanel({ quoteId, readOnly = false }: ReconciliationPanelProps) {
  const currentQuote = useQuoteStore((s) => s.currentQuote)
  const storeReconciliations = useQuoteStore((s) => s.reconciliations)
  const setReconciliations = useQuoteStore((s) => s.setReconciliations)
  const addReconciliation = useQuoteStore((s) => s.addReconciliation)
  const updateReconciliation = useQuoteStore((s) => s.updateReconciliation)

  const [loading, setLoading] = useState(false)
  const [resolveModalOpen, setResolveModalOpen] = useState(false)
  const [resolveRecord, setResolveRecord] = useState<ReconciliationRecord | null>(null)
  const [resolveRemark, setResolveRemark] = useState('')

  const effectiveQuoteId = quoteId || currentQuote?.id
  const data = storeReconciliations

  const loadData = async () => {
    if (!effectiveQuoteId) return
    setLoading(true)
    try {
      const result = await reconciliationApi.getByQuoteId(effectiveQuoteId)
      setReconciliations(result)
    } catch {
      message.error('加载对账记录失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (effectiveQuoteId) {
      loadData()
    }
  }, [effectiveQuoteId])

  const handleCreate = async () => {
    if (!effectiveQuoteId) return
    try {
      const result = await reconciliationApi.create(effectiveQuoteId)
      message.success('对账完成')
      addReconciliation(result)
    } catch {
      message.error('对账失败')
    }
  }

  const handleResolve = async () => {
    if (!resolveRecord) return
    try {
      const result = await reconciliationApi.resolve(resolveRecord.id, resolveRemark)
      message.success('处理成功')
      updateReconciliation(result)
      setResolveModalOpen(false)
      setResolveRecord(null)
      setResolveRemark('')
    } catch {
      message.error('处理失败')
    }
  }

  const matchedCount = data.filter((r) => r.status === ReconciliationStatus.Matched).length
  const mismatchedCount = data.filter((r) => r.status === ReconciliationStatus.Mismatched).length
  const latestRecord = data.length > 0 ? data[data.length - 1] : null

  const columns: ColumnsType<ReconciliationRecord> = [
    {
      title: '对账日期',
      dataIndex: 'reconciledAt',
      key: 'reconciledAt',
      width: 160,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '应收金额',
      dataIndex: 'expectedAmount',
      key: 'expectedAmount',
      width: 120,
      render: (v: number) => `¥${(v || 0).toLocaleString()}`,
    },
    {
      title: '实收金额',
      dataIndex: 'actualAmount',
      key: 'actualAmount',
      width: 120,
      render: (v: number) => `¥${(v || 0).toLocaleString()}`,
    },
    {
      title: '差异金额',
      dataIndex: 'difference',
      key: 'difference',
      width: 120,
      render: (v: number) => (
        <span style={{ color: v !== 0 ? '#cf1322' : '#3f8600', fontWeight: 500 }}>
          {v > 0 ? '+' : ''}¥{(v || 0).toLocaleString()}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (v: ReconciliationStatus) => (
        <Tag color={statusColors[v]}>{statusLabels[v]}</Tag>
      ),
    },
    {
      title: '操作人',
      dataIndex: 'reconciledBy',
      key: 'reconciledBy',
      width: 100,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      render: (v?: string) => v || '-',
    },
    ...(!readOnly
      ? [
          {
            title: '操作',
            key: 'action',
            width: 120,
            render: (_: any, record: ReconciliationRecord) =>
              record.status === ReconciliationStatus.Mismatched ? (
                <Button
                  type="link"
                  icon={<CheckOutlined />}
                  onClick={() => {
                    setResolveRecord(record)
                    setResolveModalOpen(true)
                  }}
                >
                  解决差异
                </Button>
              ) : null,
          },
        ]
      : []),
  ]

  return (
    <Card title="对账记录">
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Statistic
            title="对账次数"
            value={data.length}
            valueStyle={{ fontSize: 16 }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="匹配次数"
            value={matchedCount}
            valueStyle={{ color: '#3f8600', fontSize: 16 }}
            prefix={<CheckOutlined />}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="差异次数"
            value={mismatchedCount}
            valueStyle={{
              color: mismatchedCount > 0 ? '#cf1322' : '#3f8600',
              fontSize: 16,
            }}
            prefix={<WarningOutlined />}
          />
        </Col>
      </Row>

      {latestRecord && (
        <div
          style={{
            padding: 12,
            background:
              latestRecord.status === ReconciliationStatus.Mismatched
                ? '#fff2f0'
                : '#f6ffed',
            border: `1px solid ${
              latestRecord.status === ReconciliationStatus.Mismatched
                ? '#ffccc7'
                : '#b7eb8f'
            }`,
            borderRadius: 4,
            marginBottom: 16,
          }}
        >
          <span style={{ fontWeight: 500 }}>
            最近对账：{statusLabels[latestRecord.status]}
          </span>
          {latestRecord.status === ReconciliationStatus.Mismatched && (
            <span style={{ color: '#cf1322', marginLeft: 12 }}>
              差异：{latestRecord.difference > 0 ? '+' : ''}¥
              {latestRecord.difference.toLocaleString()}
            </span>
          )}
        </div>
      )}

      {!readOnly && (
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<SyncOutlined />} onClick={handleCreate}>
            执行对账
          </Button>
        </div>
      )}

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={false}
        scroll={{ x: 1000 }}
      />

      <Modal
        title="解决对账差异"
        open={resolveModalOpen}
        onOk={handleResolve}
        onCancel={() => {
          setResolveModalOpen(false)
          setResolveRecord(null)
          setResolveRemark('')
        }}
        okText="确认解决"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16, padding: 12, background: '#fafafa', borderRadius: 4 }}>
          <p style={{ margin: '4px 0' }}>
            <strong>应收：</strong>¥{resolveRecord?.expectedAmount.toLocaleString()}
          </p>
          <p style={{ margin: '4px 0' }}>
            <strong>实收：</strong>¥{resolveRecord?.actualAmount.toLocaleString()}
          </p>
          <p style={{ margin: '4px 0', color: '#cf1322', fontWeight: 500 }}>
            <strong>差额：</strong>
            {resolveRecord && resolveRecord.difference > 0 ? '+' : ''}¥
            {resolveRecord?.difference.toLocaleString()}
          </p>
        </div>
        <Input.TextArea
          rows={4}
          value={resolveRemark}
          onChange={(e) => setResolveRemark(e.target.value)}
          placeholder="请输入差异解决说明"
        />
      </Modal>
    </Card>
  )
}

export default ReconciliationPanel
