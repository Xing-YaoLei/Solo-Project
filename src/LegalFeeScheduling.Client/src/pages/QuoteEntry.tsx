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
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import QuoteList from '../components/quotes/QuoteList'
import QuoteBasicInfo from '../components/quotes/QuoteBasicInfo'
import QuoteItemsPanel from '../components/quotes/QuoteItemsPanel'
import WorkflowActions from '../components/workflow/WorkflowActions'
import { quoteApi } from '../api/quotes'
import { useQuoteStore } from '../store/useQuoteStore'
import {
  Quote,
  QuoteStatus,
  QuoteListFilter,
  Channel,
  CreateQuoteRequest,
} from '../types'
import { channelLabels } from '../components/quotes/QuoteList'

function QuoteEntry() {
  const [list, setList] = useState<Quote[]>([])
  const [loading, setLoading] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })
  const [filter, setFilter] = useState<QuoteListFilter>({
    statuses: [QuoteStatus.Draft, QuoteStatus.PendingReview],
    pageIndex: 1,
    pageSize: 10,
  })
  const currentQuote = useQuoteStore((s) => s.currentQuote)
  const setCurrentQuote = useQuoteStore((s) => s.setCurrentQuote)
  const [form] = Form.useForm()

  const loadData = async () => {
    setLoading(true)
    try {
      const result = await quoteApi.getList(filter)
      setList(result.items)
      setPagination({
        current: result.pageIndex,
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
      const detail = await quoteApi.getById(quote.id)
      setCurrentQuote(detail)
    } catch {
      message.error('加载报价单详情失败')
    }
  }

  const handleCreate = async () => {
    try {
      const values = await form.validateFields()
      const request: CreateQuoteRequest = {
        clientName: values.clientName,
        caseName: values.caseName,
        channel: values.channel,
        owner: values.owner,
        remark: values.remark,
        items: [],
      }
      const newQuote = await quoteApi.create(request)
      message.success('创建成功')
      setCreateModalOpen(false)
      form.resetFields()
      loadData()
      handleSelectQuote(newQuote)
    } catch {
      message.error('创建失败')
    }
  }

  const handleFilterChange = (newFilter: QuoteListFilter) => {
    setFilter({
      ...newFilter,
      statuses: [QuoteStatus.Draft, QuoteStatus.PendingReview],
      pageIndex: 1,
    })
  }

  const handlePaginationChange = (page: number, pageSize: number) => {
    setFilter((prev) => ({ ...prev, pageIndex: page, pageSize }))
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
        }}
        destroyOnClose
        width={600}
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
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default QuoteEntry
