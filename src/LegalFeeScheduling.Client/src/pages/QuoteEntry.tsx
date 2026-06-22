import { useState, useEffect } from 'react'
import {
  Row,
  Col,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Empty,
  Card,
  InputNumber,
  Table,
  Popconfirm,
} from 'antd'

import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import QuoteList from '../components/quotes/QuoteList'
import QuoteBasicInfo from '../components/quotes/QuoteBasicInfo'
import QuoteItemsPanel from '../components/quotes/QuoteItemsPanel'
import WorkflowActions from '../components/workflow/WorkflowActions'
import { quoteApi } from '../api/quotes'
import { useQuoteStore } from '../store/useQuoteStore'
import {
  Quote,
  QuoteStatus,
  QuoteFilter,
  Channel,
  CreateQuoteDto,
  CreateQuoteItemDto,
} from '../types'
import { channelLabels } from '../components/quotes/QuoteList'

interface TempQuoteItem {
  id: string
  itemName: string
  description?: string
  unitPrice: number
  quantity: number
  subtotal: number
}

function QuoteEntry() {
  const [list, setList] = useState<Quote[]>([])
  const [loading, setLoading] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })
  const [filter, setFilter] = useState<QuoteFilter>({
    status: QuoteStatus.Draft,
    page: 1,
    pageSize: 10,
  })
  const currentQuote = useQuoteStore((s) => s.currentQuote)
  const setCurrentQuote = useQuoteStore((s) => s.setCurrentQuote)
  const [form] = Form.useForm()
  const [quoteItems, setQuoteItems] = useState<TempQuoteItem[]>([])

  const loadData = async () => {
    setLoading(true)
    try {
      const result = await quoteApi.getQuotes(filter)
      setList(result.items)
      setPagination({
        current: result.page,
        pageSize: result.pageSize,
        total: result.totalCount,
      })
    } catch {
      message.error('加载报价单列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [filter])

  const handleSelectQuote = async (quote: Quote) => {
    try {
      const detail = await quoteApi.getQuote(quote.id)
      setCurrentQuote(detail)
    } catch {
      message.error('加载报价单详情失败')
    }
  }

  const handleAddItem = () => {
    const newItem: TempQuoteItem = {
      id: `temp-${Date.now()}`,
      itemName: '',
      unitPrice: 0,
      quantity: 1,
      subtotal: 0,
    }
    setQuoteItems([...quoteItems, newItem])
  }

  const handleDeleteItem = (id: string) => {
    setQuoteItems(quoteItems.filter((item) => item.id !== id))
  }

  const handleUpdateItem = (id: string, field: keyof TempQuoteItem, value: any) => {
    setQuoteItems(
      quoteItems.map((item) => {
        if (item.id !== id) return item
        const updated = { ...item, [field]: value }
        if (field === 'quantity' || field === 'unitPrice') {
          updated.subtotal =
            (Number(updated.quantity) || 0) * (Number(updated.unitPrice) || 0)
        }
        return updated
      })
    )
  }

  const handleCreate = async () => {
    try {
      const values = await form.validateFields()
      const items: CreateQuoteItemDto[] = quoteItems.map((item) => ({
        itemName: item.itemName,
        description: item.description,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
      }))
      const request: CreateQuoteDto = {
        clientName: values.clientName,
        caseName: values.caseName,
        channel: values.channel,
        amount: values.amount || 0,
        discountAmount: values.discountAmount,
        finalAmount: values.finalAmount || values.amount || 0,
        owner: values.owner,
        remarks: values.remarks,
        expectedPaymentDate: values.expectedPaymentDate,
        items,
      }
      const newQuote = await quoteApi.createQuote(request)
      message.success('创建成功')
      setCreateModalOpen(false)
      form.resetFields()
      setQuoteItems([])
      loadData()
      handleSelectQuote(newQuote)
    } catch {
      message.error('创建失败')
    }
  }

  const handleFilterChange = (newFilter: QuoteFilter) => {
    setFilter({
      ...newFilter,
      status: QuoteStatus.Draft,
      page: 1,
    })
  }

  const handlePaginationChange = (page: number, pageSize: number) => {
    setFilter((prev) => ({ ...prev, page, pageSize }))
  }

  const handleWorkflowSuccess = () => {
    loadData()
  }

  return (
    <div>
      <Row gutter={16} style={{ height: 'calc(100vh - 200px)' }}>
        <Col span={currentQuote ? 10 : 24}>
          <Card
            title="报价单列表（草稿 / 待审核）"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreateModalOpen(true)}
              >
                新建报价
              </Button>
            }
            style={{ height: '100%', overflow: 'auto' }}
            styles={{ body: { height: 'calc(100% - 57px)', overflow: 'auto' } }}
          >
            <QuoteList
              data={list}
              loading={loading}
              onView={handleSelectQuote}
              showCreateButton={false}
              onFilterChange={handleFilterChange}
              pagination={{
                ...pagination,
                onChange: handlePaginationChange,
              }}
            />
          </Card>
        </Col>
        {currentQuote && (
          <Col span={14}>
            <div style={{ height: '100%', overflow: 'auto', paddingRight: 8 }}>
              <div style={{ marginBottom: 16 }}>
                <WorkflowActions onSuccess={handleWorkflowSuccess} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <QuoteBasicInfo mode="edit" />
              </div>
              <QuoteItemsPanel mode="edit" />
            </div>
          </Col>
        )}
        {!currentQuote && (
          <Col span={0}>
            <Empty />
          </Col>
        )}
      </Row>

      <Modal
        title="新建报价单"
        open={createModalOpen}
        onOk={handleCreate}
        onCancel={() => {
          setCreateModalOpen(false)
          form.resetFields()
          setQuoteItems([])
        }}
        destroyOnClose
        width={900}
        okText="创建"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="clientName"
                label="客户名称"
                rules={[{ required: true, message: '请输入客户名称' }]}
              >
                <Input placeholder="请输入客户名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="caseName"
                label="案件名称"
                rules={[{ required: true, message: '请输入案件名称' }]}
              >
                <Input placeholder="请输入案件名称" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="channel"
                label="渠道"
                rules={[{ required: true, message: '请选择渠道' }]}
              >
                <Select
                  placeholder="请选择渠道"
                  options={Object.entries(channelLabels).map(([value, label]) => ({
                    value: value as Channel,
                    label,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="owner" label="责任人">
                <Input placeholder="请输入责任人" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="amount"
                label="报价金额"
                rules={[{ required: true, message: '请输入报价金额' }]}
              >
                <InputNumber<number>
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="请输入报价金额"
                  formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => Number(value?.replace(/[^\d.]/g, '')) || 0}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="discountAmount" label="优惠金额">
                <InputNumber<number>
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="请输入优惠金额"
                  formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => Number(value?.replace(/[^\d.]/g, '')) || 0}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="finalAmount"
                label="最终金额"
                rules={[{ required: true, message: '请输入最终金额' }]}
              >
                <InputNumber<number>
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="请输入最终金额"
                  formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => Number(value?.replace(/[^\d.]/g, '')) || 0}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="expectedPaymentDate" label="预计付款日期">
            <Input placeholder="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="remarks" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>

          <div style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 500 }}>报价明细</span>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddItem} size="small">
                添加明细
              </Button>
            </div>
            <Table
              rowKey="id"
              dataSource={quoteItems}
              pagination={false}
              size="small"
              columns={[
                {
                  title: '项目名称',
                  dataIndex: 'itemName',
                  key: 'itemName',
                  render: (value, record) => (
                    <Input
                      value={value}
                      onChange={(e) => handleUpdateItem(record.id, 'itemName', e.target.value)}
                      placeholder="请输入项目名称"
                    />
                  ),
                },
                {
                  title: '描述',
                  dataIndex: 'description',
                  key: 'description',
                  render: (value, record) => (
                    <Input
                      value={value}
                      onChange={(e) => handleUpdateItem(record.id, 'description', e.target.value)}
                      placeholder="描述"
                    />
                  ),
                },
                {
                  title: '单价',
                  dataIndex: 'unitPrice',
                  key: 'unitPrice',
                  width: 140,
                  render: (value, record) => (
                    <InputNumber<number>
                      min={0}
                      style={{ width: '100%' }}
                      value={value}
                      formatter={(v) => `¥ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={(v) => Number(v?.replace(/[^\d.]/g, '')) || 0}
                      onChange={(v) => handleUpdateItem(record.id, 'unitPrice', Number(v) || 0)}
                    />
                  ),
                },
                {
                  title: '数量',
                  dataIndex: 'quantity',
                  key: 'quantity',
                  width: 100,
                  render: (value, record) => (
                    <InputNumber<number>
                      min={0}
                      style={{ width: '100%' }}
                      value={value}
                      onChange={(v) => handleUpdateItem(record.id, 'quantity', Number(v) || 0)}
                    />
                  ),
                },
                {
                  title: '小计',
                  dataIndex: 'subtotal',
                  key: 'subtotal',
                  width: 140,
                  render: (value: number) => `¥${(value || 0).toLocaleString()}`,
                },
                {
                  title: '操作',
                  key: 'action',
                  width: 60,
                  render: (_, record) => (
                    <Popconfirm title="确定删除此项目？" onConfirm={() => handleDeleteItem(record.id)}>
                      <Button type="link" danger icon={<DeleteOutlined />} size="small" />
                    </Popconfirm>
                  ),
                },
              ]}
            />
            {quoteItems.length > 0 && (
              <div style={{ textAlign: 'right', marginTop: 8, fontWeight: 500 }}>
                明细合计：¥
                {quoteItems.reduce((sum, item) => sum + (item.subtotal || 0), 0).toLocaleString()}
              </div>
            )}
          </div>
        </Form>
      </Modal>
    </div>
  )
}

export default QuoteEntry
