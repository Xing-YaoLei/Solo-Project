import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Table, Button, Input, Select, Space, Modal, Form, message, Popconfirm, Tag, Row, Col, Card } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, QrcodeOutlined, CheckOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { pickupCodeApi, groupBatchApi } from '../../api'
import { PickupCode, PickupCodeStatusMap, StatusColorMap } from '../../types'
import { useAppStore } from '../../store'
import StatusBadge from '../../components/StatusBadge'

const { Option } = Select

export default function PickupCodeList() {
  const queryClient = useQueryClient()
  const { currentOperator } = useAppStore()
  const [form] = Form.useForm()
  const [statusForm] = Form.useForm()
  const [searchForm] = Form.useForm()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [modalVisible, setModalVisible] = useState(false)
  const [statusModalVisible, setStatusModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<PickupCode | null>(null)
  const [statusItem, setStatusItem] = useState<PickupCode | null>(null)

  const { data: groupBatches } = useQuery({
    queryKey: ['group-batches', 'all'],
    queryFn: () => groupBatchApi.list({ page: 1, page_size: 100 }),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['pickup-codes', page, pageSize, keyword, statusFilter],
    queryFn: () => pickupCodeApi.list({
      page,
      page_size: pageSize,
      keyword,
      status: statusFilter,
    }),
  })

  const createMutation = useMutation({
    mutationFn: (values: Partial<PickupCode>) => pickupCodeApi.create(values),
    onSuccess: () => {
      message.success('创建成功')
      setModalVisible(false)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['pickup-codes'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: Partial<PickupCode> }) =>
      pickupCodeApi.update(id, values),
    onSuccess: () => {
      message.success('更新成功')
      setModalVisible(false)
      setEditingItem(null)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['pickup-codes'] })
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: any }) =>
      pickupCodeApi.updateStatus(id, values),
    onSuccess: () => {
      message.success('状态更新成功')
      setStatusModalVisible(false)
      setStatusItem(null)
      statusForm.resetFields()
      queryClient.invalidateQueries({ queryKey: ['pickup-codes'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => pickupCodeApi.delete(id),
    onSuccess: () => {
      message.success('删除成功')
      queryClient.invalidateQueries({ queryKey: ['pickup-codes'] })
    },
  })

  const handleSearch = () => {
    searchForm.validateFields().then((values) => {
      setKeyword(values.keyword || '')
      setStatusFilter(values.status)
      setPage(1)
    })
  }

  const handleCreate = () => {
    setEditingItem(null)
    form.resetFields()
    form.setFieldsValue({
      status: 'unused',
      is_notified: false,
    })
    setModalVisible(true)
  }

  const handleEdit = (record: PickupCode) => {
    setEditingItem(record)
    form.setFieldsValue({
      ...record,
      expire_time: record.expire_time ? dayjs(record.expire_time) : undefined,
      pickup_time: record.pickup_time ? dayjs(record.pickup_time) : undefined,
    })
    setModalVisible(true)
  }

  const handleUpdateStatus = (record: PickupCode) => {
    setStatusItem(record)
    statusForm.resetFields()
    statusForm.setFieldsValue({
      status: record.status,
      change_reason: '',
      operator: currentOperator,
    })
    setStatusModalVisible(true)
  }

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const formattedValues = {
        ...values,
        expire_time: values.expire_time?.toISOString(),
        pickup_time: values.pickup_time?.toISOString(),
      }

      if (editingItem) {
        updateMutation.mutate({ id: editingItem.id!, values: formattedValues })
      } else {
        createMutation.mutate(formattedValues)
      }
    })
  }

  const handleStatusSubmit = () => {
    statusForm.validateFields().then((values) => {
      updateStatusMutation.mutate({
        id: statusItem!.id!,
        values: {
          ...values,
          operator: currentOperator,
        },
      })
    })
  }

  const handlePickup = (record: PickupCode) => {
    updateStatusMutation.mutate({
      id: record.id!,
      values: {
        status: 'used',
        change_reason: '用户自提',
        operator: currentOperator,
      },
    })
  }

  const columns = [
    {
      title: '自提码',
      dataIndex: 'code',
      key: 'code',
      width: 140,
      render: (text: string) => (
        <Space>
          <QrcodeOutlined />
          <strong>{text}</strong>
        </Space>
      ),
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
      title: '客户姓名',
      dataIndex: 'customer_name',
      key: 'customer_name',
      width: 100,
    },
    {
      title: '手机号',
      dataIndex: 'customer_phone',
      key: 'customer_phone',
      width: 120,
    },
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 140,
    },
    {
      title: '商品信息',
      dataIndex: 'product_info',
      key: 'product_info',
      ellipsis: true,
    },
    {
      title: '件数',
      dataIndex: 'total_items',
      key: 'total_items',
      width: 80,
      align: 'right' as const,
    },
    {
      title: '金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 100,
      align: 'right' as const,
      render: (amount: number) => `¥${amount?.toFixed(2) || '0.00'}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <StatusBadge status={status} type="pickup" />,
    },
    {
      title: '提货时间',
      dataIndex: 'pickup_time',
      key: 'pickup_time',
      width: 160,
      render: (time: string) => time ? dayjs(time).format('MM-DD HH:mm') : '-',
    },
    {
      title: '有效期',
      dataIndex: 'expire_time',
      key: 'expire_time',
      width: 160,
      render: (time: string) => time ? dayjs(time).format('MM-DD HH:mm') : '-',
    },
    {
      title: '已通知',
      dataIndex: 'is_notified',
      key: 'is_notified',
      width: 80,
      render: (notified: boolean) => notified ? <Tag color="green">是</Tag> : <Tag color="default">否</Tag>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      fixed: 'right' as const,
      render: (_: any, record: PickupCode) => (
        <Space size="small">
          {record.status === 'unused' && (
            <Button
              type="link"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handlePickup(record)}
            >
              提货
            </Button>
          )}
          <Button
            type="link"
            size="small"
            onClick={() => handleUpdateStatus(record)}
          >
            改状态
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除这个自提码吗？"
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
        <h1 className="page-title">自提码管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          生成自提码
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Form form={searchForm} layout="inline" className="filter-form" onFinish={handleSearch}>
          <Form.Item name="keyword" label="关键词">
            <Input placeholder="自提码/客户/手机号" allowClear style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="全部状态" allowClear style={{ width: 140 }}>
              {Object.entries(PickupCodeStatusMap).map(([value, label]) => (
                <Option key={value} value={value}>
                  <Tag color={StatusColorMap[value] as any}>{label}</Tag>
                </Option>
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
          scroll={{ x: 1500 }}
        />
      </Card>

      <Modal
        title={editingItem ? '编辑自提码' : '生成自提码'}
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
            <Col xs={24} sm={12}>
              <Form.Item
                name="code"
                label="自提码"
                rules={[{ required: true, message: '请输入自提码' }]}
              >
                <Input placeholder="如：A1B2C3" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="customer_name" label="客户姓名">
                <Input placeholder="请输入客户姓名" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="customer_phone" label="手机号">
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="order_no" label="订单号">
                <Input placeholder="请输入订单号" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="status" label="状态">
                <Select>
                  {Object.entries(PickupCodeStatusMap).map(([value, label]) => (
                    <Option key={value} value={value}>{label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="product_info" label="商品信息">
            <Input.TextArea rows={2} placeholder="商品信息描述" />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item name="total_items" label="商品件数">
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="total_amount" label="总金额">
                <Input type="number" step="0.01" min={0} prefix="¥" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="expire_time" label="过期时间">
                <Input type="datetime-local" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="pickup_operator" label="提货操作人">
                <Input placeholder="请输入提货操作人" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="is_notified" label="已通知客户" valuePropName="checked">
                <Select>
                  <Option value={true}>是</Option>
                  <Option value={false}>否</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="更新自提码状态"
        open={statusModalVisible}
        onOk={handleStatusSubmit}
        onCancel={() => {
          setStatusModalVisible(false)
          setStatusItem(null)
        }}
        okText="确认更新"
        cancelText="取消"
        confirmLoading={updateStatusMutation.isPending}
      >
        {statusItem && (
          <div>
            <p><strong>自提码：</strong>{statusItem.code}</p>
            <p><strong>当前状态：</strong>{PickupCodeStatusMap[statusItem.status]}</p>
            <Form form={statusForm} layout="vertical">
              <Form.Item
                name="status"
                label="新状态"
                rules={[{ required: true, message: '请选择新状态' }]}
              >
                <Select>
                  {Object.entries(PickupCodeStatusMap).map(([value, label]) => (
                    <Option key={value} value={value}>{label}</Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                name="change_reason"
                label="变更原因"
                rules={[{ required: true, message: '请输入变更原因' }]}
              >
                <Input.TextArea rows={3} placeholder="请输入变更原因" />
              </Form.Item>
              <Form.Item name="operator" label="操作人">
                <Input />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  )
}
