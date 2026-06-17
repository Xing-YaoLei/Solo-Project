import { createLazyFileRoute } from '@tanstack/react-router'
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Modal,
  Form,
  InputNumber,
  DatePicker,
  Drawer,
  Descriptions,
  Tabs,
  message,
  Popconfirm,
  Row,
  Col,
  Typography,
  Divider,
  Alert,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { billApi, approvalApi, validationApi, timelineApi } from '@/api'
import type { Bill, BillItem, PaginationParams } from '@/types'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useState, useMemo } from 'react'
import StatusTimelineComponent from '@/components/StatusTimeline'

// @ts-ignore
export const Route = createLazyFileRoute('/bills')({
  component: BillsPage,
})

const { Title, Text } = Typography
const { Option } = Select
const { TextArea } = Input

const BILL_STATUS_MAP: Record<string, { text: string; color: string }> = {
  draft: { text: '草稿', color: 'default' },
  pending: { text: '待审批', color: 'warning' },
  processing: { text: '审批中', color: 'processing' },
  approved: { text: '已审批', color: 'success' },
  rejected: { text: '已驳回', color: 'error' },
  completed: { text: '已完成', color: 'success' },
}

const BILL_TYPE_MAP: Record<string, string> = {
  measurement: '量房单',
  quotation: '报价单',
  material: '材料单',
  labor: '人工费单',
  other: '其他',
}

const BILL_TYPE_OPTIONS = Object.entries(BILL_TYPE_MAP).map(([value, label]) => ({
  value,
  label,
}))

const BILL_STATUS_OPTIONS = Object.entries(BILL_STATUS_MAP).map(([value, { text }]) => ({
  value,
  label: text,
}))

interface BillFormData {
  bill_name: string
  bill_type: string
  total_amount: number
  paid_amount: number
  due_date?: Dayjs
  remark?: string
  items: Partial<BillItem>[]
}

