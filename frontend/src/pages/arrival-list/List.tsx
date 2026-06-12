import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Table, Button, Input, Select, Space, Modal, Form, message, Popconfirm, Tag, Row, Col, Card } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons'
import { useNavigate } from '@tanstack/react-router'
import dayjs from 'dayjs'
import { arrivalListApi, groupBatchApi, productApi } from '../../api'
import { ArrivalList, ArrivalListStatusMap, StatusColorMap } from '../../types'
import { useAppStore } from '../../store'
import StatusBadge from '../../components/StatusBadge'

const { Option } = Select

export default function ArrivalListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { currentOperator } = useAppStore()
  const [form] = Form.useForm()
  const [confirmForm] = Form.useForm()
  const [searchForm] = Form.useForm()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [modalVisible, setModalVisible] = useState(false)
  const [confirmModalVisible, setConfirmModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<ArrivalList | null>(null)
  const [confirmingItem, setConfirmingItem] = useState<ArrivalList | null>(null)

  const { data: groupBatches } = useQuery({
    queryKey: ['group-batches', 'all'],
    queryFn: () => groupBatchApi.list({ page: 1, page_size: 100 }),
  })

  const { data: products } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: () => productApi.list({ page: 1, page_size: 200 }),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['arrival-lists', page, pageSize, keyword, statusFilter],
    queryFn: () => arrivalListApi.list({
      page,
      page_size: pageSize,
      keyword,
      status: statusFilter,
    }),
  })

  const createMutation = useMutation({
    mutationFn: (values: Partial<ArrivalList>) => arrivalListApi.create(values),
    onSuccess: () => {
      message.success('创建成功')
      setModalVisible(false)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['arrival-lists'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: Partial<ArrivalList> }) =>
      arrivalListApi.update(id, values),
    onSuccess: () => {
      message.success('更新成功')
      setModalVisible(false)
      setEditingItem(null)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['arrival-lists'] })
    },
  })

  const confirmMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: any }) =>
      arrivalListApi.confirm(id, values),
    onSuccess: (data) => {
      if (data.shortage_quantity && data.shortage_quantity > 0) {
        message.warning(`到货确认成功，短少${data.shortage_quantity}件，已自动生成异常单`)
      } else {
        message.success('到货确认成功')
      }
      setConfirmModalVisible(false)
      setConfirmingItem(null)
      confirmForm.resetFields()
      queryClient.invalidateQueries({ queryKey: ['arrival-lists'] })
      queryClient.invalidateQueries({ queryKey: ['exception-orders'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => arrivalListApi.delete(id),
    onSuccess: () => {
      message.success('删除成功')
      queryClient.invalidateQueries({ queryKey: ['arrival-lists'] })
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
      status: 'pending',
      expected_quantity: 0,
      unit_price: 0,
    })
    setModalVisible(true)
  }

  const handleEdit = (record: ArrivalList) => {
    setEditingItem(record)
    form.setFieldsValue({
      ...record,
    })
    setModalVisible(true)
  }

  const handleConfirm = (record: ArrivalList) => {
    setConfirmingItem(record)
    confirmForm.resetFields()
    confirmForm.setFieldsValue({
      actual_quantity: record.expected_quantity,
      remark: '',
      create_exception_on_shortage: true,
    })
    setConfirmModalVisible(true)
  }

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const product = products?.list.find((p: any) => p.id === values.product_id)
      const formattedValues = {
        ...values,
        product_sku: product?.sku,
        product_name: product?.name,
        total_amount: (values.expected_quantity || 0) * (values.unit_price || 0),
        arrival_time: values.arrival_time?.toISOString(),
      }

      if (editingItem) {
        updateMutation.mutate({ id: editingItem.id!, values: formattedValues })
      } else {
        createMutation.mutate(formattedValues)
      }
    })
  }

  const handleConfirmSubmit = () => {
    confirmForm.validateFields().then((values) => {
      confirmMutation.mutate({
        id: confirmingItem!.id!,
        values: {
          ...values,
          arrival_time: dayjs().toISOString(),
          warehouse_operator: currentOperator,
        },
      })
    })
  }

  const columns = [
    {
      title: '批次',
      dataIndex: 'group_batch_id',
      key: 'group_batch_id',
      width: 120,
      render: (id: number) => {
        const batch = groupBatches?.list.find((b: any) => b.id === id)
        return batch ? (
          <Button
            type="link"
            size="small"
            onClick={() => navigate({ to: `/group-batches/${id}`, params: { id: String(id) } })}
          >
            {batch.batch_no}
          </Button>
        ) : '-'
      },
    },
    {
      title: '商品SKU',
      dataIndex: 'product_sku',
      key: 'product_sku',
      width: 120,
    },
    {
      title: '商品名称',
      dataIndex: 'product_name',
      key: 'product_name',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <StatusBadge status={status} type="arrival" />,
    },
    {
      title: '预计数量',
      dataIndex: 'expected_quantity',
      key: 'expected_quantity',
      width: 100,
      align: 'right' as const,
    },
    {
      title: '实际数量',
      dataIndex: 'actual_quantity',
      key: 'actual_quantity',
      width: 100,
      align: 'right' as const,
    },
    {
      title: '短少数量',
      dataIndex: 'shortage_quantity',
      key: 'shortage_quantity',
      width: 100,
      align: 'right' as const,
      render: (qty: number) => qty > 0 ? <Tag color="red">{qty}</Tag> : '0',
    },
    {
      title: '单价',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 100,
      align: 'right' as const,
      render: (price: number) => `¥${price?.toFixed(2) || '0.00'}`,
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
      title: '到货时间',
      dataIndex: 'arrival_time',
      key: 'arrival_time',
      width: 160,
      render: (time: string) => time ? dayjs(time).format('MM-DD HH:mm') : '-',
    },
    {
      title: '异常',
      dataIndex: 'has_exception',
      key: 'has_exception',
      width: 80,
      render: (has: number) => has ? <Tag color="red">有</Tag> : <Tag color="green">无</Tag>,
    },
    {
      title: '操作人',
      dataIndex: 'warehouse_operator',
      key: 'warehouse_operator',
      width: 100,
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, record: ArrivalList) => (
        <Space size="small">
          {record.status === 'pending' && (
            <Button
              type="link"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleConfirm(record)}
            >
              确认到货
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
            title="确定删除这条到货清单吗？"
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
        <h1 className="page-title">到货清单管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          添加到货
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Form form={searchForm} layout="inline" className="filter-form" onFinish={handleSearch}>
          <Form.Item name="keyword" label="关键词">
            <Input placeholder="商品SKU/名称" allowClear style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="全部状态" allowClear style={{ width: 140 }}>
              {Object.entries(ArrivalListStatusMap).map(([value, label]) => (
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
          scroll={{ x: 1400 }}
        />
      </Card>

      <Modal
        title={editingItem ? '编辑到货清单' : '添加到货清单'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false)
          setEditingItem(null)
        }}
        width={600}
        okText="保存"
        cancelText="取消"
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} layout="vertical">
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
          <Form.Item
            name="product_id"
            label="商品"
            rules={[{ required: true, message: '请选择商品' }]}
          >
            <Select placeholder="请选择商品" showSearch optionFilterProp="children">
              {products?.list.map((product: any) => (
                <Option key={product.id} value={product.id}>
                  [{product.sku}] {product.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="expected_quantity"
                label="预计数量"
                rules={[{ required: true, message: '请输入预计数量' }]}
              >
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="unit_price"
                label="单价"
                rules={[{ required: true, message: '请输入单价' }]}
              >
                <Input type="number" step="0.01" min={0} prefix="¥" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="status" label="状态">
            <Select>
              {Object.entries(ArrivalListStatusMap).map(([value, label]) => (
                <Option key={value} value={value}>{label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="确认到货"
        open={confirmModalVisible}
        onOk={handleConfirmSubmit}
        onCancel={() => {
          setConfirmModalVisible(false)
          setConfirmingItem(null)
        }}
        okText="确认到货"
        cancelText="取消"
        confirmLoading={confirmMutation.isPending}
      >
        {confirmingItem && (
          <div>
            <p><strong>商品：</strong>{confirmingItem.product_name}</p>
            <p><strong>SKU：</strong>{confirmingItem.product_sku}</p>
            <p><strong>预计数量：</strong>{confirmingItem.expected_quantity} 件</p>
            <Form form={confirmForm} layout="vertical">
              <Form.Item
                name="actual_quantity"
                label="实际到货数量"
                rules={[{ required: true, message: '请输入实际到货数量' }]}
              >
                <Input type="number" min={0} />
              </Form.Item>
              <Form.Item
                name="create_exception_on_shortage"
                label="短少时自动生成异常单"
                valuePropName="checked"
              >
                <Select>
                  <Option value={true}>是</Option>
                  <Option value={false}>否</Option>
                </Select>
              </Form.Item>
              <Form.Item name="remark" label="备注">
                <Input.TextArea rows={3} placeholder="请输入备注" />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  )
}
