import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Table, Button, Input, Select, Space, Modal, Form, DatePicker, message, Popconfirm, Tag, Row, Col, Card } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import { useNavigate } from '@tanstack/react-router'
import dayjs from 'dayjs'
import { groupBatchApi } from '../../api'
import { GroupBatch, GroupBatchStatusMap, StatusColorMap } from '../../types'
import { useAppStore } from '../../store'
import StatusBadge from '../../components/StatusBadge'

const { RangePicker } = DatePicker
const { Option } = Select

export default function GroupBatchList() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { currentOperator } = useAppStore()
  const [form] = Form.useForm()
  const [searchForm] = Form.useForm()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<GroupBatch | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['group-batches', page, pageSize, keyword, statusFilter],
    queryFn: () => groupBatchApi.list({
      page,
      page_size: pageSize,
      keyword,
      status: statusFilter,
    }),
  })

  const createMutation = useMutation({
    mutationFn: (values: Partial<GroupBatch>) => groupBatchApi.create(values),
    onSuccess: () => {
      message.success('创建成功')
      setModalVisible(false)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['group-batches'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: Partial<GroupBatch> }) =>
      groupBatchApi.update(id, values),
    onSuccess: () => {
      message.success('更新成功')
      setModalVisible(false)
      setEditingItem(null)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['group-batches'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => groupBatchApi.delete(id),
    onSuccess: () => {
      message.success('删除成功')
      queryClient.invalidateQueries({ queryKey: ['group-batches'] })
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
      operator: currentOperator,
    })
    setModalVisible(true)
  }

  const handleEdit = (record: GroupBatch) => {
    setEditingItem(record)
    form.setFieldsValue({
      ...record,
      group_start_time: record.group_start_time ? dayjs(record.group_start_time) : undefined,
      group_end_time: record.group_end_time ? dayjs(record.group_end_time) : undefined,
      expected_arrival_time: record.expected_arrival_time ? dayjs(record.expected_arrival_time) : undefined,
      actual_arrival_time: record.actual_arrival_time ? dayjs(record.actual_arrival_time) : undefined,
      pickup_deadline: record.pickup_deadline ? dayjs(record.pickup_deadline) : undefined,
    })
    setModalVisible(true)
  }

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const formattedValues = {
        ...values,
        group_start_time: values.group_start_time?.toISOString(),
        group_end_time: values.group_end_time?.toISOString(),
        expected_arrival_time: values.expected_arrival_time?.toISOString(),
        actual_arrival_time: values.actual_arrival_time?.toISOString(),
        pickup_deadline: values.pickup_deadline?.toISOString(),
      }

      if (editingItem) {
        updateMutation.mutate({ id: editingItem.id!, values: formattedValues })
      } else {
        createMutation.mutate(formattedValues)
      }
    })
  }

  const columns = [
    {
      title: '团单号',
      dataIndex: 'batch_no',
      key: 'batch_no',
      width: 140,
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: '团单名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <StatusBadge status={status} type="group" />,
    },
    {
      title: '开团时间',
      dataIndex: 'group_start_time',
      key: 'group_start_time',
      width: 160,
      render: (time: string) => time ? dayjs(time).format('MM-DD HH:mm') : '-',
    },
    {
      title: '预计到货',
      dataIndex: 'expected_arrival_time',
      key: 'expected_arrival_time',
      width: 160,
      render: (time: string) => time ? dayjs(time).format('MM-DD HH:mm') : '-',
    },
    {
      title: '实际到货',
      dataIndex: 'actual_arrival_time',
      key: 'actual_arrival_time',
      width: 160,
      render: (time: string) => time ? dayjs(time).format('MM-DD HH:mm') : '-',
    },
    {
      title: '订单数',
      dataIndex: 'total_orders',
      key: 'total_orders',
      width: 80,
      align: 'right' as const,
    },
    {
      title: '总金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 100,
      align: 'right' as const,
      render: (amount: number) => `¥${amount?.toFixed(2) || '0.00'}`,
    },
    {
      title: '提货点',
      dataIndex: 'pickup_point',
      key: 'pickup_point',
      ellipsis: true,
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      key: 'operator',
      width: 100,
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: GroupBatch) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate({ to: `/group-batches/${record.id}`, params: { id: String(record.id) } })}
          >
            详情
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
            title="确定删除这个团购批次吗？"
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
        <h1 className="page-title">团购批次管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新建团单
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Form form={searchForm} layout="inline" className="filter-form" onFinish={handleSearch}>
          <Form.Item name="keyword" label="关键词">
            <Input placeholder="团单号/团单名称" allowClear style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="全部状态" allowClear style={{ width: 140 }}>
              {Object.entries(GroupBatchStatusMap).map(([value, label]) => (
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
        title={editingItem ? '编辑团购批次' : '新建团购批次'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false)
          setEditingItem(null)
        }}
        width={800}
        okText="保存"
        cancelText="取消"
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="batch_no"
                label="团单号"
                rules={[{ required: true, message: '请输入团单号' }]}
              >
                <Input placeholder="自动生成或手动输入" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select>
                  {Object.entries(GroupBatchStatusMap).map(([value, label]) => (
                    <Option key={value} value={value}>{label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="name"
            label="团单名称"
            rules={[{ required: true, message: '请输入团单名称' }]}
          >
            <Input placeholder="请输入团单名称" />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="group_start_time" label="开团时间">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="group_end_time" label="截团时间">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="expected_arrival_time" label="预计到货时间">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="actual_arrival_time" label="实际到货时间">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="pickup_deadline" label="提货截止时间">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item name="total_orders" label="订单总数">
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="total_items" label="商品总件数">
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="total_amount" label="总金额">
                <Input type="number" step="0.01" min={0} prefix="¥" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="pickup_point" label="提货点">
            <Input placeholder="请输入提货点地址" />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="contact_person" label="联系人">
                <Input placeholder="请输入联系人" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="contact_phone" label="联系电话">
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
          <Form.Item name="operator" label="操作人">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
