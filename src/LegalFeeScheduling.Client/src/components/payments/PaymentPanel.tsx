import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Modal,
  Tag,
  message,
  Card,
  Statistic,
  Row,
  Col,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, DollarOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { paymentApi } from '../../api/payments'
import { useQuoteStore } from '../../store/useQuoteStore'
import { PaymentRecord, PaymentMethod, PaymentStatus, CreatePaymentDto } from '../../types'

const { Option } = Select

interface PaymentPanelProps {
  quoteId?: string
  readOnly?: boolean
}

const methodLabels: Record<PaymentMethod, string> = {
  [PaymentMethod.BankTransfer]: '银行转账',
  [PaymentMethod.Alipay]: '支付宝',
  [PaymentMethod.WeChatPay]: '微信支付',
  [PaymentMethod.Cash]: '现金',
  [PaymentMethod.Check]: '支票',
  [PaymentMethod.Other]: '其他',
}

const statusLabels: Record<PaymentStatus, string> = {
  [PaymentStatus.Unpaid]: '未支付',
  [PaymentStatus.PartialPaid]: '部分支付',
  [PaymentStatus.Paid]: '已支付',
  [PaymentStatus.Overdue]: '逾期',
}

const statusColors: Record<PaymentStatus, string> = {
  [PaymentStatus.Unpaid]: 'gold',
  [PaymentStatus.PartialPaid]: 'blue',
  [PaymentStatus.Paid]: 'green',
  [PaymentStatus.Overdue]: 'red',
}

function PaymentPanel({ quoteId, readOnly = false }: PaymentPanelProps) {
  const currentQuote = useQuoteStore((s) => s.currentQuote)
  const storePayments = useQuoteStore((s) => s.payments)
  const setPayments = useQuoteStore((s) => s.setPayments)
  const addPayment = useQuoteStore((s) => s.addPayment)

  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()

  const effectiveQuoteId = quoteId || currentQuote?.id
  const data = storePayments

  const loadData = async () => {
    if (!effectiveQuoteId) return
    setLoading(true)
    try {
      const result = await paymentApi.getByQuoteId(effectiveQuoteId)
      setPayments(result)
    } catch {
      message.error('加载支付流水失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (effectiveQuoteId) {
      loadData()
    }
  }, [effectiveQuoteId])

  const handleSubmit = async () => {
    if (!effectiveQuoteId) return
    try {
      const values = await form.validateFields()
      const request: CreatePaymentDto = {
        quoteId: effectiveQuoteId,
        amount: values.amount,
        paymentDate: values.paymentDate.format('YYYY-MM-DD'),
        paymentMethod: values.paymentMethod,
        bankTransactionNo: values.bankTransactionNo,
        payer: values.payer,
        remarks: values.remarks,
      }
      const result = await paymentApi.create(request)
      message.success('添加成功')
      addPayment(result)
      setModalOpen(false)
      form.resetFields()
    } catch {
      message.error('添加失败')
    }
  }

  const totalPaid = data.reduce((sum, p) => sum + (p.amount || 0), 0)
  const expectedAmount = currentQuote?.finalAmount || currentQuote?.amount || 0
  const difference = expectedAmount - totalPaid

  const columns: ColumnsType<PaymentRecord> = [
    {
      title: '支付单号',
      dataIndex: 'paymentNo',
      key: 'paymentNo',
      width: 140,
      render: (v?: string) => v || '-',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (v: number) => `¥${(v || 0).toLocaleString()}`,
    },
    {
      title: '支付日期',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      width: 120,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD'),
    },
    {
      title: '支付方式',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 100,
      render: (v: PaymentMethod) => methodLabels[v],
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: PaymentStatus) => (
        <Tag color={statusColors[v]}>{statusLabels[v]}</Tag>
      ),
    },
    {
      title: '银行流水号',
      dataIndex: 'bankTransactionNo',
      key: 'bankTransactionNo',
      width: 160,
      render: (v?: string) => v || '-',
    },
    {
      title: '付款人',
      dataIndex: 'payer',
      key: 'payer',
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
    <Card title="支付流水">
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Statistic
            title="应收金额"
            value={expectedAmount}
            precision={2}
            prefix="¥"
            valueStyle={{ fontSize: 16 }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="已收金额"
            value={totalPaid}
            precision={2}
            prefix={<DollarOutlined style={{ color: '#3f8600' }} />}
            valueStyle={{ color: '#3f8600', fontSize: 16 }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="差额"
            value={difference}
            precision={2}
            prefix="¥"
            valueStyle={{
              color: Math.abs(difference) < 0.01 ? '#3f8600' : '#cf1322',
              fontSize: 16,
            }}
          />
        </Col>
      </Row>

      {!readOnly && (
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            新增支付记录
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
        title="新增支付记录"
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="金额"
                rules={[{ required: true, message: '请输入金额' }]}
              >
                <InputNumber<number>
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="请输入金额"
                  formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => Number(value?.replace(/[^\d.]/g, '')) || 0}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="paymentDate"
                label="支付日期"
                rules={[{ required: true, message: '请选择支付日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="paymentMethod"
                label="支付方式"
                rules={[{ required: true, message: '请选择支付方式' }]}
              >
                <Select placeholder="请选择支付方式">
                  {Object.entries(methodLabels).map(([value, label]) => (
                    <Option key={value} value={value}>
                      {label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="payer" label="付款人">
                <Input placeholder="请输入付款人" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="bankTransactionNo" label="银行流水号">
                <Input placeholder="请输入银行流水号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="remarks" label="备注">
                <Input placeholder="请输入备注" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Card>
  )
}

export default PaymentPanel
