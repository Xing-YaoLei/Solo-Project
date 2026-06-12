import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Table, Button, Input, Select, Space, Modal, Form, message, Popconfirm, Tag, Row, Col, Card } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined, WarningOutlined } from '@ant-design/icons'
import { useNavigate } from '@tanstack/react-router'
import dayjs from 'dayjs'
import { exceptionOrderApi, groupBatchApi } from '../../api'
import { ExceptionOrder, ExceptionOrderTypeMap, ExceptionOrderStatusMap, ResponsibilityPartyMap, StatusColorMap } from '../../types'
import { useAppStore } from '../../store'
import StatusBadge from '../../components/StatusBadge'

const { Option } = Select

export default function ExceptionOrderList() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { currentOperator } = useAppStore()
  const [form] = Form.useForm()
  const [processForm] = Form.useForm()
  const [searchForm] = Form.useForm()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [typeFilter, setTypeFilter] = useState<string | undefined>()
  const [respFilter, setRespFilter] = useState<string | undefined>()
  const [modalVisible, setModalVisible] = useState(false)
  const [processModalVisible, setProcessModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<ExceptionOrder | null>(null)
  const [processingItem, setProcessingItem] = useState<ExceptionOrder | null>(null)

  const { data: groupBatches } = useQuery({
    queryKey: ['group-batches', 'all'],
    queryFn: () => groupBatchApi.list({ page: 1, page_size: 100 }),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['exception-orders', page, pageSize, keyword, statusFilter, typeFilter, respFilter],
    queryFn: () => exceptionOrderApi.list({
      page,
      page_size: pageSize,
      keyword,
      status: statusFilter,
      type: typeFilter,
      responsibility_party: respFilter,
    }),
  })

  const createMutation = useMutation({
    mutationFn: (values: Partial<ExceptionOrder>) => exceptionOrderApi.create(values),
    onSuccess: () => {
      message.success('创建成功')
      setModalVisible(false)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['exception-orders'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: Partial<ExceptionOrder> }) =>
      exceptionOrderApi.update(id, values),
    onSuccess: () => {
      message.success('更新成功')
      setModalVisible(false)
      setEditingItem(null)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['exception-orders'] })
    },
  })

  const processMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: any }) =>
      exceptionOrderApi.process(id, values),
    onSuccess: () => {
      message.success('处理成功')
      setProcessModalVisible(false)
      setProcessingItem(null)
      processForm.resetFields()
      queryClient.invalidateQueries({ queryKey: ['exception-orders'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => exceptionOrderApi.delete(id),
    onSuccess: () => {
      message.success('删除成功')
      queryClient.invalidateQueries({ queryKey: ['exception-orders'] })
    },
  })

  const handleSearch = () => {
    searchForm.validateFields().then((values) => {
      setKeyword(values.keyword || '')
      setStatusFilter(values.status)
      setTypeFilter(values.type)
      setRespFilter(values.responsibility_party)
      setPage(1)
    })
  }

  const handleCreate = () => {
    setEditingItem(null)
    form.resetFields()
    form.setFieldsValue({
      type: 'shortage',
      status: 'pending',
      responsibility_party: 'unknown',
      reported_by: currentOperator,
    })
    setModalVisible(true)
  }

  const handleEdit = (record: ExceptionOrder) => {
    setEditingItem(record)
    form.setFieldsValue({
      ...record,
      reported_time: record.reported_time ? dayjs(record.reported_time) : undefined,
      process_time: record.process_time ? dayjs(record.process_time) : undefined,
    })
    setModalVisible(true)
  }

  const handleProcess = (record: ExceptionOrder) => {
    setProcessingItem(record)
    processForm.resetFields()
    processForm.setFieldsValue({
      status: record.status,
      responsibility_party: record.responsibility_party,
      responsibility_detail: record.responsibility_detail,
      process_result: '',
      compensation_amount: 0,
      processor: currentOperator,
      remark: '',
    })
    setProcessModalVisible(true)
  }

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const formattedValues = {
        ...values,
        reported_time: values.reported_time?.toISOString(),
        process_time: values.process_time?.toISOString(),
        reported_by: currentOperator,
      }

      if (editingItem) {
        updateMutation.mutate({ id: editingItem.id!, values: formattedValues })
      } else {
        createMutation.mutate(formattedValues)
      }
    })
  }

  const handleProcessSubmit = () => {
    processForm.validateFields().then((values) => {
      processMutation.mutate({
        id: processingItem!.id!,
        values: {
          ...values,
          processor: currentOperator,
          process_time: dayjs().toISOString(),
        },
      })
    })
  }

  const typeColorMap: Record<string, string> = {
    shortage: 'red',
    quality: 'orange',
    damage: 'volcano',
    delay: 'blue',
    other: 'default',
  }

  const respColorMap: Record<string, string> = {
    supplier: 'red',
    warehouse: 'orange',
    logistics: 'blue',
    platform: 'purple',
    customer: 'green',
    unknown: 'default',
  }

  const columns = [
    {
      title: '异常单号',
      dataIndex: 'exception_no',
      key: 'exception_no',
      width: 140,
      render: (text: string) => (
        <Space>
          <WarningOutlined style={{ color: '#faad14' }} />
          <strong>{text}</strong>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => <Tag color={typeColorMap[type] || 'default'}>{ExceptionOrderTypeMap[type]}</Tag>,
    },
    {
      title: '团单',
      dataIndex: 'group_batch_id',
      key: 'group_batch_id',
      width: 120,
      render: (id: number) => {
        const batch = groupBatches?.list.find((b: any) => b.id === id)
        return batch ? batch.batch_no : '-'
      },
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '商品信息',
      dataIndex: 'product_info',
      key: 'product_info',
      ellipsis: true,
    },
    {
      title: '影响数量',
      dataIndex: 'affected_quantity',
      key: 'affected_quantity',
      width: 100,
      align: 'right' as const,
    },
    {
      title: '影响客户',
      dataIndex: 'affected_customers',
      key: 'affected_customers',
      width: 100,
      align: 'right' as const,
    },
    {
      title: '预估损失',
      dataIndex: 'estimated_loss',
      key: 'estimated_loss',
      width: 110,
      align: 'right' as const,
      render: (amount: number) => amount ? `¥${amount.toFixed(2)}` : '-',
    },
    {
      title: '责任方',
      dataIndex: 'responsibility_party',
      key: 'responsibility_party',
      width: 100,
      render: (party: string) => <Tag color={respColorMap[party] || 'default'}>{ResponsibilityPartyMap[party]}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <StatusBadge status={status} type="exception" />,
    },
    {
      title: '上报时间',
      dataIndex: 'reported_time',
      key: 'reported_time',
      width: 160,
      render: (time: string) => time ? dayjs(time).format('MM-DD HH:mm') : '-',
    },
    {
      title: '处理人',
      dataIndex: 'processor',
      key: 'processor',
      width: 100,
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      fixed: 'right' as const,
      render: (_: any, record: ExceptionOrder) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate({ to: `/exception-orders/${record.id}`, params: { id: String(record.id) } })}
          >
            详情
          </Button>
          {record.status !== 'closed' && (
            <Button
              type="link"
              size="small"
              onClick={() => handleProcess(record)}
            >
              处理
            </Button>
          )}
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除这个异常单吗？"
            onConfirm={() => deleteMutation.mutate(record.id!)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">异常单管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新建异常单
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Form form={searchForm} layout="inline" className="filter-form" onFinish={handleSearch}>
          <Form.Item name="keyword" label="关键词">
            <Input placeholder="异常单号/标题" allowClear style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="type" label="类型">
            <Select placeholder="全部类型" allowClear style={{ width: 120 }}>
              {Object.entries(ExceptionOrderTypeMap).map(([value, label]) => (
                <Option key={value} value={value}>{label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="全部状态" allowClear style={{ width: 120 }}>
              {Object.entries(ExceptionOrderStatusMap).map(([value, label]) => (
                <Option key={value} value={value}>
                  <Tag color={StatusColorMap[value] as any}>{label}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="responsibility_party" label="责任方">
            <Select placeholder="全部" allowClear style={{ width: 120 }}>
              {Object.entries(ResponsibilityPartyMap).map(([value, label]) => (
                <Option key={value} value={value}>{label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                搜索
              </Button>
              <Button onClick={() => {
                searchForm.resetFields()
                setKeyword('')
                setStatusFilter(undefined)
                setTypeFilter(undefined)
                setRespFilter(undefined)
              }}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={data?.list || []}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: page,
            pageSize,
            total: data?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (p, ps) => {
              setPage(p)
              setPageSize(ps)
            },
          }}
          scroll={{ x: 1600 }}
        />
      </Card>

      <Modal
        title={editingItem ? '编辑异常单' : '新建异常单'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false)
          setEditingItem(null)
        }}
        width={700}
        okText="保存"
        cancelText="取消"
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="exception_no"
                label="异常单号"
                rules={[{ required: true, message: '请输入异常单号' }]}
              >
                <Input placeholder="自动生成或手动输入" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="group_batch_id"
                label="团购批次"
                rules={[{ required: true, message: '请选择团购批次' }]}
              >
                <Select placeholder="请选择团购批次">
                  {groupBatches?.list.map((batch: any) => (
                    <Option key={batch.id} value={batch.id}>
                      {batch.batch_no} - {batch.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="type"
                label="异常类型"
                rules={[{ required: true, message: '请选择异常类型' }]}
              >
                <Select>
                  {Object.entries(ExceptionOrderTypeMap).map(([value, label]) => (
                    <Option key={value} value={value}>{label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select>
                  {Object.entries(ExceptionOrderStatusMap).map(([value, label]) => (
                    <Option key={value} value={value}>{label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="responsibility_party"
                label="责任方"
                rules={[{ required: true, message: '请选择责任方' }]}
              >
                <Select>
                  {Object.entries(ResponsibilityPartyMap).map(([value, label]) => (
                    <Option key={value} value={value}>{label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="简要描述异常问题" />
          </Form.Item>
          <Form.Item
            name="description"
            label="详细描述"
            rules={[{ required: true, message: '请输入详细描述' }]}
          >
            <Input.TextArea rows={3} placeholder="请详细描述异常情况" />
          </Form.Item>
          <Form.Item name="product_info" label="商品信息">
            <Input.TextArea rows={2} placeholder="相关商品信息" />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item name="affected_quantity" label="影响商品数量">
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="affected_customers" label="影响客户数">
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="estimated_loss" label="预估损失金额">
                <Input type="number" step="0.01" min={0} prefix="¥" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="responsibility_detail" label="责任认定详情">
            <Input.TextArea rows={2} placeholder="责任认定的详细说明" />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="reported_by" label="上报人">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="reported_time" label="上报时间">
                <Input type="datetime-local" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="processor" label="处理人">
                <Input placeholder="请输入处理人" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="compensation_amount" label="赔偿金额">
                <Input type="number" step="0.01" min={0} prefix="¥" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="process_result" label="处理结果">
            <Input.TextArea rows={2} placeholder="处理结果描述" />
          </Form.Item>
          <Form.Item name="evidence_images" label="凭证图片">
            <Input placeholder="图片链接，多个用逗号分隔" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="处理异常单"
        open={processModalVisible}
        onOk={handleProcessSubmit}
        onCancel={() => {
          setProcessModalVisible(false)
          setProcessingItem(null)
        }}
        width={600}
        okText="确认处理"
        cancelText="取消"
        confirmLoading={processMutation.isPending}
      >
        {processingItem && (
          <div>
            <p><strong>异常单号：</strong>{processingItem.exception_no}</p>
            <p><strong>标题：</strong>{processingItem.title}</p>
            <p><strong>当前状态：</strong>{ExceptionOrderStatusMap[processingItem.status]}</p>
            <Form form={processForm} layout="vertical">
              <Form.Item
                name="status"
                label="新状态"
                rules={[{ required: true, message: '请选择新状态' }]}
              >
                <Select>
                  {Object.entries(ExceptionOrderStatusMap).map(([value, label]) => (
                    <Option key={value} value={value}>{label}</Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                name="responsibility_party"
                label="责任方"
                rules={[{ required: true, message: '请选择责任方' }]}
              >
                <Select>
                  {Object.entries(ResponsibilityPartyMap).map(([value, label]) => (
                    <Option key={value} value={value}>{label}</Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="responsibility_detail" label="责任认定详情">
                <Input.TextArea rows={2} placeholder="责任认定的详细说明" />
              </Form.Item>
              <Form.Item
                name="process_result"
                label="处理结果"
                rules={[{ required: true, message: '请输入处理结果' }]}
              >
                <Input.TextArea rows={3} placeholder="请详细描述处理结果" />
              </Form.Item>
              <Form.Item name="compensation_amount" label="赔偿金额">
                <Input type="number" step="0.01" min={0} prefix="¥" />
              </Form.Item>
              <Form.Item name="processor" label="处理人">
                <Input />
              </Form.Item>
              <Form.Item name="remark" label="备注">
                <Input.TextArea rows={2} placeholder="请输入备注" />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  )
}
