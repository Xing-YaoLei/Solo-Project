import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Modal,
  Form,
  DatePicker,
  Row,
  Col,
  Card,
  Statistic,
  message,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import { useEffect, useState } from 'react'
import type { Quote, QuoteStatus } from '../../types'
import { quotesApi, statisticsApi } from '../../api'
import {
  formatCurrency,
  formatDate,
  quoteStatusOptions,
  getQuoteStatusLabel,
} from '../../utils/format'
import dayjs from 'dayjs'

export const Route = createFileRoute('/_layout/quotes')({
  component: QuotesPage,
})

function QuotesPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<Quote[]>([])
  const [total, setTotal] = useState(0)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20 })
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [filters, setFilters] = useState({
    keyword: '',
    status: undefined as QuoteStatus | undefined,
    client_name: '',
  })
  const [batchModalVisible, setBatchModalVisible] = useState(false)
  const [batchForm] = Form.useForm()
  const [overview, setOverview] = useState({
    total_quotes: 0,
    total_amount: 0,
    total_paid: 0,
    pending_count: 0,
    exception_count: 0,
    unpaid_amount: 0,
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await quotesApi.list({
        page: pagination.page,
        page_size: pagination.pageSize,
        keyword: filters.keyword || undefined,
        status: filters.status,
        client_name: filters.client_name || undefined,
      })
      setData(res.items)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }

  const loadOverview = async () => {
    try {
      const ov = await statisticsApi.getOverview()
      setOverview(ov as any)
    } catch {}
  }

  useEffect(() => {
    loadData()
    loadOverview()
  }, [pagination, filters])

  const handleBatchStatus = async () => {
    try {
      const values = await batchForm.validateFields()
      await quotesApi.batchUpdateStatus({
        quote_ids: selectedRowKeys as string[],
        status: values.status,
        comment: values.comment,
      })
      message.success('批量状态更新成功')
      setBatchModalVisible(false)
      setSelectedRowKeys([])
      batchForm.resetFields()
      loadData()
    } catch (error: any) {
      message.error(error?.response?.data?.detail || '操作失败')
    }
  }

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '删除后不可恢复，确定要删除此报价单吗？',
      onOk: async () => {
        try {
          await quotesApi.delete(id)
          message.success('删除成功')
          loadData()
        } catch (error: any) {
          message.error(error?.response?.data?.detail || '删除失败')
        }
      },
    })
  }

  const columns = [
    {
      title: '报价单号',
      dataIndex: 'quote_no',
      width: 150,
      render: (v: string, record: Quote) => (
        <a onClick={() => navigate({ to: '/quotes/$id', params: { id: record.id } })}>{v}</a>
      ),
    },
    { title: '标题', dataIndex: 'title', ellipsis: true },
    { title: '客户名称', dataIndex: 'client_name', width: 160 },
    {
      title: '金额',
      dataIndex: 'discounted_amount',
      width: 140,
      render: (v: number) => formatCurrency(v),
    },
    {
      title: '已付款',
      dataIndex: 'paid_amount',
      width: 140,
      render: (v: number) => formatCurrency(v),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      render: (v: string) => {
        const opt = quoteStatusOptions.find((o) => o.value === v)
        return <Tag color={opt?.color as any}>{getQuoteStatusLabel(v)}</Tag>
      },
    },
    { title: '负责人', dataIndex: 'assignee_name', width: 100 },
    {
      title: '创建日期',
      dataIndex: 'created_at',
      width: 120,
      render: (v: string) => formatDate(v),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right' as const,
      render: (_: unknown, record: Quote) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate({ to: '/quotes/$id', params: { id: record.id } })}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate({ to: '/quotes/$id', params: { id: record.id } })}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="page-container">
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card className="stat-card">
            <Statistic
              title="报价单总数"
              value={overview.total_quotes}
              valueStyle={{ fontSize: 22 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card className="stat-card">
            <Statistic
              title="总金额"
              value={overview.total_amount}
              precision={2}
              prefix="¥"
              valueStyle={{ fontSize: 22, color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card className="stat-card">
            <Statistic
              title="已回款"
              value={overview.total_paid}
              precision={2}
              prefix="¥"
              valueStyle={{ fontSize: 22, color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card className="stat-card">
            <Statistic
              title="待处理"
              value={overview.pending_count}
              valueStyle={{ fontSize: 22, color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card className="stat-card">
            <Statistic
              title="异常单"
              value={overview.exception_count}
              valueStyle={{ fontSize: 22, color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card className="stat-card">
            <Statistic
              title="未回款"
              value={overview.unpaid_amount}
              precision={2}
              prefix="¥"
              valueStyle={{ fontSize: 22, color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <div className="table-toolbar">
        <div className="table-toolbar-left">
          <Input
            allowClear
            placeholder="搜索单号/标题/客户"
            prefix={<SearchOutlined />}
            style={{ width: 240 }}
            value={filters.keyword}
            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
          />
          <Select
            allowClear
            placeholder="状态"
            style={{ width: 140 }}
            options={quoteStatusOptions}
            value={filters.status}
            onChange={(v) => setFilters({ ...filters, status: v })}
          />
          <Input
            allowClear
            placeholder="客户名称"
            style={{ width: 160 }}
            value={filters.client_name}
            onChange={(e) => setFilters({ ...filters, client_name: e.target.value })}
          />
          <Button icon={<ReloadOutlined />} onClick={loadData}>
            刷新
          </Button>
        </div>
        <div className="table-toolbar-right">
          {selectedRowKeys.length > 0 && (
            <Button
              icon={<CheckCircleOutlined />}
              onClick={() => setBatchModalVisible(true)}
            >
              批量更新状态 ({selectedRowKeys.length})
            </Button>
          )}
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate({ to: '/quotes/new' })}
          >
            新建报价单
          </Button>
        </div>
      </div>

      <Card style={{ borderRadius: 8 }}>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data}
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (page, pageSize) => setPagination({ page, pageSize }),
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title="批量更新状态"
        open={batchModalVisible}
        onOk={handleBatchStatus}
        onCancel={() => {
          setBatchModalVisible(false)
          batchForm.resetFields()
        }}
      >
        <Form form={batchForm} layout="vertical">
          <Form.Item
            name="status"
            label="目标状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select options={quoteStatusOptions} />
          </Form.Item>
          <Form.Item name="comment" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
