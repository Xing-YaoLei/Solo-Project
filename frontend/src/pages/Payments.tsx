import { useNavigate } from '@tanstack/react-router'
import {
  Table,
  Button,
  Input,
  Select,
  DatePicker,
  Space,
  Tag,
  Modal,
  Form,
  InputNumber,
  Card,
  Drawer,
  Descriptions,
  message,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  CheckOutlined,
  EyeOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { useEffect, useState } from 'react'
import type { Payment } from '../types'
import { paymentsApi, quotesApi } from '../api'
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  paymentStatusOptions,
  paymentMethodOptions,
  getPaymentStatusLabel,
  getPaymentMethodLabel,
} from '../utils/format'
import dayjs from 'dayjs'

interface QuoteOption {
  value: string
  label: string
}

function PaymentsPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<Payment[]>([])
  const [total, setTotal] = useState(0)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20 })
  const [filters, setFilters] = useState({
    status: undefined as string | undefined,
    keyword: '',
    start_date: undefined as string | undefined,
    end_date: undefined as string | undefined,
  })
  const [createVisible, setCreateVisible] = useState(false)
  const [createForm] = Form.useForm()
  const [detailVisible, setDetailVisible] = useState(false)
  const [detailData, setDetailData] = useState<Payment | null>(null)
  const [quoteOptions, setQuoteOptions] = useState<QuoteOption[]>([])
  const [quoteOptionsLoading, setQuoteOptionsLoading] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await paymentsApi.list({
        page: pagination.page,
        page_size: pagination.pageSize,
        status: filters.status,
        keyword: filters.keyword || undefined,
        start_date: filters.start_date,
        end_date: filters.end_date,
      })
      setData(res.items)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }

  const loadQuoteOptions = async () => {
    setQuoteOptionsLoading(true)
    try {
      const res = await quotesApi.list({ page_size: 100 })
      setQuoteOptions(
        res.items.map((q) => ({
          value: q.id,
          label: `${q.quote_no} - ${q.title} (${q.client_name}) - ${formatCurrency(q.discounted_amount)}`,
        }))
      )
    } catch {
      setQuoteOptions([])
    } finally {
      setQuoteOptionsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [pagination, filters])

  useEffect(() => {
    if (createVisible) {
      loadQuoteOptions()
    }
  }, [createVisible])

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields()
      const payload = {
        ...values,
        payment_date: values.payment_date ? values.payment_date.format('YYYY-MM-DD') : null,
      }
      await paymentsApi.create(payload)
      message.success('支付流水创建成功')
      setCreateVisible(false)
      createForm.resetFields()
      loadData()
    } catch (error: any) {
      message.error(error?.response?.data?.detail || '创建失败')
    }
  }

  const handleConfirm = (record: Payment) => {
    Modal.confirm({
      title: '确认到账',
      content: `确认 ${formatCurrency(record.amount)} 已到账吗？`,
      onOk: async () => {
        try {
          await paymentsApi.confirm(record.id)
          message.success('已确认到账')
          loadData()
        } catch (error: any) {
          message.error(error?.response?.data?.detail || '操作失败')
        }
      },
    })
  }

  const columns = [
    {
      title: '流水号',
      dataIndex: 'payment_no',
      width: 160,
    },
    {
      title: '关联报价单',
      dataIndex: 'quote_title',
      width: 180,
      ellipsis: true,
      render: (v: string, record: Payment) => (
        <Button
          type="link"
          icon={<FileTextOutlined />}
          onClick={() => navigate({ to: '/quotes/$id', params: { id: record.quote_id } })}
        >
          {v}
        </Button>
      ),
    },
    { title: '客户', dataIndex: 'client_name', width: 140 },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 140,
      render: (v: number) => <strong>{formatCurrency(v)}</strong>,
    },
    {
      title: '支付方式',
      dataIndex: 'method',
      width: 100,
      render: (v: string) => getPaymentMethodLabel(v),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: string) => {
        const opt = paymentStatusOptions.find((o) => o.value === v)
        return <Tag color={opt?.color as any}>{getPaymentStatusLabel(v)}</Tag>
      },
    },
    {
      title: '付款日期',
      dataIndex: 'payment_date',
      width: 110,
      render: (v: string) => (v ? formatDate(v) : '-'),
    },
    { title: '操作人', dataIndex: 'operator_name', width: 100 },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: unknown, record: Payment) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setDetailData(record)
              setDetailVisible(true)
            }}
          >
            详情
          </Button>
          {record.status === 'pending' && (
            <Button
              type="link"
              size="small"
              icon={<CheckOutlined />}
              style={{ color: '#52c41a' }}
              onClick={() => handleConfirm(record)}
            >
              确认到账
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">支付流水</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateVisible(true)}>
          登记付款
        </Button>
      </div>

      <Card style={{ borderRadius: 8 }}>
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <Input
              allowClear
              placeholder="搜索流水号/付款人/交易号"
              prefix={<SearchOutlined />}
              style={{ width: 240 }}
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            />
            <Select
              allowClear
              placeholder="状态"
              style={{ width: 120 }}
              options={paymentStatusOptions}
              value={filters.status}
              onChange={(v) => setFilters({ ...filters, status: v })}
            />
            <DatePicker.RangePicker
              onChange={(dates) =>
                setFilters({
                  ...filters,
                  start_date: dates?.[0]?.format('YYYY-MM-DD'),
                  end_date: dates?.[1]?.format('YYYY-MM-DD'),
                })
              }
            />
            <Button icon={<ReloadOutlined />} onClick={loadData}>
              刷新
            </Button>
          </div>
        </div>

        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (page, pageSize) => setPagination({ page, pageSize }),
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title="登记付款"
        open={createVisible}
        onOk={handleCreate}
        onCancel={() => {
          setCreateVisible(false)
          createForm.resetFields()
        }}
        width={560}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            label="关联报价单"
            name="quote_id"
            rules={[{ required: true, message: '请选择报价单' }]}
          >
            <Select
              showSearch
              placeholder="搜索报价单"
              optionFilterProp="label"
              loading={quoteOptionsLoading}
              options={quoteOptions}
            />
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              label="金额"
              name="amount"
              rules={[{ required: true, message: '请输入金额' }]}
              style={{ flex: 1 }}
            >
              <InputNumber min={0} precision={2} style={{ width: '100%' }} prefix="¥" />
            </Form.Item>
            <Form.Item label="币种" name="currency" initialValue="CNY" style={{ width: 140 }}>
              <Select
                options={[
                  { value: 'CNY', label: '人民币' },
                  { value: 'USD', label: '美元' },
                  { value: 'EUR', label: '欧元' },
                ]}
              />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              label="支付方式"
              name="method"
              initialValue="bank_transfer"
              rules={[{ required: true, message: '请选择支付方式' }]}
              style={{ flex: 1 }}
            >
              <Select options={paymentMethodOptions} />
            </Form.Item>
            <Form.Item label="付款日期" name="payment_date" style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item label="交易号/流水号" name="transaction_id" style={{ flex: 1 }}>
              <Input placeholder="银行交易号或第三方流水号" />
            </Form.Item>
            <Form.Item label="付款人" name="payer_name" style={{ flex: 1 }}>
              <Input placeholder="实际付款账户名称" />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item label="开户银行" name="bank_name" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item label="银行账号" name="bank_account" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
          </div>
          <Form.Item label="备注" name="remarks">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="支付流水详情"
        width={520}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {detailData && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="流水号">{detailData.payment_no}</Descriptions.Item>
            <Descriptions.Item label="关联报价单">{detailData.quote_title}</Descriptions.Item>
            <Descriptions.Item label="客户名称">{detailData.client_name}</Descriptions.Item>
            <Descriptions.Item label="金额">{formatCurrency(detailData.amount)}</Descriptions.Item>
            <Descriptions.Item label="币种">{detailData.currency}</Descriptions.Item>
            <Descriptions.Item label="支付方式">
              {getPaymentMethodLabel(detailData.method)}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag
                color={
                  paymentStatusOptions.find((o) => o.value === detailData.status)?.color as any
                }
              >
                {getPaymentStatusLabel(detailData.status)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="付款日期">
              {detailData.payment_date ? formatDate(detailData.payment_date) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="交易号">{detailData.transaction_id || '-'}</Descriptions.Item>
            <Descriptions.Item label="付款人">{detailData.payer_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="开户银行">{detailData.bank_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="银行账号">{detailData.bank_account || '-'}</Descriptions.Item>
            <Descriptions.Item label="操作人">{detailData.operator_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="确认时间">
              {detailData.confirmed_at ? formatDateTime(detailData.confirmed_at) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="备注">{detailData.remarks || '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  )
}

export default PaymentsPage