function BillsPage() {
  const queryClient = useQueryClient()
  const [pagination, setPagination] = useState({ page: 1, page_size: 10 })
  const [filters, setFilters] = useState<PaginationParams>({})
  const [modalOpen, setModalOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingBill, setEditingBill] = useState<Bill | null>(null)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [form] = Form.useForm<BillFormData>()

  const { data, isLoading } = useQuery({
    queryKey: ['bills', 'list', pagination, filters],
    queryFn: () => billApi.getList({ ...pagination, ...filters }),
  })

  const { data: billDetail } = useQuery({
    queryKey: ['bill', selectedBill?.id],
    queryFn: () => selectedBill ? billApi.getDetail(selectedBill.id) : null,
    enabled: !!selectedBill,
  })

  const { data: approvalRecords } = useQuery({
    queryKey: ['approval-records', selectedBill?.id],
    queryFn: () => selectedBill ? approvalApi.getRecordsByBill(selectedBill.id) : [],
    enabled: !!selectedBill,
  })

  const { data: timelineData } = useQuery({
    queryKey: ['timeline', selectedBill?.id],
    queryFn: () => selectedBill ? timelineApi.getByBill(selectedBill.id) : [],
    enabled: !!selectedBill,
  })

  const createMutation = useMutation({
    mutationFn: (data: Partial<Bill> & { items?: Partial<BillItem>[] }) => billApi.create(data),
    onSuccess: () => {
      message.success('单据创建成功')
      setModalOpen(false)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['bills', 'list'] })
    },
    onError: () => message.error('单据创建失败'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Bill> }) => billApi.update(id, data),
    onSuccess: () => {
      message.success('单据更新成功')
      setModalOpen(false)
      setEditingBill(null)
      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['bills', 'list'] })
    },
    onError: () => message.error('单据更新失败'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => billApi.delete(id),
    onSuccess: () => {
      message.success('单据删除成功')
      queryClient.invalidateQueries({ queryKey: ['bills', 'list'] })
    },
    onError: () => message.error('单据删除失败'),
  })

  const validateAmountMutation = useMutation({
    mutationFn: (billId: number) => validationApi.validateBill(billId),
    onSuccess: (result) => {
      if (result.is_valid) {
        message.success('金额校验通过')
      } else {
        message.warning(`金额校验不通过，差异: ¥${result.diff_amount.toLocaleString()}`)
      }
    },
  })

  const items = Form.useWatch('items', form)

  const totalItemsAmount = useMemo(() => {
    return items?.reduce((sum, item) => sum + (item.actual_amount || 0), 0) || 0
  }, [items])

  const totalAmount = Form.useWatch('total_amount', form)

  const amountMismatch = useMemo(() => {
    if (!totalAmount || totalAmount === 0) return false
    return Math.abs(totalAmount - totalItemsAmount) > 0.01
  }, [totalAmount, totalItemsAmount])

  const handleSearch = (value: string) => {
    setFilters({ ...filters, keyword: value })
    setPagination({ ...pagination, page: 1 })
  }

  const handleStatusFilter = (value: string | undefined) => {
    setFilters({ ...filters, status: value || undefined })
    setPagination({ ...pagination, page: 1 })
  }

  const handleCreate = () => {
    setEditingBill(null)
    form.resetFields()
    form.setFieldsValue({
      bill_type: 'material',
      total_amount: 0,
      paid_amount: 0,
      items: [
        { item_name: '', quantity: 1, unit_price: 0, discount_rate: 100, actual_amount: 0, sort_order: 0 },
      ],
    })
    setModalOpen(true)
  }

  const handleEdit = (bill: Bill) => {
    setEditingBill(bill)
    form.setFieldsValue({
      bill_name: bill.bill_name,
      bill_type: bill.bill_type,
      total_amount: bill.total_amount,
      paid_amount: bill.paid_amount,
      due_date: bill.due_date ? dayjs(bill.due_date) : undefined,
      remark: bill.remark,
      items: bill.items?.length ? bill.items : [
        { item_name: '', quantity: 1, unit_price: 0, discount_rate: 100, actual_amount: 0, sort_order: 0 },
      ],
    })
    setModalOpen(true)
  }

  const handleView = (bill: Bill) => {
    setSelectedBill(bill)
    setDrawerOpen(true)
  }

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      
      if (amountMismatch) {
        Modal.confirm({
          title: '金额不一致',
          content: `单据总金额(¥${totalAmount?.toLocaleString()})与明细合计(¥${totalItemsAmount.toLocaleString()})不一致，是否继续提交？`,
          icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
          okText: '继续提交',
          cancelText: '返回修改',
          onOk: () => submitBill(values),
        })
        return
      }

      submitBill(values)
    } catch {
      message.error('请检查表单填写是否完整')
    }
  }

  const submitBill = (values: BillFormData) => {
    const items = values.items.map((item, index) => ({
      item_name: item.item_name,
      item_code: item.item_code,
      specification: item.specification,
      unit: item.unit,
      quantity: item.quantity || 0,
      unit_price: item.unit_price || 0,
      discount_rate: item.discount_rate || 100,
      remark: item.remark,
      subtotal: (item.quantity || 0) * (item.unit_price || 0),
      actual_amount: ((item.quantity || 0) * (item.unit_price || 0)) * (item.discount_rate || 100) / 100,
      sort_order: index,
    }))

    const data: any = {
      bill_name: values.bill_name,
      bill_type: values.bill_type,
      total_amount: values.total_amount,
      paid_amount: values.paid_amount,
      due_date: values.due_date ? dayjs(values.due_date).format('YYYY-MM-DD') : undefined,
      remark: values.remark,
      items,
    }

    if (editingBill) {
      updateMutation.mutate({ id: editingBill.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleAddItem = () => {
    const currentItems = form.getFieldValue('items') || []
    form.setFieldsValue({
      items: [
        ...currentItems,
        {
          item_name: '',
          quantity: 1,
          unit_price: 0,
          discount_rate: 100,
          actual_amount: 0,
          sort_order: currentItems.length,
        },
      ],
    })
  }

  const handleRemoveItem = (index: number) => {
    const currentItems = form.getFieldValue('items') || []
    if (currentItems.length <= 1) {
      message.warning('至少保留一条明细项')
      return
    }
    form.setFieldsValue({
      items: currentItems.filter((_: any, i: number) => i !== index),
    })
  }

  const handleValidate = async () => {
    try {
      const values = await form.validateFields()
      const itemsAmount = values.items.reduce((sum, item) => sum + (item.actual_amount || 0), 0)
      
      const result = await validationApi.validateAmount({
        contract_id: 0,
        bill_id: editingBill?.id,
        expected_amount: values.total_amount,
        actual_amount: itemsAmount,
        description: '表单实时校验',
      })

      if (result.is_valid) {
        message.success(result.message)
      } else {
        message.warning(result.message)
      }
    } catch {
      message.error('请先填写完整表单')
    }
  }

  const columns = [
    {
      title: '单据编号',
      dataIndex: 'bill_no',
      key: 'bill_no',
      width: 140,
    },
    {
      title: '单据名称',
      dataIndex: 'bill_name',
      key: 'bill_name',
      ellipsis: true,
    },
    {
      title: '单据类型',
      dataIndex: 'bill_type',
      key: 'bill_type',
      width: 100,
      render: (type: string) => BILL_TYPE_MAP[type] || type,
    },
    {
      title: '总金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 120,
      render: (val: number) => (
        <span className="amount-highlight">¥{val.toLocaleString()}</span>
      ),
    },
    {
      title: '已付',
      dataIndex: 'paid_amount',
      key: 'paid_amount',
      width: 120,
      render: (val: number) => (
        <span className="amount-highlight">¥{val.toLocaleString()}</span>
      ),
    },
    {
      title: '未付',
      dataIndex: 'unpaid_amount',
      key: 'unpaid_amount',
      width: 120,
      render: (val: number) => (
        <span className={val > 0 ? 'amount-warning' : 'amount-highlight'}>
          ¥{val.toLocaleString()}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config = BILL_STATUS_MAP[status] || { text: status, color: 'default' }
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: '到期日',
      dataIndex: 'due_date',
      key: 'due_date',
      width: 110,
      render: (val: string) => (val ? dayjs(val).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      fixed: 'right' as const,
      render: (_: any, record: Bill) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
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
            title="确认删除"
            description="删除后数据无法恢复，确认删除吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
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

  const itemColumns = [
    {
      title: '序号',
      key: 'index',
      width: 60,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: '项目名称',
      dataIndex: 'item_name',
      key: 'item_name',
      width: 150,
      editable: true,
    },
    {
      title: '项目编码',
      dataIndex: 'item_code',
      key: 'item_code',
      width: 100,
      editable: true,
    },
    {
      title: '规格',
      dataIndex: 'specification',
      key: 'specification',
      width: 100,
      editable: true,
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 60,
      editable: true,
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 90,
      editable: true,
    },
    {
      title: '单价(¥)',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 100,
      editable: true,
    },
    {
      title: '小计(¥)',
      key: 'subtotal',
      width: 100,
      render: (_: any, record: Partial<BillItem>) => {
        const subtotal = (record.quantity || 0) * (record.unit_price || 0)
        return <span>¥{subtotal.toLocaleString()}</span>
      },
    },
    {
      title: '折扣(%)',
      dataIndex: 'discount_rate',
      key: 'discount_rate',
      width: 80,
      editable: true,
    },
    {
      title: '实付(¥)',
      dataIndex: 'actual_amount',
      key: 'actual_amount',
      width: 100,
      render: (_: any, record: Partial<BillItem>) => {
        const subtotal = (record.quantity || 0) * (record.unit_price || 0)
        const actual = subtotal * (record.discount_rate || 100) / 100
        return <span className="font-medium">¥{actual.toLocaleString()}</span>
      },
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 100,
      editable: true,
    },
    {
      title: '操作',
      key: 'actions',
      width: 60,
      render: (_: any, __: any, index: number) => (
        <Button
          type="text"
          danger
          icon={<MinusCircleOutlined />}
          onClick={() => handleRemoveItem(index)}
        />
      ),
    },
  ]

  const recordColumns = [
    {
      title: '审批节点',
      dataIndex: ['node', 'node_name'],
      key: 'node_name',
      width: 120,
    },
    {
      title: '审批人',
      dataIndex: ['approver', 'full_name'],
      key: 'approver',
      width: 100,
      render: (name: string) => name || '-',
    },
    {
      title: '状态',
      dataIndex: 'approval_status',
      key: 'approval_status',
      width: 100,
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          pending: 'warning',
          processing: 'processing',
          approved: 'success',
          rejected: 'error',
        }
        const textMap: Record<string, string> = {
          pending: '待审批',
          processing: '审批中',
          approved: '已通过',
          rejected: '已驳回',
        }
        return <Tag color={colorMap[status] || 'default'}>{textMap[status] || status}</Tag>
      },
    },
    {
      title: '审批意见',
      dataIndex: 'approval_opinion',
      key: 'approval_opinion',
      render: (opinion: string) => opinion || '-',
    },
    {
      title: '审批时间',
      dataIndex: 'approved_at',
      key: 'approved_at',
      width: 160,
      render: (time: string) => (time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
  ]

  const drawerTabs = [
    {
      key: 'info',
      label: '单据信息',
      children: billDetail && (
        <div className="space-y-4">
          <Descriptions title="基本信息" bordered column={2}>
            <Descriptions.Item label="单据编号">{billDetail.bill_no}</Descriptions.Item>
            <Descriptions.Item label="单据名称">{billDetail.bill_name}</Descriptions.Item>
            <Descriptions.Item label="单据类型">
              {BILL_TYPE_MAP[billDetail.bill_type] || billDetail.bill_type}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={BILL_STATUS_MAP[billDetail.status]?.color || 'default'}>
                {BILL_STATUS_MAP[billDetail.status]?.text || billDetail.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="总金额">
              <span className="amount-highlight">¥{billDetail.total_amount.toLocaleString()}</span>
            </Descriptions.Item>
            <Descriptions.Item label="已付金额">
              <span className="amount-highlight">¥{billDetail.paid_amount.toLocaleString()}</span>
            </Descriptions.Item>
            <Descriptions.Item label="未付金额">
              <span className={billDetail.unpaid_amount > 0 ? 'amount-warning' : 'amount-highlight'}>
                ¥{billDetail.unpaid_amount.toLocaleString()}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="到期日">
              {billDetail.due_date ? dayjs(billDetail.due_date).format('YYYY-MM-DD') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {dayjs(billDetail.created_at).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {dayjs(billDetail.updated_at).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            {billDetail.remark && (
              <Descriptions.Item label="备注" span={2}>
                {billDetail.remark}
              </Descriptions.Item>
            )}
          </Descriptions>

          <Divider />

          <Card title="明细项" size="small">
            <Table
              dataSource={billDetail.items || []}
              rowKey="id"
              size="small"
              pagination={false}
              scroll={{ x: 800 }}
              columns={[
                { title: '序号', key: 'index', width: 60, render: (_: any, __: any, i: number) => i + 1 },
                { title: '项目名称', dataIndex: 'item_name', key: 'item_name' },
                { title: '规格', dataIndex: 'specification', key: 'specification', width: 100 },
                { title: '单位', dataIndex: 'unit', key: 'unit', width: 60 },
                { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 70 },
                { title: '单价', dataIndex: 'unit_price', key: 'unit_price', width: 90, render: (v: number) => `¥${v.toLocaleString()}` },
                { title: '小计', key: 'subtotal', width: 100, render: (_: any, r: BillItem) => `¥${(r.quantity * r.unit_price).toLocaleString()}` },
                { title: '折扣', dataIndex: 'discount_rate', key: 'discount_rate', width: 70, render: (v: number) => `${v}%` },
                { title: '实付', dataIndex: 'actual_amount', key: 'actual_amount', width: 100, render: (v: number) => `¥${v.toLocaleString()}` },
                { title: '备注', dataIndex: 'remark', key: 'remark' },
              ]}
            />
            <div className="mt-3 text-right">
              <Text strong>
                明细合计:{' '}
                <span className="amount-highlight">
                  ¥{(billDetail.items?.reduce((sum, item) => sum + item.actual_amount, 0) || 0).toLocaleString()}
                </span>
              </Text>
            </div>
          </Card>
        </div>
      ),
    },
    {
      key: 'approvals',
      label: '审批记录',
      children: (
        <Table
          dataSource={approvalRecords || []}
          columns={recordColumns}
          rowKey="id"
          size="small"
          pagination={false}
          locale={{ emptyText: '暂无审批记录' }}
        />
      ),
    },
    {
      key: 'timeline',
      label: '状态时间线',
      children: <StatusTimelineComponent data={timelineData || []} />,
    },
  ]

  return (
    <div className="space-y-6">
      <Card
        title="单据管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新建单据
          </Button>
        }
      >
        <div className="mb-4 flex flex-wrap gap-3">
          <Input.Search
            placeholder="搜索单据编号/名称"
            allowClear
            enterButton={<SearchOutlined />}
            onSearch={handleSearch}
            style={{ width: 280 }}
          />
          <Select
            placeholder="筛选状态"
            allowClear
            style={{ width: 160 }}
            onChange={handleStatusFilter}
          >
            {BILL_STATUS_OPTIONS.map((opt) => (
              <Option key={opt.value} value={opt.value}>
                {opt.label}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="筛选类型"
            allowClear
            style={{ width: 160 }}
            onChange={(value) => setFilters({ ...filters, status: undefined, ...(value ? { bill_type: value } : {}) } as any)}
          >
            {BILL_TYPE_OPTIONS.map((opt) => (
              <Option key={opt.value} value={opt.value}>
                {opt.label}
              </Option>
            ))}
          </Select>
          <Button onClick={() => { setFilters({}); setPagination({ page: 1, page_size: 10 }) }}>
            重置筛选
          </Button>
        </div>

        <Table
          dataSource={data?.items || []}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1200 }}
          rowClassName={(record) => record.unpaid_amount > 0 ? 'bg-warning-light' : ''}
          pagination={{
            current: pagination.page,
            pageSize: pagination.page_size,
            total: data?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, page_size) => setPagination({ page, page_size }),
          }}
        />
      </Card>

      <Modal
        title={editingBill ? '编辑单据' : '新建单据'}
        open={modalOpen}
        width={1000}
        onOk={handleSubmit}
        onCancel={() => { setModalOpen(false); setEditingBill(null) }}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        okText="保存"
        cancelText="取消"
      >
        {amountMismatch && (
          <Alert
            message="金额校验提醒"
            description={`单据总金额(¥${totalAmount?.toLocaleString()})与明细合计(¥${totalItemsAmount.toLocaleString()})不一致，请检查`}
            type="warning"
            showIcon
            className="mb-4"
          />
        )}

        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="bill_name"
                label="单据名称"
                rules={[{ required: true, message: '请输入单据名称' }]}
              >
                <Input placeholder="请输入单据名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="bill_type"
                label="单据类型"
                rules={[{ required: true, message: '请选择单据类型' }]}
              >
                <Select placeholder="请选择单据类型">
                  {BILL_TYPE_OPTIONS.map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="total_amount"
                label="总金额(¥)"
                rules={[{ required: true, message: '请输入总金额' }]}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                  placeholder="请输入总金额"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="paid_amount"
                label="已付金额(¥)"
                rules={[{ required: true, message: '请输入已付金额' }]}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                  placeholder="请输入已付金额"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="due_date" label="到期日">
                <DatePicker style={{ width: '100%' }} placeholder="请选择到期日" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="remark" label="备注">
            <TextArea rows={2} placeholder="请输入备注信息" />
          </Form.Item>

          <Divider orientation="left">
            <Space>
              <Title level={5} style={{ margin: 0 }}>
                明细项
              </Title>
              <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleAddItem}>
                添加明细
              </Button>
              <Button size="small" onClick={handleValidate} icon={<CheckCircleOutlined />}>
                校验金额
              </Button>
              <Text type={amountMismatch ? 'warning' : 'success'}>
                明细合计: ¥{totalItemsAmount.toLocaleString()}
              </Text>
            </Space>
          </Divider>

          <Form.List name="items">
            {(_fields) => (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      {itemColumns.map((col) => (
                        <th
                          key={col.key}
                          className="p-2 border border-gray-200 text-left text-sm font-medium text-gray-700"
                          style={{ width: col.width }}
                        >
                          {col.title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items?.map((_: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="p-2 border border-gray-200 text-center">{index + 1}</td>
                        <td className="p-2 border border-gray-200">
                          <Form.Item
                            name={[index, 'item_name']}
                            rules={[{ required: true, message: '请输入项目名称' }]}
                            style={{ margin: 0 }}
                          >
                            <Input size="small" placeholder="项目名称" />
                          </Form.Item>
                        </td>
                        <td className="p-2 border border-gray-200">
                          <Form.Item name={[index, 'item_code']} style={{ margin: 0 }}>
                            <Input size="small" placeholder="编码" />
                          </Form.Item>
                        </td>
                        <td className="p-2 border border-gray-200">
                          <Form.Item name={[index, 'specification']} style={{ margin: 0 }}>
                            <Input size="small" placeholder="规格" />
                          </Form.Item>
                        </td>
                        <td className="p-2 border border-gray-200">
                          <Form.Item name={[index, 'unit']} style={{ margin: 0 }}>
                            <Input size="small" placeholder="单位" />
                          </Form.Item>
                        </td>
                        <td className="p-2 border border-gray-200">
                          <Form.Item
                            name={[index, 'quantity']}
                            rules={[{ required: true, message: '请输入数量' }]}
                            style={{ margin: 0 }}
                          >
                            <InputNumber
                              min={0}
                              precision={2}
                              size="small"
                              style={{ width: '100%' }}
                              placeholder="0"
                            />
                          </Form.Item>
                        </td>
                        <td className="p-2 border border-gray-200">
                          <Form.Item
                            name={[index, 'unit_price']}
                            rules={[{ required: true, message: '请输入单价' }]}
                            style={{ margin: 0 }}
                          >
                            <InputNumber
                              min={0}
                              precision={2}
                              size="small"
                              style={{ width: '100%' }}
                              placeholder="0"
                            />
                          </Form.Item>
                        </td>
                        <td className="p-2 border border-gray-200 text-center">
                          {(((items?.[index]?.quantity || 0) * (items?.[index]?.unit_price || 0)) || 0).toLocaleString()}
                        </td>
                        <td className="p-2 border border-gray-200">
                          <Form.Item
                            name={[index, 'discount_rate']}
                            initialValue={100}
                            style={{ margin: 0 }}
                          >
                            <InputNumber
                              min={0}
                              max={100}
                              size="small"
                              style={{ width: '100%' }}
                              placeholder="100"
                            />
                          </Form.Item>
                        </td>
                        <td className="p-2 border border-gray-200 text-center font-medium">
                          {((((items?.[index]?.quantity || 0) * (items?.[index]?.unit_price || 0)) * (items?.[index]?.discount_rate || 100)) / 100 || 0).toLocaleString()}
                        </td>
                        <td className="p-2 border border-gray-200">
                          <Form.Item name={[index, 'remark']} style={{ margin: 0 }}>
                            <Input size="small" placeholder="备注" />
                          </Form.Item>
                        </td>
                        <td className="p-2 border border-gray-200 text-center">
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<MinusCircleOutlined />}
                            onClick={() => handleRemoveItem(index)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Form.List>
        </Form>
      </Modal>

      <Drawer
        title="单据详情"
        placement="right"
        width={800}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setSelectedBill(null) }}
        extra={
          <Space>
            {selectedBill && (
              <>
                <Button icon={<CheckCircleOutlined />} onClick={() => validateAmountMutation.mutate(selectedBill.id)}>
                  校验金额
                </Button>
                <Button icon={<EditOutlined />} onClick={() => { setDrawerOpen(false); handleEdit(selectedBill) }}>
                  编辑
                </Button>
              </>
            )}
          </Space>
        }
      >
        <Tabs items={drawerTabs} defaultActiveKey="info" />
      </Drawer>
    </div>
  )
}
