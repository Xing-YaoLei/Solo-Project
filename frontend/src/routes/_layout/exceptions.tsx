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
  InputNumber,
  Card,
  Drawer,
  Descriptions,
  Timeline,
  message,
  Row,
  Col,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  FileTextOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { useEffect, useState } from 'react'
import type { ExceptionRecord, ExceptionHistory } from '../../types'
import { exceptionsApi } from '../../api'
import {
  formatCurrency,
  formatDateTime,
  exceptionStatusOptions,
  exceptionTypeOptions,
  getExceptionStatusLabel,
  getExceptionTypeLabel,
} from '../../utils/format'

export const Route = createFileRoute('/_layout/exceptions')({
  component: ExceptionsPage,
})

function ExceptionsPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ExceptionRecord[]>([])
  const [total, setTotal] = useState(0)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20 })
  const [filters, setFilters] = useState({
    status: undefined as string | undefined,
    exception_type: undefined as string | undefined,
    keyword: '',
  })
  const [createVisible, setCreateVisible] = useState(false)
  const [createForm] = Form.useForm()
  const [detailVisible, setDetailVisible] = useState(false)
  const [detailData, setDetailData] = useState<ExceptionRecord | null>(null)
  const [history, setHistory] = useState<ExceptionHistory[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [statusModal, setStatusModal] = useState<{
    visible: boolean
    record: ExceptionRecord | null
  }>({ visible: false, record: null })
  const [statusForm] = Form.useForm()

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await exceptionsApi.list({
        page: pagination.page,
        page_size: pagination.page_size,
        status: filters.status,
        exception_type: filters.exception_type,
        keyword: filters.keyword || undefined,
      })
      setData(res.items)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [pagination, filters])

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields()
      const payload = {
        ...values,
        difference_amount:
          values.expected_amount && values.actual_amount
            ? values.actual_amount - values.expected_amount
            : null,
      }
      await exceptionsApi.create(payload)
      message.success('异常记录创建成功')
      setCreateVisible(false)
      createForm.resetFields()
      loadData()
    } catch (error: any) {
      message.error(error?.response?.data?.detail || '创建失败')
    }
  }

  const handleStatusChange = async () => {
    if (!statusModal.record) return
    try {
      const values = await statusForm.validateFields()
      await exceptionsApi.updateStatus(statusModal.record.id, {
        status: values.status,
        comment: values.comment,
        source_record: values.source_record,
      })
      message.success('状态更新成功')
      setStatusModal({ visible: false, record: null })
      statusForm.resetFields()
      loadData()
    } catch (error: any) {
      message.error(error?.response?.data?.detail || '操作失败')
    }
  }

  const loadDetail = async (record: ExceptionRecord) => {
    setDetailData(record)
    setDetailVisible(true)
    setHistoryLoading(true)
    try {
      const h = await exceptionsApi.getHistory(record.id)
      setHistory(h)
    } finally {
      setHistoryLoading(false)
    }
  }

  const columns = [
    {
      title: '异常编号',
      dataIndex: 'id',
      width: 80,
      render: (_: string, record: ExceptionRecord) => (
        <Button
          type="link"
          size="small"
          onClick={() => loadDetail(record)}
        >
          查看
        </Button>
      ),
    },
    { title: '标题', dataIndex: 'title', ellipsis: true },
    {
      title: '类型',
      dataIndex: 'exception_type',
      width: 120,
      render: (v: string) => (
        <Tag color="red">
          <WarningOutlined /> {getExceptionTypeLabel(v)}
        </Tag>
      ),
    },
    {
      title: '关联报价单',
      dataIndex: 'quote_title',
      width: 180,
      ellipsis: true,
      render: (v: string, record: ExceptionRecord) => (
        <Button
          type="link"
          icon={<FileTextOutlined />}
          onClick={() => navigate({ to: '/quotes/$id', params: { id: record.quote_id } })}
        >
          {v}
        </Button>
      ),
    },
    { title: '客户', dataIndex: 'client_name', width: 120 },
    {
      title: '差额',
      dataIndex: 'difference_amount',
      width: 120,
      render: (v: number | null) =>
        v != null ? (
          <span style={{ color: v < 0 ? '#ff4d4f' : '#52c41a', fontWeight: 500 }}>
            {formatCurrency(v)}
          </span>
        ) : (
          '-'
        ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: string) => {
        const opt = exceptionStatusOptions.find((o) => o.value === v)
        return <Tag color={opt?.color as any}>{getExceptionStatusLabel(v)}</Tag>
      },
    },
    { title: '处理人', dataIndex: 'handler_name', width: 100 },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 160,
      render: (v: string) => formatDateTime(v),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_: unknown, record: ExceptionRecord) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => loadDetail(record)}
          >
            详情
          </Button>
          {record.status !== 'closed' && (
            <Button
              type="link"
              size="small"
              onClick={() => setStatusModal({ visible: true, record })}
            >
              更新状态
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">异常处理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateVisible(true)}>
          登记异常
        </Button>
      </div>

      <Card style={{ borderRadius: 8 }}>
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <Input
              allowClear
              placeholder="搜索标题/描述"
              prefix={<SearchOutlined />}
              style={{ width: 240 }}
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            />
            <Select
              allowClear
              placeholder="异常类型"
              style={{ width: 140 }}
              options={exceptionTypeOptions}
              value={filters.exception_type}
              onChange={(v) => setFilters({ ...filters, exception_type: v })}
            />
            <Select
              allowClear
              placeholder="状态"
              style={{ width: 120 }}
              options={exceptionStatusOptions}
              value={filters.status}
              onChange={(v) => setFilters({ ...filters, status: v })}
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
            pageSize: pagination.page_size,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (page, pageSize) => setPagination({ page, pageSize }),
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title="登记异常"
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
              options={async () => {
                try {
                  const { quotesApi } = await import('../../api')
                  const res = await quotesApi.list({ page_size: 100 })
                  return res.items.map((q) => ({
                    value: q.id,
                    label: `${q.quote_no} - ${q.title} (${q.client_name})`,
                  }))
                } catch {
                  return []
                }
              }}
            />
          </Form.Item>
          <Form.Item
            label="异常标题"
            name="title"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="简要描述异常" />
          </Form.Item>
          <Form.Item
            label="异常类型"
            name="exception_type"
            rules={[{ required: true, message: '请选择类型' }]}
          >
            <Select options={exceptionTypeOptions} />
          </Form.Item>
          <Form.Item
            label="详细描述"
            name="description"
            rules={[{ required: true, message: '请描述异常详情' }]}
          >
            <Input.TextArea rows={3} placeholder="请详细描述异常情况和来源" />
          </Form.Item>
          <Form.Item label="来源记录引用" name="source_ref">
            <Input placeholder="如：单据号、支付流水号等" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="预期金额" name="expected_amount">
                <InputNumber precision={2} style={{ width: '100%' }} prefix="¥" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="实际金额" name="actual_amount">
                <InputNumber precision={2} style={{ width: '100%' }} prefix="¥" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="更新异常状态"
        open={statusModal.visible}
        onOk={handleStatusChange}
        onCancel={() => {
          setStatusModal({ visible: false, record: null })
          statusForm.resetFields()
        }}
      >
        <Form form={statusForm} layout="vertical">
          <Form.Item
            label="目标状态"
            name="status"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select options={exceptionStatusOptions} />
          </Form.Item>
          <Form.Item
            label="处理说明"
            name="comment"
            rules={[{ required: true, message: '请填写处理说明' }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="请详细说明处理方式、原因等（此记录将作为追溯依据）"
            />
          </Form.Item>
          <Form.Item label="关联来源记录" name="source_record">
            <Input placeholder="可关联的单据号、审批记录等，用于追溯" />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="异常记录详情"
        width={640}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {detailData && (
          <>
            <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="标题">{detailData.title}</Descriptions.Item>
              <Descriptions.Item label="类型">{getExceptionTypeLabel(detailData.exception_type)}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag
                  color={
                    exceptionStatusOptions.find((o) => o.value === detailData.status)?.color as any
                  }
                >
                  {getExceptionStatusLabel(detailData.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="关联报价单">
                <Button
                  type="link"
                  onClick={() => navigate({ to: '/quotes/$id', params: { id: detailData.quote_id } })}
                >
                  {detailData.quote_title}
                </Button>
              </Descriptions.Item>
              <Descriptions.Item label="客户">{detailData.client_name}</Descriptions.Item>
              <Descriptions.Item label="来源引用">{detailData.source_ref || '-'}</Descriptions.Item>
              <Descriptions.Item label="预期金额">
                {detailData.expected_amount != null ? formatCurrency(detailData.expected_amount) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="实际金额">
                {detailData.actual_amount != null ? formatCurrency(detailData.actual_amount) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="差额">
                {detailData.difference_amount != null ? (
                  <span style={{ color: detailData.difference_amount < 0 ? '#ff4d4f' : '#52c41a' }}>
                    {formatCurrency(detailData.difference_amount)}
                  </span>
                ) : (
                  '-'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="描述">{detailData.description}</Descriptions.Item>
              <Descriptions.Item label="处理人">{detailData.handler_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="处理结果">{detailData.resolution || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{formatDateTime(detailData.created_at)}</Descriptions.Item>
              <Descriptions.Item label="解决时间">
                {detailData.resolved_at ? formatDateTime(detailData.resolved_at) : '-'}
              </Descriptions.Item>
            </Descriptions>

            <div className="detail-section-title">处理历史（来源追溯）</div>
            <Timeline
              items={history.map((h) => ({
                color: h.action === 'create' ? 'red' : 'blue',
                children: (
                  <div>
                    <div style={{ fontWeight: 500 }}>
                      {h.from_status && `${getExceptionStatusLabel(h.from_status)} → `}
                      {h.to_status && getExceptionStatusLabel(h.to_status)}
                      {!h.from_status && !h.to_status && h.action}
                    </div>
                    <div style={{ color: '#595959', marginTop: 4 }}>{h.comment}</div>
                    {h.source_record && (
                      <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 4 }}>
                        来源记录: {h.source_record}
                      </div>
                    )}
                    <div style={{ color: '#bfbfbf', fontSize: 12, marginTop: 4 }}>
                      {h.operator_name || '系统'} · {formatDateTime(h.created_at)}
                    </div>
                  </div>
                ),
              }))}
            />
          </>
        )}
      </Drawer>
    </div>
  )
}
