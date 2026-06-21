import { useNavigate, useParams } from '@tanstack/react-router'
import {
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Button,
  Card,
  Row,
  Col,
  Table,
  Space,
  Divider,
  message,
  Upload,
  Tag,
  Modal,
} from 'antd'
import { PlusOutlined, UploadOutlined, DeleteOutlined, InboxOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import type { InvoiceItem as InvoiceItemType, QuoteDetail, Attachment } from '../types'
import { quotesApi, invoicesApi, attachmentsApi } from '../api'
import {
  feeTypeOptions,
  formatCurrency,
  formatFileSize,
  getFeeTypeLabel,
  attachmentCategoryOptions,
  getAttachmentCategoryLabel,
  formatDateTime,
} from '../utils/format'
import dayjs from 'dayjs'

interface QuoteDetailPageProps {
  id?: string
}

interface InvoiceItemFormData {
  key: string
  item_name: string
  fee_type: string
  description?: string
  quantity: number
  unit_price: number
  discount_rate: number
  amount: number
  actual_amount: number
}

function QuoteDetailPage({ id: propId }: QuoteDetailPageProps) {
  const navigate = useNavigate()
  const routeParams = useParams({ strict: false }) as { id?: string }
  const id = propId || routeParams.id
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [quote, setQuote] = useState<QuoteDetail | null>(null)
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItemFormData[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [attachmentsLoading, setAttachmentsLoading] = useState(false)
  const [uploadVisible, setUploadVisible] = useState(false)
  const [uploadForm] = Form.useForm()
  const [fileList, setFileList] = useState<any[]>([])

  const isNew = !id || id === 'new'

  useEffect(() => {
    if (!isNew && id) {
      loadQuote()
      loadAttachments()
    } else {
      setInvoiceItems([
        {
          key: '0',
          item_name: '',
          fee_type: 'other',
          quantity: 1,
          unit_price: 0,
          discount_rate: 100,
          amount: 0,
          actual_amount: 0,
        },
      ])
    }
  }, [id])

  const loadQuote = async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await quotesApi.get(id)
      setQuote(data)
      form.setFieldsValue({
        ...data,
        expected_payment_date: data.expected_payment_date ? dayjs(data.expected_payment_date) : null,
        payment_deadline: data.payment_deadline ? dayjs(data.payment_deadline) : null,
      })
      setInvoiceItems(
        data.invoice_items.map((item: InvoiceItemType, idx: number) => ({
          key: String(idx),
          ...item,
        }))
      )
    } finally {
      setLoading(false)
    }
  }

  const loadAttachments = async () => {
    if (!id) return
    setAttachmentsLoading(true)
    try {
      const res = await attachmentsApi.list({ quote_id: id, page_size: 100 })
      setAttachments(res.items)
    } finally {
      setAttachmentsLoading(false)
    }
  }

  const calculateTotals = (items: InvoiceItemFormData[]) => {
    let total = 0
    let discounted = 0
    items.forEach((item) => {
      total += (item.quantity || 0) * (item.unit_price || 0)
      discounted += item.actual_amount || 0
    })
    form.setFieldsValue({
      total_amount: parseFloat(total.toFixed(2)),
      discounted_amount: parseFloat(discounted.toFixed(2)),
    })
  }

  const updateItem = (key: string, field: string, value: any) => {
    const newItems = invoiceItems.map((item) => {
      if (item.key === key) {
        const updated = { ...item, [field]: value }
        const baseAmount = (updated.quantity || 0) * (updated.unit_price || 0)
        updated.amount = parseFloat(baseAmount.toFixed(2))
        updated.actual_amount = parseFloat(
          ((baseAmount * (updated.discount_rate || 100)) / 100).toFixed(2)
        )
        return updated
      }
      return item
    })
    setInvoiceItems(newItems)
    calculateTotals(newItems)
  }

  const addItem = () => {
    const key = String(Date.now())
    setInvoiceItems([
      ...invoiceItems,
      {
        key,
        item_name: '',
        fee_type: 'other',
        quantity: 1,
        unit_price: 0,
        discount_rate: 100,
        amount: 0,
        actual_amount: 0,
      },
    ])
  }

  const removeItem = (key: string) => {
    const newItems = invoiceItems.filter((item) => item.key !== key)
    setInvoiceItems(newItems)
    calculateTotals(newItems)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSaving(true)

      if (invoiceItems.length === 0) {
        message.error('请至少添加一条费用明细')
        return
      }

      const validItems = invoiceItems.filter((item) => item.item_name.trim())
      if (validItems.length === 0) {
        message.error('请填写费用明细名称')
        return
      }

      const payload = {
        ...values,
        expected_payment_date: values.expected_payment_date
          ? values.expected_payment_date.format('YYYY-MM-DD')
          : null,
        payment_deadline: values.payment_deadline
          ? values.payment_deadline.format('YYYY-MM-DD')
          : null,
        invoice_items: validItems.map(({ key, ...rest }) => rest),
      }

      if (isNew) {
        const created = await quotesApi.create(payload)
        message.success('报价单创建成功')
        navigate({ to: '/quotes/$id', params: { id: created.id } })
      } else if (id) {
        await quotesApi.update(id, payload)
        message.success('保存成功')
        loadQuote()
      }
    } catch (error: any) {
      message.error(error?.response?.data?.detail || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleUpload = async () => {
    if (!id) return
    try {
      const values = await uploadForm.validateFields()
      if (fileList.length === 0) {
        message.error('请选择文件')
        return
      }

      const formData = new FormData()
      formData.append('quote_id', id)
      formData.append('category', values.category)
      if (values.description) formData.append('description', values.description)
      fileList.forEach((f) => formData.append('files', f.originFileObj))

      await attachmentsApi.batchUpload(formData)
      message.success('上传成功')
      setUploadVisible(false)
      uploadForm.resetFields()
      setFileList([])
      loadAttachments()
    } catch (error: any) {
      message.error(error?.response?.data?.detail || '上传失败')
    }
  }

  const invoiceColumns = [
    {
      title: '项目名称',
      dataIndex: 'item_name',
      width: 200,
      render: (_: any, record: InvoiceItemFormData) => (
        <Input
          value={record.item_name}
          placeholder="请输入"
          onChange={(e) => updateItem(record.key, 'item_name', e.target.value)}
        />
      ),
    },
    {
      title: '费用类型',
      dataIndex: 'fee_type',
      width: 140,
      render: (_: any, record: InvoiceItemFormData) => (
        <Select
          value={record.fee_type}
          options={feeTypeOptions}
          onChange={(v) => updateItem(record.key, 'fee_type', v)}
        />
      ),
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      width: 100,
      render: (_: any, record: InvoiceItemFormData) => (
        <InputNumber
          value={record.quantity}
          min={0}
          step={1}
          style={{ width: '100%' }}
          onChange={(v) => updateItem(record.key, 'quantity', v || 0)}
        />
      ),
    },
    {
      title: '单价',
      dataIndex: 'unit_price',
      width: 140,
      render: (_: any, record: InvoiceItemFormData) => (
        <InputNumber
          value={record.unit_price}
          min={0}
          precision={2}
          style={{ width: '100%' }}
          onChange={(v) => updateItem(record.key, 'unit_price', v || 0)}
        />
      ),
    },
    {
      title: '折扣(%)',
      dataIndex: 'discount_rate',
      width: 100,
      render: (_: any, record: InvoiceItemFormData) => (
        <InputNumber
          value={record.discount_rate}
          min={0}
          max={100}
          precision={2}
          style={{ width: '100%' }}
          onChange={(v) => updateItem(record.key, 'discount_rate', v || 0)}
        />
      ),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 120,
      render: (v: number) => formatCurrency(v),
    },
    {
      title: '折后金额',
      dataIndex: 'actual_amount',
      width: 120,
      render: (v: number) => <strong style={{ color: '#1677ff' }}>{formatCurrency(v)}</strong>,
    },
    {
      title: '操作',
      key: 'action',
      width: 60,
      render: (_: any, record: InvoiceItemFormData) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeItem(record.key)}
        />
      ),
    },
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">{isNew ? '新建报价单' : `报价单详情 - ${quote?.quote_no || ''}`}</h2>
        <Space>
          <Button onClick={() => navigate({ to: '/quotes' })}>返回</Button>
          <Button type="primary" loading={saving} onClick={handleSubmit}>
            保存
          </Button>
        </Space>
      </div>

      <div className="detail-section">
        <div className="detail-section-title">基本信息</div>
        <Form form={form} layout="vertical">
          <Row gutter={24}>
            <Col xs={24} md={12} lg={8}>
              <Form.Item
                label="报价标题"
                name="title"
                rules={[{ required: true, message: '请输入标题' }]}
              >
                <Input placeholder="请输入报价标题" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} lg={8}>
              <Form.Item
                label="客户名称"
                name="client_name"
                rules={[{ required: true, message: '请输入客户名称' }]}
              >
                <Input placeholder="请输入客户名称" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} lg={8}>
              <Form.Item label="联系人" name="client_contact">
                <Input placeholder="请输入联系人" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} lg={8}>
              <Form.Item label="联系电话" name="client_phone">
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} lg={8}>
              <Form.Item label="案件类型" name="case_type">
                <Input placeholder="如：民事诉讼、法律顾问等" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} lg={8}>
              <Form.Item label="优先级" name="priority">
                <Select
                  options={[
                    { value: 'low', label: '低' },
                    { value: 'normal', label: '普通' },
                    { value: 'high', label: '高' },
                    { value: 'urgent', label: '紧急' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} lg={8}>
              <Form.Item label="币种" name="currency">
                <Select
                  options={[
                    { value: 'CNY', label: '人民币 CNY' },
                    { value: 'USD', label: '美元 USD' },
                    { value: 'EUR', label: '欧元 EUR' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} lg={8}>
              <Form.Item label="预期付款日期" name="expected_payment_date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} lg={8}>
              <Form.Item label="付款截止日期" name="payment_deadline">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item label="案件描述" name="case_description">
                <Input.TextArea rows={3} placeholder="案件背景和需求描述" />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>费用明细</h3>
            <Button type="dashed" icon={<PlusOutlined />} onClick={addItem}>
              添加明细
            </Button>
          </div>

          <Table
            rowKey="key"
            dataSource={invoiceItems}
            columns={invoiceColumns}
            pagination={false}
            bordered
            scroll={{ x: 1000 }}
            summary={() => {
              const totals = invoiceItems.reduce(
                (acc, item) => ({
                  amount: acc.amount + (item.amount || 0),
                  actual: acc.actual + (item.actual_amount || 0),
                }),
                { amount: 0, actual: 0 }
              )
              return (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={5}>
                      <strong>合计</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={5}>
                      <strong>{formatCurrency(totals.amount)}</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={6}>
                      <strong style={{ color: '#1677ff' }}>{formatCurrency(totals.actual)}</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={7} />
                  </Table.Summary.Row>
                </Table.Summary>
              )
            }}
          />

          <Row gutter={24} style={{ marginTop: 16 }}>
            <Col xs={24} md={12} lg={8}>
              <Form.Item label="原价合计" name="total_amount">
                <InputNumber readOnly style={{ width: '100%' }} precision={2} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} lg={8}>
              <Form.Item label="折后应收" name="discounted_amount">
                <InputNumber readOnly style={{ width: '100%' }} precision={2} />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Form.Item label="备注" name="remarks">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </div>

      {!isNew && (
        <div className="detail-section">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
              paddingBottom: 12,
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            <h3 style={{ margin: 0, fontSize: 16 }}>附件资料</h3>
            <Button type="primary" icon={<UploadOutlined />} onClick={() => setUploadVisible(true)}>
              上传附件
            </Button>
          </div>
          {attachments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#8c8c8c' }}>
              <InboxOutlined style={{ fontSize: 48, marginBottom: 12 }} />
              <div>暂无附件，点击右上角按钮上传</div>
            </div>
          ) : (
            <Row gutter={[16, 16]}>
              {attachments.map((file) => (
                <Col xs={24} md={12} lg={8} key={file.id}>
                  <Card
                    size="small"
                    actions={[
                      <Button
                        key="del"
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={async () => {
                          await attachmentsApi.delete(file.id)
                          message.success('删除成功')
                          loadAttachments()
                        }}
                      >
                        删除
                      </Button>,
                    ]}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Tag color="blue">{getAttachmentCategoryLabel(file.category)}</Tag>
                      <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                        {formatFileSize(file.file_size)}
                      </span>
                    </div>
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 14,
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={file.file_name}
                    >
                      {file.file_name}
                    </div>
                    {file.description && (
                      <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                        {file.description}
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: '#bfbfbf', marginTop: 8 }}>
                      {formatDateTime(file.created_at)}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>
      )}

      <Modal
        title="上传附件"
        open={uploadVisible}
        onOk={handleUpload}
        onCancel={() => {
          setUploadVisible(false)
          uploadForm.resetFields()
          setFileList([])
        }}
        width={500}
      >
        <Form form={uploadForm} layout="vertical">
          <Form.Item
            label="附件类别"
            name="category"
            rules={[{ required: true, message: '请选择类别' }]}
            initialValue="other"
          >
            <Select options={attachmentCategoryOptions} />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label="选择文件" required>
            <Upload
              multiple
              fileList={fileList}
              beforeUpload={() => false}
              onChange={({ fileList: list }) => setFileList(list)}
            >
              <Button icon={<UploadOutlined />}>选择文件（可多选）</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default QuoteDetailPage
